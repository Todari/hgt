import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { registerDeviceSchema } from "@hgt-client/contract";
import { db } from "../db/client";
import { deviceTokens } from "../db/schema";
import { ok, fail } from "../lib/response";
import type { AppEnv } from "../types";

export const deviceRoutes = new Hono<AppEnv>();

// POST /me/devices — register (or re-assign) a push token to the current user.
deviceRoutes.post("/me/devices", async (c) => {
  const me = c.get("user");
  const parsed = registerDeviceSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return fail(c, parsed.error.issues.map((i) => i.message).join(", "), 400);
  }
  await db
    .insert(deviceTokens)
    .values({ userId: me.id, platform: parsed.data.platform, token: parsed.data.token })
    .onConflictDoUpdate({
      target: deviceTokens.token,
      set: { userId: me.id, platform: parsed.data.platform },
    });
  return ok(c, { registered: true }, 201);
});

// DELETE /me/devices/:token — unregister (e.g. on logout).
deviceRoutes.delete("/me/devices/:token", async (c) => {
  const me = c.get("user");
  await db
    .delete(deviceTokens)
    .where(and(eq(deviceTokens.token, c.req.param("token")), eq(deviceTokens.userId, me.id)));
  return ok(c, { removed: true });
});
