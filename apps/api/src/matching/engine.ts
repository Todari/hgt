import { eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import {
  users,
  keywords,
  userSelfKeywords,
  userIdealKeywords,
  matchRounds,
  matches,
  conversations,
  blocks,
} from "../db/schema";
import { pairScore, type Candidate, type ScoredKeyword } from "./score";
import { maxWeightBipartite } from "./assign";
import { sendPush } from "../push/send";

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

  // Only users with a usable profile (≥1 self + ≥1 ideal keyword) join the pool.
  const candidates = (await loadCandidates()).filter((c) => c.self.length > 0 && c.ideal.length > 0);
  const males = candidates.filter((c) => c.gender);
  const females = candidates.filter((c) => !c.gender);

  // Forbidden pairs: past matches (no repeat) + blocks (either direction).
  const past = await db.select({ m: matches.maleUserId, f: matches.femaleUserId }).from(matches);
  const forbidden = new Set(past.map((r) => `${r.m}|${r.f}`));
  const blockRows = await db.select({ a: blocks.blockerId, b: blocks.blockedId }).from(blocks);
  for (const r of blockRows) {
    forbidden.add(`${r.a}|${r.b}`);
    forbidden.add(`${r.b}|${r.a}`);
  }

  const weights = males.map((m) =>
    females.map((f) => pairScore(m, f, { pastMatch: forbidden.has(`${m.id}|${f.id}`) })),
  );
  const assigned = maxWeightBipartite(weights);

  const rows = assigned.map(([mi, fi]) => ({
    roundId: round!.id,
    maleUserId: males[mi]!.id,
    femaleUserId: females[fi]!.id,
    score: weights[mi]![fi]!,
  }));
  if (rows.length > 0) {
    const inserted = await db
      .insert(matches)
      .values(rows)
      .returning({ id: matches.id, male: matches.maleUserId, female: matches.femaleUserId });
    // a conversation per matched pair (idempotent), then notify both sides
    await db
      .insert(conversations)
      .values(inserted.map((mt) => ({ matchId: mt.id, userAId: mt.male, userBId: mt.female })))
      .onConflictDoNothing();
    for (const mt of inserted) {
      void sendPush(mt.male, { title: "새 매칭 ✨", body: "이번 주 매칭 상대가 도착했어요!", data: { type: "match" } });
      void sendPush(mt.female, { title: "새 매칭 ✨", body: "이번 주 매칭 상대가 도착했어요!", data: { type: "match" } });
    }
  }

  // Notify eligible users who weren't matched this round.
  const matchedIds = new Set(rows.flatMap((r) => [r.maleUserId, r.femaleUserId]));
  for (const cand of candidates) {
    if (!matchedIds.has(cand.id)) {
      void sendPush(cand.id, {
        title: "이번 주 매칭",
        body: "아쉽게도 이번 주엔 매칭이 안 됐어요. 키워드를 다듬어볼까요?",
        data: { type: "no_match" },
      });
    }
  }

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
