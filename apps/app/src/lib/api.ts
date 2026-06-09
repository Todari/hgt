import type {
  HttpResponse,
  HongikLoginInput,
  HongikLoginResponse,
  User,
  Property,
  CreatePropertyInput,
  Keyword,
  MeProfile,
  UpdateProfileInput,
  MatchResult,
  Conversation,
  Message,
  RegisterDeviceInput,
  WsServerEvent,
} from "@hgt-client/contract";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
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
    if (res.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem("hgt_session");
      if (!window.location.pathname.startsWith("/signin")) {
        window.location.href = "/signin";
      }
    }
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
  getUsers: (session: string) => request<User[]>("/user", { session }),
  getUser: (session: string, id: string) =>
    request<User>(`/user/${id}`, { session }),
  listProperties: (session: string) =>
    request<Property[]>("/property", { session }),
  createProperty: (session: string, input: CreatePropertyInput) =>
    request<Property>("/property", { method: "POST", session, body: input }),

  /** The curated keyword catalog (for the profile picker). */
  getKeywords: (session: string) => request<Keyword[]>("/keyword", { session }),
  /** The signed-in user's full profile (incl. self/ideal keywords). */
  getMe: (session: string) => request<MeProfile>("/me", { session }),
  /** Update editable profile fields + keyword sets. */
  updateProfile: (session: string, input: UpdateProfileInput) =>
    request<MeProfile>("/me/profile", { method: "PUT", session, body: input }),
  /** The signed-in user's latest weekly match (null if none yet). */
  getMyMatch: (session: string) =>
    request<MatchResult | null>("/me/match", { session }),

  /** My conversations (partner + last message). */
  getConversations: (session: string) =>
    request<Conversation[]>("/conversations", { session }),
  /** Message history for a conversation (oldest first). */
  getMessages: (session: string, conversationId: string) =>
    request<Message[]>(`/conversations/${conversationId}/messages`, { session }),
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
  /** Block / report a user. */
  blockUser: (session: string, userId: string) =>
    request<{ blocked: boolean }>("/me/blocks", { method: "POST", session, body: { userId } }),
  reportUser: (session: string, userId: string, reason: string) =>
    request<{ reported: boolean }>("/reports", { method: "POST", session, body: { userId, reason } }),
  /** Withdraw the account (irreversible). */
  deleteAccount: (session: string) =>
    request<{ deleted: boolean }>("/me", { method: "DELETE", session }),
};

const WS_URL = BASE_URL.replace(/^http/, "ws");

/**
 * Open the realtime channel. `onEvent` fires for each server event (new message,
 * new match). Returns the socket — call `.close()` to disconnect.
 */
export type RealtimeConnection = { close: () => void };

export function connectRealtime(
  session: string,
  onEvent: (event: WsServerEvent) => void,
): RealtimeConnection {
  let ws: WebSocket | null = null;
  let closed = false;
  let retry = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const open = () => {
    if (closed) return;
    ws = new WebSocket(`${WS_URL}/ws?token=${encodeURIComponent(session)}`);
    ws.addEventListener("open", () => {
      retry = 0;
    });
    ws.addEventListener("message", (e: MessageEvent) => {
      try {
        onEvent(JSON.parse(String(e.data)) as WsServerEvent);
      } catch {
        /* ignore malformed events */
      }
    });
    ws.addEventListener("close", () => {
      if (closed) return;
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
      ws?.close();
    },
  };
}
