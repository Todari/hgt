import { Hono } from "hono";
import { and, desc, eq, isNull, lt, ne, or } from "drizzle-orm";
import { sendMessageSchema } from "@hgt-client/contract";
import { db } from "../db/client";
import { conversations, messages, users } from "../db/schema";
import { sendPush } from "../push/send";
import { broadcastToUser } from "../ws/registry";
import { ok, fail } from "../lib/response";
import type { AppEnv, DbUser } from "../types";

export const chatRoutes = new Hono<AppEnv>();

const toPublicUser = ({ session: _session, ...rest }: DbUser) => rest;

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
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, convId)).limit(1);
  if (!conv || (conv.userAId !== meId && conv.userBId !== meId)) return null;
  return conv;
}

// GET /conversations — my conversations with partner + last message.
chatRoutes.get("/conversations", async (c) => {
  const me = c.get("user");
  const convs = await db
    .select()
    .from(conversations)
    .where(or(eq(conversations.userAId, me.id), eq(conversations.userBId, me.id)))
    .orderBy(desc(conversations.createdAt));

  const result = [];
  for (const conv of convs) {
    const partnerId = conv.userAId === me.id ? conv.userBId : conv.userAId;
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
      partner: toPublicUser(partner),
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
  const before = c.req.query("before");
  const where = and(
    eq(messages.conversationId, conv.id),
    before ? lt(messages.createdAt, new Date(before)) : undefined,
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
  const conv = await participantConversation(me.id, c.req.param("id"));
  if (!conv) return fail(c, "대화를 찾을 수 없습니다.", 404);

  const parsed = sendMessageSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return fail(c, parsed.error.issues.map((i) => i.message).join(", "), 400);
  }

  const [row] = await db
    .insert(messages)
    .values({ conversationId: conv.id, senderId: me.id, body: parsed.data.body })
    .returning();
  const message = serializeMessage(row!);
  const recipientId = conv.userAId === me.id ? conv.userBId : conv.userAId;

  broadcastToUser(recipientId, { type: "message", message });
  void sendPush(recipientId, {
    title: me.name,
    body: parsed.data.body,
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
