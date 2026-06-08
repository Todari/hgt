import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { signInSchema } from "@hgt-client/contract";
import { db } from "../db/client";
import { users } from "../db/schema";
import { createSessionToken } from "../lib/session-token";
import { ok, fail } from "../lib/response";

export const authRoutes = new Hono();

/**
 * POST /signin — sign up on first visit, otherwise log in (ported from
 * `legacy/hgt-server/controllers/auth_controller.go::SignIn`).
 *
 * Fixes carried over from the legacy bugs:
 *   - returns 200/201 on success (legacy returned 500 even when it worked)
 *   - persists every required field, including `army` (legacy `InsertOneUser`
 *     silently dropped it)
 *   - validates the request body up-front via the shared contract schema
 */
authRoutes.post("/signin", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    return fail(c, parsed.error.issues.map((i) => i.message).join(", "), 400);
  }
  const dto = parsed.data;
  const session = createSessionToken();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.studentId, dto.studentId))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ session, updatedAt: new Date() })
      .where(eq(users.id, existing.id));
    return ok(c, { session }, 200);
  }

  await db.insert(users).values({
    name: dto.name,
    studentId: dto.studentId,
    major: dto.major,
    age: dto.age,
    gender: dto.gender === "남",
    army: dto.army === "필",
    session,
  });
  return ok(c, { session }, 201);
});
