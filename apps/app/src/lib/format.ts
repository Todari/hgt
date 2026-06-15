/* ------------------------------------------------------------------ */
/* KST week math — mirrors apps/api/src/matching/engine.ts exactly.    */
/* The backend computes weekStart / round boundaries in Asia/Seoul;    */
/* the client must use the same Monday boundary or D-day drifts.       */
/* ------------------------------------------------------------------ */

/** KST (Asia/Seoul) is UTC+9 with no DST — a fixed offset is exact. */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** ISO date (YYYY-MM-DD) of the KST Monday of the week containing `d`. */
export function weekStartMonday(d: Date = new Date()): string {
  const kst = new Date(d.getTime() + KST_OFFSET_MS); // read UTC fields as KST
  const day = kst.getUTCDay(); // 0=Sun .. 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() + diff));
  return monday.toISOString().slice(0, 10);
}

/**
 * KST days until the next match Monday — 0 on Monday itself (match day;
 * results are announced 19:00 KST, so `current` can be null until then).
 */
export function daysUntilNextMonday(now: Date = new Date()): number {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const day = kst.getUTCDay();
  return day === 1 ? 0 : (8 - day) % 7;
}

/** 'D-day' on match Monday (KST), otherwise 'D-N'. */
export function formatDday(days: number): string {
  return days === 0 ? "D-day" : `D-${days}`;
}

/** `weekStart` (KST Monday, YYYY-MM-DD) → 'M월 N째 주'. */
export function formatWeekLabel(weekStart: string): string {
  const [, month, dayOfMonth] = weekStart.split("-").map(Number);
  if (!month || !dayOfMonth) return weekStart;
  return `${month}월 ${Math.ceil(dayOfMonth / 7)}째 주`;
}

/* ------------------------------------------------------------------ */
/* Chat timestamps                                                     */
/* ------------------------------------------------------------------ */

export function formatChatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    // hour: "numeric" → '오후 1:36' (no zero-padding on the hour)
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatMessageDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}
