import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { blockUserSchema, reportUserSchema } from "@hgt-client/contract";
import { db } from "../db/client";
import { blocks, reports } from "../db/schema";
import { ok, fail } from "../lib/response";
import type { AppEnv } from "../types";

export const safetyRoutes = new Hono<AppEnv>();

// POST /me/blocks — block a user (excluded from future matching).
safetyRoutes.post("/me/blocks", async (c) => {
  const me = c.get("user");
  const parsed = blockUserSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return fail(c, parsed.error.issues.map((i) => i.message).join(", "), 400);
  }
  if (parsed.data.userId === me.id) return fail(c, "자기 자신은 차단할 수 없습니다.", 400);
  await db
    .insert(blocks)
    .values({ blockerId: me.id, blockedId: parsed.data.userId })
    .onConflictDoNothing();
  return ok(c, { blocked: true }, 201);
});

// DELETE /me/blocks/:userId — unblock.
safetyRoutes.delete("/me/blocks/:userId", async (c) => {
  const me = c.get("user");
  await db
    .delete(blocks)
    .where(and(eq(blocks.blockerId, me.id), eq(blocks.blockedId, c.req.param("userId"))));
  return ok(c, { unblocked: true });
});

// GET /me/blocks — ids I've blocked.
safetyRoutes.get("/me/blocks", async (c) => {
  const me = c.get("user");
  const rows = await db.select({ userId: blocks.blockedId }).from(blocks).where(eq(blocks.blockerId, me.id));
  return ok(c, rows.map((r) => r.userId));
});

// POST /reports — report a user.
safetyRoutes.post("/reports", async (c) => {
  const me = c.get("user");
  const parsed = reportUserSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return fail(c, parsed.error.issues.map((i) => i.message).join(", "), 400);
  }
  await db.insert(reports).values({
    reporterId: me.id,
    reportedId: parsed.data.userId,
    reason: parsed.data.reason,
  });
  return ok(c, { reported: true }, 201);
});
