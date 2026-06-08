import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users } from "../db/schema";
import { fail } from "../lib/response";
import type { AppEnv } from "../types";

/**
 * Bearer-session auth (ported from `legacy/hgt-server/middlewares` +
 * `utils/token`): extract the token from `Authorization: Bearer <token>` and
 * resolve it to a user row.
 */
export const sessionAuth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header("Authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return fail(c, "Missing bearer token", 401);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.session, token))
    .limit(1);

  if (!user) {
    return fail(c, "Invalid or expired session", 401);
  }

  c.set("user", user);
  await next();
});
