import { Hono } from "hono";
import { eq, inArray } from "drizzle-orm";
import { updateProfileSchema } from "@hgt-client/contract";
import { db } from "../db/client";
import { users, keywords, userSelfKeywords, userIdealKeywords } from "../db/schema";
import { ok, fail } from "../lib/response";
import type { AppEnv, DbUser } from "../types";

export const meRoutes = new Hono<AppEnv>();

const toPublicUser = ({ session: _session, ...rest }: DbUser) => rest;

async function loadKeywords(userId: string) {
  const cols = { id: keywords.id, value: keywords.value, category: keywords.category };
  const [selfKeywords, idealKeywords] = await Promise.all([
    db
      .select(cols)
      .from(userSelfKeywords)
      .innerJoin(keywords, eq(userSelfKeywords.keywordId, keywords.id))
      .where(eq(userSelfKeywords.userId, userId)),
    db
      .select(cols)
      .from(userIdealKeywords)
      .innerJoin(keywords, eq(userIdealKeywords.keywordId, keywords.id))
      .where(eq(userIdealKeywords.userId, userId)),
  ]);
  return { selfKeywords, idealKeywords };
}

// GET /me — the authenticated user's full profile (incl. keywords).
meRoutes.get("/me", async (c) => {
  const user = c.get("user");
  return ok(c, { ...toPublicUser(user), ...(await loadKeywords(user.id)) });
});

// PUT /me/profile — update editable profile fields and keyword sets.
meRoutes.put("/me/profile", async (c) => {
  const user = c.get("user");
  const parsed = updateProfileSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return fail(c, parsed.error.issues.map((i) => i.message).join(", "), 400);
  }
  const p = parsed.data;

  // Reject unknown keyword ids up front.
  const referenced = [...(p.selfKeywordIds ?? []), ...(p.idealKeywordIds ?? [])];
  if (referenced.length > 0) {
    const found = await db
      .select({ id: keywords.id })
      .from(keywords)
      .where(inArray(keywords.id, referenced));
    const known = new Set(found.map((f) => f.id));
    const missing = referenced.filter((id) => !known.has(id));
    if (missing.length > 0) {
      return fail(c, `존재하지 않는 키워드입니다: ${missing.join(", ")}`, 400);
    }
  }

  const scalar: Partial<DbUser> = { updatedAt: new Date() };
  if (p.description !== undefined) scalar.description = p.description;
  if (p.army !== undefined) scalar.army = p.army;
  if (p.canCc !== undefined) scalar.canCc = p.canCc;
  if (p.targetMinAge !== undefined) scalar.targetMinAge = p.targetMinAge;
  if (p.targetMaxAge !== undefined) scalar.targetMaxAge = p.targetMaxAge;
  if (p.explore !== undefined) scalar.explore = p.explore;
  if (p.heightId !== undefined) scalar.heightId = p.heightId;
  if (p.smokeId !== undefined) scalar.smokeId = p.smokeId;
  if (p.religionId !== undefined) scalar.religionId = p.religionId;
  if (p.mbtiId !== undefined) scalar.mbtiId = p.mbtiId;
  if (p.agreedToTerms === true) scalar.termsAgreedAt = new Date();

  await db.transaction(async (tx) => {
    await tx.update(users).set(scalar).where(eq(users.id, user.id));

    if (p.selfKeywordIds) {
      await tx.delete(userSelfKeywords).where(eq(userSelfKeywords.userId, user.id));
      if (p.selfKeywordIds.length > 0) {
        await tx.insert(userSelfKeywords).values(
          p.selfKeywordIds.map((keywordId) => ({ userId: user.id, keywordId })),
        );
      }
    }
    if (p.idealKeywordIds) {
      await tx.delete(userIdealKeywords).where(eq(userIdealKeywords.userId, user.id));
      if (p.idealKeywordIds.length > 0) {
        await tx.insert(userIdealKeywords).values(
          p.idealKeywordIds.map((keywordId) => ({ userId: user.id, keywordId })),
        );
      }
    }
  });

  const [fresh] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  const base = fresh ? toPublicUser(fresh) : toPublicUser(user);
  return ok(c, { ...base, ...(await loadKeywords(user.id)) });
});

// DELETE /me — account withdrawal. Cascades to keywords, devices, blocks,
// conversations, messages, and matches.
meRoutes.delete("/me", async (c) => {
  const me = c.get("user");
  await db.delete(users).where(eq(users.id, me.id));
  return ok(c, { deleted: true });
});
