import { z } from "zod";

/**
 * Shared API contract between the frontend apps and the backend (`apps/api`).
 *
 * Pure Zod + inferred types only — no server/runtime dependencies — so the
 * Next.js apps can import this without pulling in Drizzle/Postgres.
 */

/* ------------------------------------------------------------------ */
/* HTTP envelope (matches legacy `structs.HttpResponse`)              */
/* ------------------------------------------------------------------ */

export type HttpResponse<T> = { success: boolean; data: T };

export const httpResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ success: z.boolean(), data });

/* ------------------------------------------------------------------ */
/* Property — lookup table of selectable option values                */
/* ------------------------------------------------------------------ */

export const propertyTypeSchema = z.enum([
  "age",
  "smoke",
  "religion",
  "mbti",
  "height",
  "hobby",
  "keyword",
]);
export type PropertyType = z.infer<typeof propertyTypeSchema>;

export const propertySchema = z.object({
  id: z.string().uuid(),
  type: propertyTypeSchema,
  value: z.string().min(1),
});
export type Property = z.infer<typeof propertySchema>;

export const createPropertySchema = propertySchema.omit({ id: true });
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

/* ------------------------------------------------------------------ */
/* Auth — Hongik portal login                                          */
/* ------------------------------------------------------------------ */

/** Korean domain enums (for self-reported fields like 군필 여부). */
export const genderSchema = z.enum(["남", "여"]);
export type Gender = z.infer<typeof genderSchema>;

export const armySchema = z.enum(["필", "미필"]);
export type Army = z.infer<typeof armySchema>;

/**
 * Hongik-portal credentials. `id` = 학번, `pw` = 포털 비밀번호. The password is
 * proxied to the portal once for verification and is never stored.
 */
export const hongikLoginSchema = z.object({
  id: z.string().min(1),
  pw: z.string().min(1),
});
export type HongikLoginInput = z.infer<typeof hongikLoginSchema>;

/* ------------------------------------------------------------------ */
/* User — public-facing shape (never includes the session token)      */
/* ------------------------------------------------------------------ */

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  studentId: z.string(),
  major: z.string(),
  gender: z.boolean(), // true = 남 (verified from portal)
  army: z.boolean().nullable(), // true = 군필, null = 미입력
  age: z.number().int(),
  academicStatus: z.string().nullable(), // 재학 / 휴학 / 졸업 ... (verified from portal)
  description: z.string().nullable(),
  explore: z.boolean(),
  canCc: z.boolean(),
  targetMinAge: z.number().int().nullable(),
  targetMaxAge: z.number().int().nullable(),
  heightId: z.string().uuid().nullable(),
  smokeId: z.string().uuid().nullable(),
  religionId: z.string().uuid().nullable(),
  mbtiId: z.string().uuid().nullable(),
  partnerId: z.string().uuid().nullable(),
});
export type User = z.infer<typeof userSchema>;

export const hongikLoginResponseSchema = z.object({
  session: z.string().min(1),
  user: userSchema,
});
export type HongikLoginResponse = z.infer<typeof hongikLoginResponseSchema>;

/* ------------------------------------------------------------------ */
/* Keywords & profile                                                  */
/* ------------------------------------------------------------------ */

export const keywordCategorySchema = z.enum([
  "성격",
  "취미",
  "관심사",
  "라이프스타일",
  "가치관",
]);
export type KeywordCategory = z.infer<typeof keywordCategorySchema>;

export const keywordSchema = z.object({
  id: z.string().uuid(),
  value: z.string(),
  category: z.string(),
});
export type Keyword = z.infer<typeof keywordSchema>;

/** Profile fields the user can edit (identity is verified from the portal). */
export const updateProfileSchema = z.object({
  selfKeywordIds: z.array(z.string().uuid()).max(20).optional(),
  idealKeywordIds: z.array(z.string().uuid()).max(20).optional(),
  description: z.string().max(500).nullable().optional(),
  army: z.boolean().nullable().optional(),
  canCc: z.boolean().optional(),
  targetMinAge: z.number().int().min(18).max(99).nullable().optional(),
  targetMaxAge: z.number().int().min(18).max(99).nullable().optional(),
  explore: z.boolean().optional(),
  heightId: z.string().uuid().nullable().optional(),
  smokeId: z.string().uuid().nullable().optional(),
  religionId: z.string().uuid().nullable().optional(),
  mbtiId: z.string().uuid().nullable().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** The authenticated user's full profile (`GET /me`). */
export const meProfileSchema = userSchema.extend({
  selfKeywords: z.array(keywordSchema),
  idealKeywords: z.array(keywordSchema),
});
export type MeProfile = z.infer<typeof meProfileSchema>;

/* ------------------------------------------------------------------ */
/* Matching                                                            */
/* ------------------------------------------------------------------ */

/** The authenticated user's match for a week (`GET /me/match`; null if none). */
export const matchResultSchema = z.object({
  roundId: z.string().uuid(),
  weekStart: z.string(),
  score: z.number(),
  partner: userSchema,
});
export type MatchResult = z.infer<typeof matchResultSchema>;

/* ------------------------------------------------------------------ */
/* Chat                                                                */
/* ------------------------------------------------------------------ */

export const messageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  body: z.string(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
});
export type Message = z.infer<typeof messageSchema>;

export const conversationSchema = z.object({
  id: z.string().uuid(),
  partner: userSchema,
  lastMessage: messageSchema.nullable(),
  unreadCount: z.number().int(),
  createdAt: z.string(),
});
export type Conversation = z.infer<typeof conversationSchema>;

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(2000),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

/* ------------------------------------------------------------------ */
/* Push devices + realtime events                                      */
/* ------------------------------------------------------------------ */

export const devicePlatformSchema = z.enum(["ios", "android", "web"]);
export type DevicePlatform = z.infer<typeof devicePlatformSchema>;

export const registerDeviceSchema = z.object({
  platform: devicePlatformSchema,
  token: z.string().min(1),
});
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;

/** Realtime events pushed over the WebSocket (server → client). */
export const wsServerEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("message"), message: messageSchema }),
  z.object({ type: z.literal("match"), partner: userSchema }),
]);
export type WsServerEvent = z.infer<typeof wsServerEventSchema>;

/* ------------------------------------------------------------------ */
/* Safety: block + report                                              */
/* ------------------------------------------------------------------ */

export const blockUserSchema = z.object({ userId: z.string().uuid() });
export type BlockUserInput = z.infer<typeof blockUserSchema>;

export const reportUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1).max(1000),
});
export type ReportUserInput = z.infer<typeof reportUserSchema>;
