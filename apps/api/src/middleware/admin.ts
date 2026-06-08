import { createMiddleware } from "hono/factory";
import { fail } from "../lib/response";

/**
 * Guards `/admin/*` with a shared secret: the request must send
 * `X-Admin-Token: <ADMIN_TOKEN>`. If `ADMIN_TOKEN` is unset the route is locked
 * (always 403) — so admin endpoints are off by default until configured.
 */
export const adminAuth = createMiddleware(async (c, next) => {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || c.req.header("X-Admin-Token") !== expected) {
    return fail(c, "Forbidden", 403);
  }
  await next();
});
