import { Hono } from "hono";
import { eq, inArray } from "drizzle-orm";
import { updateProfileSchema } from "@hgt-client/contract";
import { db } from "../db/client";
import { users, keywords, properties, userSelfKeywords, userIdealKeywords } from "../db/schema";
import { ok, fail } from "../lib/response";
import { toPublicUser } from "../lib/public-user";
import { rateLimit } from "../lib/rate-limit";
import { closeUser } from "../ws/registry";
import type { AppEnv, DbUser } from "../types";

export const meRoutes = new Hono<AppEnv>();

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

  if (!rateLimit(`profile:update:${user.id}`, 30, 3_600_000)) {
    return fail(c, "프로필 수정이 너무 잦습니다. 잠시 후 다시 시도해주세요.", 429);
  }

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

  // Reject property ids that don't exist or whose type doesn't match the slot
  // (e.g. a `smoke` property id passed as heightId) — otherwise the FK insert
  // either 500s or silently stores nonsense.
  const propertySlots: Array<[type: string, id: string | null | undefined]> = [
    ["height", p.heightId],
    ["smoke", p.smokeId],
    ["religion", p.religionId],
    ["mbti", p.mbtiId],
  ];
  const referencedProps = propertySlots.filter(
    (slot): slot is [string, string] => typeof slot[1] === "string",
  );
  if (referencedProps.length > 0) {
    const found = await db
      .select({ id: properties.id, type: properties.type })
      .from(properties)
      .where(
        inArray(
          properties.id,
          referencedProps.map(([, id]) => id),
        ),
      );
    const typeById = new Map(found.map((f) => [f.id, f.type]));
    const bad = referencedProps
      .filter(([type, id]) => typeById.get(id) !== type)
      .map(([, id]) => id);
    if (bad.length > 0) {
      return fail(c, `존재하지 않거나 유형이 맞지 않는 속성입니다: ${bad.join(", ")}`, 400);
    }
  }

  // 민감정보(종교) 별도 동의 — 개인정보보호법 제23조. religion을 새로 저장하려면
  // 이미 동의했거나 이번 요청에서 함께 동의해야 한다 (클라이언트 게이트만으로는 불충분).
  const hasSensitiveConsent = user.sensitiveConsentAt !== null || p.agreedToSensitive === true;
  if (typeof p.religionId === "string" && !hasSensitiveConsent) {
    return fail(c, "종교 정보를 입력하려면 민감정보 수집·이용에 동의해야 합니다.", 400);
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
  if (p.agreedToSensitive === true && user.sensitiveConsentAt === null) {
    scalar.sensitiveConsentAt = new Date();
  }
  if (p.agreedToTerms === true) {
    scalar.termsAgreedAt = new Date();
    // First-time consent defaults the user INTO the weekly matching pool
    // (server-side opt-in; the app messages '매칭 풀에 자동으로 참여됩니다.
    // 설정에서 끌 수 있어요'). An explicit `explore` in the same request wins.
    if (user.termsAgreedAt === null && p.explore === undefined) scalar.explore = true;
  }

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
  closeUser(me.id);
  return ok(c, { deleted: true });
});
