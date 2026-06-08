import { eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import {
  users,
  keywords,
  userSelfKeywords,
  userIdealKeywords,
  matchRounds,
  matches,
} from "../db/schema";
import { pairScore, type Candidate, type ScoredKeyword } from "./score";
import { maxWeightBipartite } from "./assign";

/** ISO date (YYYY-MM-DD) of the Monday of the week containing `d` (UTC). */
export function weekStartMonday(d: Date = new Date()): string {
  const day = d.getUTCDay(); // 0=Sun .. 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
  return monday.toISOString().slice(0, 10);
}

export type MatchRunResult = {
  weekStart: string;
  roundId: string;
  alreadyCompleted: boolean;
  males: number;
  females: number;
  matchCount: number;
};

function groupKeywords(
  rows: Array<{ userId: string; value: string; category: string }>,
): Map<string, ScoredKeyword[]> {
  const map = new Map<string, ScoredKeyword[]>();
  for (const r of rows) {
    const arr = map.get(r.userId);
    const kw = { value: r.value, category: r.category };
    if (arr) arr.push(kw);
    else map.set(r.userId, [kw]);
  }
  return map;
}

/** Active participants this week (`explore = true`) with their keyword sets. */
async function loadCandidates(): Promise<Candidate[]> {
  const us = await db
    .select({
      id: users.id,
      name: users.name,
      gender: users.gender,
      age: users.age,
      major: users.major,
      canCc: users.canCc,
      targetMinAge: users.targetMinAge,
      targetMaxAge: users.targetMaxAge,
    })
    .from(users)
    .where(eq(users.explore, true));
  if (us.length === 0) return [];
  const ids = us.map((u) => u.id);

  const kwCols = {
    userId: userSelfKeywords.userId,
    value: keywords.value,
    category: keywords.category,
  };
  const [selfRows, idealRows] = await Promise.all([
    db
      .select(kwCols)
      .from(userSelfKeywords)
      .innerJoin(keywords, eq(userSelfKeywords.keywordId, keywords.id))
      .where(inArray(userSelfKeywords.userId, ids)),
    db
      .select({ userId: userIdealKeywords.userId, value: keywords.value, category: keywords.category })
      .from(userIdealKeywords)
      .innerJoin(keywords, eq(userIdealKeywords.keywordId, keywords.id))
      .where(inArray(userIdealKeywords.userId, ids)),
  ]);
  const selfMap = groupKeywords(selfRows);
  const idealMap = groupKeywords(idealRows);

  return us.map((u) => ({
    ...u,
    self: selfMap.get(u.id) ?? [],
    ideal: idealMap.get(u.id) ?? [],
  }));
}

/**
 * Run the weekly match for `weekStart` (default: this week's Monday).
 * Idempotent: a completed round is returned as-is rather than re-run.
 */
export async function runWeeklyMatch(weekStart: string = weekStartMonday()): Promise<MatchRunResult> {
  const [existing] = await db
    .select()
    .from(matchRounds)
    .where(eq(matchRounds.weekStart, weekStart))
    .limit(1);

  if (existing?.status === "completed") {
    const matchCount = await db.$count(matches, eq(matches.roundId, existing.id));
    return { weekStart, roundId: existing.id, alreadyCompleted: true, males: 0, females: 0, matchCount };
  }

  let round = existing;
  if (!round) {
    const [created] = await db.insert(matchRounds).values({ weekStart }).returning();
    round = created!;
  }

  const candidates = await loadCandidates();
  const males = candidates.filter((c) => c.gender);
  const females = candidates.filter((c) => !c.gender);

  // Past matches (any round) — forbidden to repeat.
  const past = await db.select({ m: matches.maleUserId, f: matches.femaleUserId }).from(matches);
  const pastSet = new Set(past.map((r) => `${r.m}|${r.f}`));

  const weights = males.map((m) =>
    females.map((f) => pairScore(m, f, { pastMatch: pastSet.has(`${m.id}|${f.id}`) })),
  );
  const assigned = maxWeightBipartite(weights);

  const rows = assigned.map(([mi, fi]) => ({
    roundId: round!.id,
    maleUserId: males[mi]!.id,
    femaleUserId: females[fi]!.id,
    score: weights[mi]![fi]!,
  }));
  if (rows.length > 0) await db.insert(matches).values(rows);
  await db.update(matchRounds).set({ status: "completed" }).where(eq(matchRounds.id, round!.id));

  return {
    weekStart,
    roundId: round!.id,
    alreadyCompleted: false,
    males: males.length,
    females: females.length,
    matchCount: rows.length,
  };
}
