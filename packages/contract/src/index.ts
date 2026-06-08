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
