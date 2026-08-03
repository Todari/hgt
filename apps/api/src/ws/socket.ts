import { upgradeWebSocket } from "@hono/node-server";
import type { Hono } from "hono";
import type { WebSocket as NodeWebSocket } from "ws";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "../db/client";
import { users } from "../db/schema";
import { rateLimit } from "../lib/rate-limit";
import { register, startAppHeartbeat } from "./registry";

/** Protocol-level ping cadence; a socket missing 2 pongs is terminated. */
const HEARTBEAT_INTERVAL_MS = 30_000;
const MAX_MISSED_PONGS = 2;

/**
 * Realtime channel. Clients connect to `GET /ws?token=<session>` and receive
 * server-pushed events (new messages, new matches, heartbeat pings). Sending
 * is done via REST (`POST /conversations/:id/messages`), which broadcasts here.
 *
 */
export function setupWebSocket(app: Hono) {
  startAppHeartbeat();

  app.get(
    "/ws",
    upgradeWebSocket(async (c) => {
      const token = c.req.query("token") ?? "";
      let userId: string | null = null;
      if (token) {
        const [u] = await db
          .select({ id: users.id })
          .from(users)
          // isNotNull is belt-and-braces: a logged-out user has session = NULL.
          .where(and(isNotNull(users.session), eq(users.session, token)))
          .limit(1);
        userId = u?.id ?? null;
      }

      let unregister: (() => void) | null = null;
      let heartbeat: NodeJS.Timeout | null = null;
      return {
        onOpen(_event, ws) {
          if (!userId) {
            ws.close(1008, "unauthorized");
            return;
          }
          // 연결 폭주 방지 — 10회/분 초과 시 정중히 끊는다.
          if (!rateLimit(`ws:connect:${userId}`, 10, 60_000)) {
            ws.close(1013, "연결 시도가 너무 많습니다. 잠시 후 다시 연결해주세요.");
            return;
          }
          unregister = register(userId, {
            send: (data) => ws.send(data),
            close: (code, reason) => ws.close(code, reason),
          });

          // Server heartbeat: protocol-level ping; kill sockets that stop ponging.
          // The Node adapter intentionally exposes only a minimal WebSocketLike
          // interface, while the configured `ws` server also supports ping/pong.
          const raw = ws.raw as NodeWebSocket | undefined;
          if (raw) {
            let missedPongs = 0;
            raw.on("pong", () => {
              missedPongs = 0;
            });
            heartbeat = setInterval(() => {
              if (missedPongs >= MAX_MISSED_PONGS) {
                raw.terminate(); // fires onClose → cleanup below
                return;
              }
              missedPongs += 1;
              raw.ping();
            }, HEARTBEAT_INTERVAL_MS);
            heartbeat.unref();
          }
        },
        onClose() {
          if (heartbeat) clearInterval(heartbeat);
          unregister?.();
        },
      };
    }),
  );

}
