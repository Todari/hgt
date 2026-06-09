import { createNodeWebSocket } from "@hono/node-ws";
import type { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users } from "../db/schema";
import { register } from "./registry";

/**
 * Realtime channel. Clients connect to `GET /ws?token=<session>` and receive
 * server-pushed events (new messages, new matches). Sending is done via REST
 * (`POST /conversations/:id/messages`), which broadcasts here.
 *
 * Returns `injectWebSocket`, which must be called on the Node server.
 */
export function setupWebSocket(app: Hono) {
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

  app.get(
    "/ws",
    upgradeWebSocket(async (c) => {
      const token = c.req.query("token") ?? "";
      let userId: string | null = null;
      if (token) {
        const [u] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.session, token))
          .limit(1);
        userId = u?.id ?? null;
      }

      let unregister: (() => void) | null = null;
      return {
        onOpen(_event, ws) {
          if (!userId) {
            ws.close(1008, "unauthorized");
            return;
          }
          unregister = register(userId, (data) => ws.send(data));
        },
        onClose() {
          unregister?.();
        },
      };
    }),
  );

  return injectWebSocket;
}
