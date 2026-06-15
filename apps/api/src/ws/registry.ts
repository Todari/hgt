import type { WsServerEvent } from "@hgt-client/contract";

/**
 * In-memory registry of live WebSocket connections per user, with broadcast
 * and force-close helpers. Single-instance only (fine for MVP).
 * `broadcastToUser` is a no-op when the user has no open sockets, so callers
 * can fire it unconditionally.
 */
type Connection = {
  send: (data: string) => void;
  close: (code?: number, reason?: string) => void;
};

const connections = new Map<string, Set<Connection>>();

export function register(userId: string, conn: Connection): () => void {
  let set = connections.get(userId);
  if (!set) {
    set = new Set();
    connections.set(userId, set);
  }
  set.add(conn);
  return () => {
    const current = connections.get(userId);
    if (!current) return;
    current.delete(conn);
    if (current.size === 0) connections.delete(userId);
  };
}

export function broadcastToUser(userId: string, event: WsServerEvent): void {
  const set = connections.get(userId);
  if (!set || set.size === 0) return;
  const data = JSON.stringify(event);
  for (const conn of set) {
    try {
      conn.send(data);
    } catch {
      /* drop broken socket on next tick */
    }
  }
}

/**
 * Close and deregister every socket a user has open. Called on session
 * rotation (re-login), logout, account deletion and ban — a revoked session
 * must not keep receiving realtime events.
 */
export function closeUser(userId: string): void {
  const set = connections.get(userId);
  if (!set) return;
  connections.delete(userId);
  for (const conn of set) {
    try {
      conn.close(1000, "session ended");
    } catch {
      /* already closed */
    }
  }
}

/** App-level heartbeat interval — clients treat silence > ~25s as a dead link. */
const APP_PING_INTERVAL_MS = 25_000;
let appPingTimer: NodeJS.Timeout | null = null;

/** Start broadcasting `{ type: "ping" }` to every open socket every 25s. */
export function startAppHeartbeat(): void {
  if (appPingTimer) return;
  appPingTimer = setInterval(() => {
    const data = JSON.stringify({ type: "ping" } satisfies WsServerEvent);
    for (const set of connections.values()) {
      for (const conn of set) {
        try {
          conn.send(data);
        } catch {
          /* drop broken socket on next tick */
        }
      }
    }
  }, APP_PING_INTERVAL_MS);
  appPingTimer.unref();
}
