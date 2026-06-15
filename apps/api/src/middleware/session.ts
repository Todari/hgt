import { createMiddleware } from "hono/factory";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "../db/client";
import { users } from "../db/schema";
import { fail } from "../lib/response";
import type { AppEnv } from "../types";

/** Refresh `lastActiveAt` at most this often (fire-and-forget write). */
const LAST_ACTIVE_STALE_MS = 15 * 60 * 1000;

/**
 * Bearer-session auth (ported from `legacy/hgt-server/middlewares` +
 * `utils/token`): extract the token from `Authorization: Bearer <token>` and
 * resolve it to a user row. A null/empty stored session (logged out) can
 * never match.
 */
export const sessionAuth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header("Authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token || token.trim() === "") {
    return fail(c, "Missing bearer token", 401);
  }

  const [user] = await db
    .select()
    .from(users)
    // isNotNull is belt-and-braces: SQL NULL never equals a string, but make
    // the "logged-out sessions are unmatchable" invariant explicit.
    .where(and(isNotNull(users.session), eq(users.session, token)))
    .limit(1);

  if (!user) {
    return fail(c, "Invalid or expired session", 401);
  }

  // Touch lastActiveAt when stale — fire-and-forget so it never adds latency.
  if (!user.lastActiveAt || Date.now() - user.lastActiveAt.getTime() > LAST_ACTIVE_STALE_MS) {
    void db
      .update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, user.id))
      .catch((err) => console.error("lastActiveAt touch failed:", err));
  }

  c.set("user", user);
  await next();
});
