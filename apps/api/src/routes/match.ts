import { Hono } from "hono";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import type { MatchPartner, MatchResult, MyMatchResponse } from "@hgt-client/contract";
import { db } from "../db/client";
import {
  matches,
  matchRounds,
  users,
  keywords,
  userSelfKeywords,
  properties,
  conversations,
} from "../db/schema";
import { ok } from "../lib/response";
import { toPartnerUser } from "../lib/public-user";
import { isBlocked } from "../lib/blocks";
import { weekStartMonday } from "../matching/engine";
import type { AppEnv, DbUser } from "../types";

export const matchRoutes = new Hono<AppEnv>();

type MatchRow = {
  matchId: string;
  roundId: string;
  weekStart: string;
  maleUserId: string;
  femaleUserId: string;
};

/** Self-keywords (value + category) of one user. */
function selfKeywordsOf(userId: string) {
  return db
    .select({ value: keywords.value, category: keywords.category })
    .from(userSelfKeywords)
    .innerJoin(keywords, eq(userSelfKeywords.keywordId, keywords.id))
    .where(eq(userSelfKeywords.userId, userId));
}

/** Resolve the partner's selected property ids to display values. */
async function resolvePartnerProperties(partner: DbUser): Promise<MatchPartner["partnerProperties"]> {
  const slots = [
    ["height", partner.heightId],
    ["smoke", partner.smokeId],
    ["religion", partner.religionId],
    ["mbti", partner.mbtiId],
  ] as const;
  const ids = slots.map(([, id]) => id).filter((id): id is string => id !== null);
  if (ids.length === 0) return {};
  const rows = await db
    .select({ id: properties.id, value: properties.value })
    .from(properties)
    .where(inArray(properties.id, ids));
  const valueById = new Map(rows.map((r) => [r.id, r.value]));
  const resolved: MatchPartner["partnerProperties"] = {};
  for (const [slot, id] of slots) {
    const value = id ? valueById.get(id) : undefined;
    if (value !== undefined) resolved[slot] = value;
  }
  return resolved;
}

/**
 * Build the per-round result for `me`: enriched partner (keywords grouped by
 * category + resolved properties), shared keywords and the conversation to
 * deep-link into. Returns null when the partner is gone or the pair has a
 * block in either direction.
 */
async function buildMatchResult(me: DbUser, row: MatchRow): Promise<MatchResult | null> {
  const partnerId = row.maleUserId === me.id ? row.femaleUserId : row.maleUserId;
  if (await isBlocked(me.id, partnerId)) return null;

  const [partner] = await db.select().from(users).where(eq(users.id, partnerId)).limit(1);
  if (!partner) return null;

  const [mine, theirs, partnerProperties, conv] = await Promise.all([
    selfKeywordsOf(me.id),
    selfKeywordsOf(partnerId),
    resolvePartnerProperties(partner),
    // Engine sets `matchId`, but a pre-existing conversation (pair unique)
    // keeps its original row — fall back to the pair columns.
    db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        or(
          eq(conversations.matchId, row.matchId),
          and(
            eq(conversations.userAId, row.maleUserId),
            eq(conversations.userBId, row.femaleUserId),
          ),
        ),
      )
      .limit(1),
  ]);

  // shared self-keywords (둘 다 자신을 설명한 키워드) — conversation starters
  const theirValues = new Set(theirs.map((k) => k.value));
  const sharedKeywords = mine.map((k) => k.value).filter((v) => theirValues.has(v));

  // partner self-keywords grouped by category (성격/취미/...)
  const partnerKeywords: Record<string, string[]> = {};
  for (const k of theirs) (partnerKeywords[k.category] ??= []).push(k.value);

  return {
    roundId: row.roundId,
    weekStart: row.weekStart,
    partner: { ...toPartnerUser(partner), partnerKeywords, partnerProperties },
    sharedKeywords,
    conversationId: conv[0]?.id ?? null,
  };
}

// GET /me/match — { current, previous }: this KST week's match (Monday
// boundary) and the most recent earlier one. Blocked pairs are excluded.
matchRoutes.get("/me/match", async (c) => {
  const me = c.get("user");
  const rows: MatchRow[] = await db
    .select({
      matchId: matches.id,
      roundId: matches.roundId,
      weekStart: matchRounds.weekStart,
      maleUserId: matches.maleUserId,
      femaleUserId: matches.femaleUserId,
    })
    .from(matches)
    .innerJoin(matchRounds, eq(matches.roundId, matchRounds.id))
    .where(or(eq(matches.maleUserId, me.id), eq(matches.femaleUserId, me.id)))
    .orderBy(desc(matchRounds.weekStart));

  const thisWeek = weekStartMonday();
  let current: MatchResult | null = null;
  let previous: MatchResult | null = null;
  for (const row of rows) {
    if (row.weekStart > thisWeek) continue; // future/test rounds — never surface
    if (row.weekStart === thisWeek) {
      if (current) continue;
      current = await buildMatchResult(me, row);
    } else {
      // rows are weekStart-desc, so the first buildable one is the latest
      previous = await buildMatchResult(me, row);
      if (previous) break;
    }
  }

  // Has this KST week's round actually run? (round row created at match time.)
  const [revealedRow] = await db
    .select({ id: matchRounds.id })
    .from(matchRounds)
    .where(eq(matchRounds.weekStart, thisWeek))
    .limit(1);

  const response: MyMatchResponse = {
    current,
    previous,
    thisWeekRevealed: Boolean(revealedRow),
  };
  return ok(c, response);
});
