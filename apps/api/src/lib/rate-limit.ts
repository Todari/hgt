/**
 * Minimal in-memory fixed-window rate limiter (single instance — fine for MVP).
 * Returns `true` if the request is allowed, `false` if the key is over its limit.
 */
type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const w = windows.get(key);
  if (!w || w.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (w.count >= max) return false;
  w.count += 1;
  return true;
}
