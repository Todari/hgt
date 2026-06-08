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
};
