// Minimal client-side session storage (skeleton). The login token from
// /auth/hongik is kept in localStorage; protected pages read it and redirect to
// /signin when missing.
const SESSION_KEY = "hgt_session";

export function getSession(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function setSession(session: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, session);
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
