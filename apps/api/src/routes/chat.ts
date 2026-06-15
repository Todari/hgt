import { Hono } from "hono";
import { and, desc, eq, isNull, lt, ne, or } from "drizzle-orm";
import { z } from "zod";
import { sendMessageSchema } from "@hgt-client/contract";
import { db } from "../db/client";
import { conversations, messages, users, blocks } from "../db/schema";
import { sendPush } from "../push/send";
import { broadcastToUser } from "../ws/registry";
import { ok, fail } from "../lib/response";
import { toPartnerUser } from "../lib/public-user";
import { rateLimit } from "../lib/rate-limit";
import { isBlocked } from "../lib/blocks";
import { containsBlockedContent } from "../lib/content-filter";
import type { AppEnv } from "../types";

export const chatRoutes = new Hono<AppEnv>();

/** `?before` pagination cursor — must be an ISO 8601 datetime. */
const beforeCursorSchema = z.string().datetime({ offset: true });

function serializeMessage(m: typeof messages.$inferSelect) {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt ? m.readAt.toISOString() : null,
  };
}

/** Returns the conversation only if `meId` is a participant. */
async function participantConversation(meId: string, convId: string) {
  // Non-uuid ids would make Postgres throw — treat them as "not found".
  if (!z.string().uuid().safeParse(convId).success) return null;
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, convId)).limit(1);
  if (!conv || (conv.userAId !== meId && conv.userBId !== meId)) return null;
  return conv;
}

// GET /conversations — my conversations with partner + last message.
chatRoutes.get("/conversations", async (c) => {
  const me = c.get("user");
  // Hide conversations with anyone I've blocked / who blocked me.
  const blockRows = await db
    .select()
    .from(blocks)
    .where(or(eq(blocks.blockerId, me.id), eq(blocks.blockedId, me.id)));
  const blockedIds = new Set(
    blockRows.flatMap((b) => [b.blockerId, b.blockedId]).filter((id) => id !== me.id),
  );
  const convs = await db
    .select()
    .from(conversations)
    .where(or(eq(conversations.userAId, me.id), eq(conversations.userBId, me.id)))
    .orderBy(desc(conversations.createdAt));

  const result = [];
  for (const conv of convs) {
    const partnerId = conv.userAId === me.id ? conv.userBId : conv.userAId;
    if (blockedIds.has(partnerId)) continue;
    const [partner] = await db.select().from(users).where(eq(users.id, partnerId)).limit(1);
    if (!partner) continue;
    const [last] = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conv.id))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    const unreadCount = await db.$count(
      messages,
      and(eq(messages.conversationId, conv.id), ne(messages.senderId, me.id), isNull(messages.readAt)),
    );
    result.push({
      id: conv.id,
      partner: toPartnerUser(partner),
      lastMessage: last ? serializeMessage(last) : null,
      unreadCount,
      createdAt: conv.createdAt.toISOString(),
    });
  }
  return ok(c, result);
});

// GET /conversations/:id/messages — full history (oldest first).
chatRoutes.get("/conversations/:id/messages", async (c) => {
  const me = c.get("user");
  const conv = await participantConversation(me.id, c.req.param("id"));
  if (!conv) return fail(c, "대화를 찾을 수 없습니다.", 404);

  // Optional pagination (?limit & ?before=ISO). No params → full history, oldest-first.
  const limitParam = Number(c.req.query("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : null;
  const beforeRaw = c.req.query("before");
  let before: Date | undefined;
  if (beforeRaw !== undefined) {
    const parsedBefore = beforeCursorSchema.safeParse(beforeRaw);
    if (!parsedBefore.success) {
      return fail(c, "before는 ISO 8601 형식의 날짜여야 합니다.", 400);
    }
    before = new Date(parsedBefore.data);
  }
  const where = and(
    eq(messages.conversationId, conv.id),
    before ? lt(messages.createdAt, before) : undefined,
  );

  if (limit) {
    // newest `limit` (before the cursor), returned oldest-first
    const rows = await db.select().from(messages).where(where).orderBy(desc(messages.createdAt)).limit(limit);
    return ok(c, rows.reverse().map(serializeMessage));
  }
  const rows = await db.select().from(messages).where(where).orderBy(messages.createdAt);
  return ok(c, rows.map(serializeMessage));
});

// POST /conversations/:id/messages — send a message (persist → realtime → push).
chatRoutes.post("/conversations/:id/messages", async (c) => {
  const me = c.get("user");

  // Flood guard: 20/10s burst + 300/h sustained, per user.
  if (
    !rateLimit(`msg:burst:${me.id}`, 20, 10_000) ||
    !rateLimit(`msg:hour:${me.id}`, 300, 3_600_000)
  ) {
    return fail(c, "메시지를 너무 자주 보내고 있어요. 잠시 후 다시 시도해주세요.", 429);
  }

  const conv = await participantConversation(me.id, c.req.param("id"));
  if (!conv) return fail(c, "대화를 찾을 수 없습니다.", 404);

  const parsed = sendMessageSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return fail(c, parsed.error.issues.map((i) => i.message).join(", "), 400);
  }

  const recipientId = conv.userAId === me.id ? conv.userBId : conv.userAId;
  if (await isBlocked(me.id, recipientId)) {
    return fail(c, "차단된 상대와는 대화할 수 없습니다.", 403);
  }

  // Profanity / personal-info filter (wordlist curated by ops).
  if (containsBlockedContent(parsed.data.body)) {
    return fail(c, "부적절한 표현이나 개인정보가 포함되어 있어요.", 400);
  }

  const [row] = await db
    .insert(messages)
    .values({ conversationId: conv.id, senderId: me.id, body: parsed.data.body })
    .returning();
  const message = serializeMessage(row!);

  broadcastToUser(recipientId, { type: "message", message });
  // Notification preview only — keep it short (80 chars max).
  const preview =
    parsed.data.body.length > 80 ? `${parsed.data.body.slice(0, 79)}…` : parsed.data.body;
  void sendPush(recipientId, {
    title: me.name,
    body: preview,
    data: { type: "message", conversationId: conv.id },
  });

  return ok(c, message, 201);
});

// POST /conversations/:id/read — mark the partner's messages as read.
chatRoutes.post("/conversations/:id/read", async (c) => {
  const me = c.get("user");
  const conv = await participantConversation(me.id, c.req.param("id"));
  if (!conv) return fail(c, "대화를 찾을 수 없습니다.", 404);
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(and(eq(messages.conversationId, conv.id), ne(messages.senderId, me.id), isNull(messages.readAt)));
  return ok(c, { read: true });
});
