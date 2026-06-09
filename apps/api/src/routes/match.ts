import { Hono } from "hono";
import { desc, eq, or } from "drizzle-orm";
import { db } from "../db/client";
import { matches, matchRounds, users, keywords, userSelfKeywords } from "../db/schema";
import { ok } from "../lib/response";
import type { AppEnv, DbUser } from "../types";

export const matchRoutes = new Hono<AppEnv>();

const toPublicUser = ({ session: _session, ...rest }: DbUser) => rest;

// GET /me/match — the authenticated user's latest match (partner profile + score).
matchRoutes.get("/me/match", async (c) => {
  const me = c.get("user");
  const [row] = await db
    .select({
      roundId: matches.roundId,
      score: matches.score,
      weekStart: matchRounds.weekStart,
      maleUserId: matches.maleUserId,
      femaleUserId: matches.femaleUserId,
    })
    .from(matches)
    .innerJoin(matchRounds, eq(matches.roundId, matchRounds.id))
    .where(or(eq(matches.maleUserId, me.id), eq(matches.femaleUserId, me.id)))
    .orderBy(desc(matchRounds.weekStart))
    .limit(1);

  if (!row) return ok(c, null);

  const partnerId = row.maleUserId === me.id ? row.femaleUserId : row.maleUserId;
  const [partner] = await db.select().from(users).where(eq(users.id, partnerId)).limit(1);
  if (!partner) return ok(c, null);

  // shared self-keywords (둘 다 자신을 설명한 키워드) — conversation starters
  const kwOf = (uid: string) =>
    db
      .select({ v: keywords.value })
      .from(userSelfKeywords)
      .innerJoin(keywords, eq(userSelfKeywords.keywordId, keywords.id))
      .where(eq(userSelfKeywords.userId, uid));
  const [mine, theirs] = await Promise.all([kwOf(me.id), kwOf(partnerId)]);
  const theirSet = new Set(theirs.map((k) => k.v));
  const sharedKeywords = mine.map((k) => k.v).filter((v) => theirSet.has(v));

  return ok(c, {
    roundId: row.roundId,
    weekStart: row.weekStart,
    score: row.score,
    partner: toPublicUser(partner),
    sharedKeywords,
  });
});
