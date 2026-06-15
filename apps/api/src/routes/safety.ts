import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { blockUserSchema, reportUserSchema } from "@hgt-client/contract";
import { db } from "../db/client";
import { blocks, reports, users } from "../db/schema";
import { ok, fail } from "../lib/response";
import { rateLimit } from "../lib/rate-limit";
import type { AppEnv } from "../types";

export const safetyRoutes = new Hono<AppEnv>();

async function findUser(userId: string) {
  const [row] = await db
    .select({ id: users.id, studentId: users.studentId, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

// POST /me/blocks — block a user (excluded from future matching).
safetyRoutes.post("/me/blocks", async (c) => {
  const me = c.get("user");
  const parsed = blockUserSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return fail(c, parsed.error.issues.map((i) => i.message).join(", "), 400);
  }
  if (parsed.data.userId === me.id) return fail(c, "자기 자신은 차단할 수 없습니다.", 400);
  if (!(await findUser(parsed.data.userId))) {
    return fail(c, "존재하지 않는 사용자입니다.", 404);
  }
  await db
    .insert(blocks)
    .values({ blockerId: me.id, blockedId: parsed.data.userId })
    .onConflictDoNothing();
  return ok(c, { blocked: true }, 201);
});

// DELETE /me/blocks/:userId — unblock.
safetyRoutes.delete("/me/blocks/:userId", async (c) => {
  const me = c.get("user");
  const userId = c.req.param("userId");
  // Non-uuid ids would make Postgres throw — reject them as bad input.
  if (!z.string().uuid().safeParse(userId).success) {
    return fail(c, "잘못된 사용자 ID입니다.", 400);
  }
  await db
    .delete(blocks)
    .where(and(eq(blocks.blockerId, me.id), eq(blocks.blockedId, userId)));
  return ok(c, { unblocked: true });
});

// GET /me/blocks — users I've blocked (id + name, for the management list).
safetyRoutes.get("/me/blocks", async (c) => {
  const me = c.get("user");
  const rows = await db
    .select({ userId: blocks.blockedId, name: users.name })
    .from(blocks)
    .innerJoin(users, eq(blocks.blockedId, users.id))
    .where(eq(blocks.blockerId, me.id));
  return ok(c, rows);
});

// POST /reports — report a user. The reported identity is snapshotted so the
// evidence survives account deletion (FKs are set-null).
safetyRoutes.post("/reports", async (c) => {
  const me = c.get("user");

  if (!rateLimit(`report:${me.id}`, 5, 86_400_000)) {
    return fail(c, "신고는 하루에 5회까지 가능합니다.", 429);
  }

  const parsed = reportUserSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return fail(c, parsed.error.issues.map((i) => i.message).join(", "), 400);
  }
  const reported = await findUser(parsed.data.userId);
  if (!reported) {
    return fail(c, "존재하지 않는 사용자입니다.", 404);
  }
  await db.insert(reports).values({
    reporterId: me.id,
    reportedId: reported.id,
    reportedStudentId: reported.studentId,
    reportedName: reported.name,
    reason: parsed.data.reason,
  });
  return ok(c, { reported: true }, 201);
});
