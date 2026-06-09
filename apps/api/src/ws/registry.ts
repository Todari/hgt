import type { WsServerEvent } from "@hgt-client/contract";

/**
 * In-memory registry of live WebSocket connections per user, with a broadcast
 * helper. Single-instance only (fine for MVP). `broadcastToUser` is a no-op
 * when the user has no open sockets, so callers can fire it unconditionally.
 */
type Send = (data: string) => void;

const connections = new Map<string, Set<Send>>();

export function register(userId: string, send: Send): () => void {
  let set = connections.get(userId);
  if (!set) {
    set = new Set();
    connections.set(userId, set);
  }
  set.add(send);
  return () => {
    const current = connections.get(userId);
    if (!current) return;
    current.delete(send);
    if (current.size === 0) connections.delete(userId);
  };
}

export function broadcastToUser(userId: string, event: WsServerEvent): void {
  const set = connections.get(userId);
  if (!set || set.size === 0) return;
  const data = JSON.stringify(event);
  for (const send of set) {
    try {
      send(data);
    } catch {
      /* drop broken socket on next tick */
    }
  }
}
