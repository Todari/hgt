import { z } from "zod";

/**
 * Shared API contract between the frontend apps and the backend (`apps/api`).
 *
 * Pure Zod + inferred types only — no server/runtime dependencies — so the
 * Next.js apps can import this without pulling in Drizzle/Postgres.
 *
 * Ported from the legacy Go/Mongo backend (see `legacy/hgt-server`):
 *   - `models.User`, `models.Property`, `models.CreateUserDto`
 *   - `structs.HttpResponse`
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
/* Auth — sign in (doubles as sign up, like the legacy `/signin`)      */
/* ------------------------------------------------------------------ */

/** Korean domain enums preserved from the legacy DTO (`Gender == "남"`, `Army == "필"`). */
export const genderSchema = z.enum(["남", "여"]);
export type Gender = z.infer<typeof genderSchema>;

export const armySchema = z.enum(["필", "미필"]);
export type Army = z.infer<typeof armySchema>;

export const signInSchema = z.object({
  name: z.string().min(1),
  studentId: z.string().min(1),
  major: z.string().min(1),
  age: z.coerce.number().int().positive(),
  gender: genderSchema,
  army: armySchema,
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signInResponseSchema = z.object({
  session: z.string().min(1),
});
export type SignInResponse = z.infer<typeof signInResponseSchema>;

/* ------------------------------------------------------------------ */
/* User — public-facing shape (never includes the session token)      */
/* ------------------------------------------------------------------ */

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  studentId: z.string(),
  major: z.string(),
  gender: z.boolean(), // true = 남
  army: z.boolean(), // true = 필(군필)
  age: z.number().int(),
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
