import type {
  HttpResponse,
  HongikLoginInput,
  HongikLoginResponse,
  Property,
  Keyword,
  MeProfile,
  UpdateProfileInput,
  MyMatchResponse,
  LogoutResponse,
  Conversation,
  Message,
  BlockedUser,
  RegisterDeviceInput,
  WsServerEvent,
} from "@hgt-client/contract";
import { SESSION_KEY } from "./session";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Session is dead (401 / WS auth close): drop it and bounce to sign-in. */
function handleSessionExpired(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  if (!window.location.pathname.startsWith("/signin")) {
    window.location.href = "/signin";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  session?: string;
};

/** Calls the backend and unwraps the `{ success, data }` envelope. */
async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.session ? { Authorization: `Bearer ${opts.session}` } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });

  const json = (await res.json().catch(() => null)) as HttpResponse<T> | null;

  if (!res.ok || !json?.success) {
    // Session expired/invalid → drop it and bounce to sign-in.
    if (res.status === 401) handleSessionExpired();
    const message =
      (json?.data as { message?: string } | undefined)?.message ?? res.statusText;
    throw new ApiError(message, res.status);
  }
  return json.data;
}

export const api = {
  /** Verify a Hongik student via the portal and sign in. Returns a session + verified profile. */
  hongikLogin: (input: HongikLoginInput) =>
    request<HongikLoginResponse>("/auth/hongik", { method: "POST", body: input }),
  /** Revoke the session server-side. Pass the FCM token to also unregister this device. */
  logout: (session: string, deviceToken?: string) =>
    request<LogoutResponse>("/auth/logout", {
      method: "POST",
      session,
      body: deviceToken ? { deviceToken } : {},
    }),
  listProperties: (session: string) =>
    request<Property[]>("/property", { session }),

  /** The curated keyword catalog (for the profile picker). */
  getKeywords: (session: string) => request<Keyword[]>("/keyword", { session }),
  /** The signed-in user's full profile (incl. self/ideal keywords). */
  getMe: (session: string) => request<MeProfile>("/me", { session }),
  /** Update editable profile fields + keyword sets. */
  updateProfile: (session: string, input: UpdateProfileInput) =>
    request<MeProfile>("/me/profile", { method: "PUT", session, body: input }),
  /** This KST week's match (`current`) + the most recent earlier one (`previous`). */
  getMyMatch: (session: string) =>
    request<MyMatchResponse>("/me/match", { session }),

  /** My conversations (partner + last message). */
  getConversations: (session: string) =>
    request<Conversation[]>("/conversations", { session }),
  /**
   * Message history for a conversation (oldest first). Optional pagination:
   * `limit` (≤100) + `before` (ISO datetime cursor — messages strictly older).
   */
  getMessages: (
    session: string,
    conversationId: string,
    opts?: { limit?: number; before?: string },
  ) => {
    const params = new URLSearchParams();
    if (opts?.limit !== undefined) params.set("limit", String(opts.limit));
    if (opts?.before !== undefined) params.set("before", opts.before);
    const query = params.toString();
    return request<Message[]>(
      `/conversations/${conversationId}/messages${query ? `?${query}` : ""}`,
      { session },
    );
  },
  /** Send a message. The recipient receives it via realtime + push. */
  sendMessage: (session: string, conversationId: string, body: string) =>
    request<Message>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      session,
      body: { body },
    }),
  /** Register this device's push token. */
  registerDevice: (session: string, input: RegisterDeviceInput) =>
    request<{ registered: boolean }>("/me/devices", { method: "POST", session, body: input }),
  /** Mark a conversation's incoming messages as read. */
  markRead: (session: string, conversationId: string) =>
    request<{ read: boolean }>(`/conversations/${conversationId}/read`, { method: "POST", session }),
  /** Block / unblock / report a user. */
  blockUser: (session: string, userId: string) =>
    request<{ blocked: boolean }>("/me/blocks", { method: "POST", session, body: { userId } }),
  unblockUser: (session: string, userId: string) =>
    request<{ unblocked: boolean }>(`/me/blocks/${userId}`, { method: "DELETE", session }),
  /** Users the caller has blocked (id + name). */
  getBlocks: (session: string) => request<BlockedUser[]>("/me/blocks", { session }),
  reportUser: (session: string, userId: string, reason: string) =>
    request<{ reported: boolean }>("/reports", { method: "POST", session, body: { userId, reason } }),
  /** Withdraw the account (irreversible). */
  deleteAccount: (session: string) =>
    request<{ deleted: boolean }>("/me", { method: "DELETE", session }),
};

const WS_URL = BASE_URL.replace(/^http/, "ws");

/** WS close codes the server uses to reject a bad/expired token. */
const WS_AUTH_CLOSE_CODES = new Set([1008, 4001]);
/** Server sends `{ type: "ping" }` every ~25s; longer silence = dead socket. */
const WS_SILENCE_LIMIT_MS = 60_000;
const WS_LIVENESS_CHECK_MS = 10_000;

export type RealtimeConnection = { close: () => void };

export type RealtimeOptions = {
  /**
   * Fired on every successful re-open after the first connect — refetch
   * anything that may have been missed while the socket was down.
   */
  onReconnect?: () => void;
};

/**
 * Open the realtime channel. `onEvent` fires for each server event (new
 * message, new match) — heartbeat pings are swallowed here. Reconnects with
 * exponential backoff; an auth rejection stops reconnecting and bounces to
 * /signin instead of looping. Returns the connection — call `.close()` to
 * disconnect.
 */
export function connectRealtime(
  session: string,
  onEvent: (event: WsServerEvent) => void,
  options: RealtimeOptions = {},
): RealtimeConnection {
  let ws: WebSocket | null = null;
  let closed = false;
  let retry = 0;
  let connectedOnce = false;
  let lastEventAt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let livenessTimer: ReturnType<typeof setInterval> | undefined;

  const stopLiveness = () => {
    if (livenessTimer) clearInterval(livenessTimer);
    livenessTimer = undefined;
  };

  const open = () => {
    if (closed) return;
    const socket = new WebSocket(`${WS_URL}/ws?token=${encodeURIComponent(session)}`);
    ws = socket;
    socket.addEventListener("open", () => {
      retry = 0;
      lastEventAt = Date.now();
      if (connectedOnce) options.onReconnect?.();
      connectedOnce = true;
      // Liveness watchdog: the server pings every ~25s, so a long silence
      // means a half-open socket — force-close and let backoff reopen it.
      stopLiveness();
      livenessTimer = setInterval(() => {
        if (Date.now() - lastEventAt > WS_SILENCE_LIMIT_MS) {
          stopLiveness();
          socket.close();
        }
      }, WS_LIVENESS_CHECK_MS);
    });
    socket.addEventListener("message", (e: MessageEvent) => {
      lastEventAt = Date.now();
      try {
        const event = JSON.parse(String(e.data)) as WsServerEvent;
        if (event.type === "ping") return; // heartbeat only — not for consumers
        onEvent(event);
      } catch {
        /* ignore malformed events */
      }
    });
    socket.addEventListener("close", (e: CloseEvent) => {
      stopLiveness();
      if (closed) return;
      // Auth rejection: the token is dead — reconnecting would loop forever.
      if (WS_AUTH_CLOSE_CODES.has(e.code)) {
        closed = true;
        handleSessionExpired();
        return;
      }
      // exponential backoff: 1s, 2s, 4s … capped at 30s
      const delay = Math.min(1000 * 2 ** retry, 30_000);
      retry += 1;
      timer = setTimeout(open, delay);
    });
  };
  open();

  return {
    close() {
      closed = true;
      if (timer) clearTimeout(timer);
      stopLiveness();
      ws?.close();
    },
  };
}
