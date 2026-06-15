import type { Message } from "@hgt-client/contract";

/** Server message + optimistic-send bookkeeping (client only). */
export type ChatMessage = Message & {
  /** "sending" until the POST resolves, "failed" on error. Absent = server row. */
  clientStatus?: "sending" | "failed";
};

/** Consecutive same-sender messages within this window render as one run. */
const RUN_GAP_MS = 5 * 60 * 1000;

const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "numeric", // '오후 1:36' — no zero-padding on the hour
  minute: "2-digit",
  hour12: true,
});

/** Time-of-day only ('오후 1:36') — the day separators carry the date. */
export function formatTimeOfDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return timeFormatter.format(date);
}

function sameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/** Same sender, same day, ≤5min apart → one visual run (tight spacing). */
function sameRun(prev: ChatMessage, next: ChatMessage): boolean {
  if (prev.senderId !== next.senderId) return false;
  if (!sameDay(prev.createdAt, next.createdAt)) return false;
  const gap = new Date(next.createdAt).getTime() - new Date(prev.createdAt).getTime();
  return Math.abs(gap) <= RUN_GAP_MS;
}

export type ChatListItem =
  | { kind: "day"; key: string; date: string }
  | {
      kind: "message";
      key: string;
      message: ChatMessage;
      mine: boolean;
      runStart: boolean;
      runEnd: boolean;
      /** '읽음' shows only on my newest message the partner has read. */
      showRead: boolean;
    };

/** Flatten messages (oldest first) into day separators + run-annotated rows. */
export function buildChatItems(messages: ChatMessage[], myId: string): ChatListItem[] {
  let lastReadOwnId: string | null = null;
  for (const m of messages) {
    if (m.senderId === myId && m.readAt) lastReadOwnId = m.id;
  }

  const items: ChatListItem[] = [];
  messages.forEach((message, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    if (!prev || !sameDay(prev.createdAt, message.createdAt)) {
      items.push({ kind: "day", key: `day-${message.createdAt}`, date: message.createdAt });
    }
    items.push({
      kind: "message",
      key: message.id,
      message,
      mine: message.senderId === myId,
      runStart: !prev || !sameRun(prev, message),
      runEnd: !next || !sameRun(message, next),
      showRead: message.id === lastReadOwnId,
    });
  });
  return items;
}

/**
 * Merge two message lists (dedupe by id, `b` wins) and sort oldest-first.
 * Optimistic sends (clientStatus set) always sink below settled rows so a
 * pending bubble stays at the bottom even when partner messages stream in.
 */
export function mergeMessages(a: ChatMessage[], b: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const m of a) byId.set(m.id, m);
  for (const m of b) {
    const existing = byId.get(m.id);
    byId.set(m.id, existing ? { ...existing, ...m } : m);
  }
  return [...byId.values()].sort((x, y) => {
    const xPending = x.clientStatus ? 1 : 0;
    const yPending = y.clientStatus ? 1 : 0;
    if (xPending !== yPending) return xPending - yPending;
    return x.createdAt < y.createdAt ? -1 : x.createdAt > y.createdAt ? 1 : 0;
  });
}

/** Pick the Korean particle by final-consonant (non-Hangul tail → `withoutFinal`). */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) return withoutFinal;
  return (code - 0xac00) % 28 ? withFinal : withoutFinal;
}
