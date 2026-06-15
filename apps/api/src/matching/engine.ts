import { and, eq, inArray, isNotNull, notInArray, or } from "drizzle-orm";
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
  bannedStudents,
} from "../db/schema";
import { pairScore, type Candidate, type ScoredKeyword } from "./score";
import { maxWeightBipartite } from "./assign";
import { sendPush } from "../push/send";
import { broadcastToUser } from "../ws/registry";
import { toPartnerUser } from "../lib/public-user";

/** KST (Asia/Seoul) is UTC+9 with no DST — a fixed offset is exact. */
export const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** ISO date (YYYY-MM-DD) of the KST Monday of the week containing `d`. */
export function weekStartMonday(d: Date = new Date()): string {
  const kst = new Date(d.getTime() + KST_OFFSET_MS); // read UTC fields as KST
  const day = kst.getUTCDay(); // 0=Sun .. 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() + diff));
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

/**
 * Active participants this week with their keyword sets: `explore = true`,
 * terms agreed (consent gates the pool), and not banned — banned users keep
 * their row (and `explore`) until deletion, so exclude them here.
 */
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
    .where(
      and(
        eq(users.explore, true),
        isNotNull(users.termsAgreedAt),
        notInArray(
          users.studentId,
          db.select({ studentId: bannedStudents.studentId }).from(bannedStudents),
        ),
      ),
    );
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

  const firstRun = !existing;
  let round = existing;
  if (!round) {
    const [created] = await db.insert(matchRounds).values({ weekStart }).returning();
    round = created!;
  }

  // Users already matched THIS week keep their single match — exclude them so daily
  // re-runs only pair newcomers / still-unmatched users (near-immediate first match).
  const thisRound = await db
    .select({ m: matches.maleUserId, f: matches.femaleUserId })
    .from(matches)
    .where(eq(matches.roundId, round.id));
  const matchedThisRound = new Set(thisRound.flatMap((r) => [r.m, r.f]));

  // Only users with a usable profile (≥1 self + ≥1 ideal keyword) join the pool.
  const candidates = (await loadCandidates()).filter(
    (c) => c.self.length > 0 && c.ideal.length > 0 && !matchedThisRound.has(c.id),
  );
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

    // Conflicting (pre-existing) conversations keep their row — look the ids
    // up by pair. Full user rows feed the WS event's partner payload.
    const pairedIds = inserted.flatMap((mt) => [mt.male, mt.female]);
    const [convRows, userRows] = await Promise.all([
      db
        .select({ id: conversations.id, userAId: conversations.userAId, userBId: conversations.userBId })
        .from(conversations)
        .where(
          or(
            ...inserted.map((mt) =>
              and(eq(conversations.userAId, mt.male), eq(conversations.userBId, mt.female)),
            ),
          ),
        ),
      db.select().from(users).where(inArray(users.id, pairedIds)),
    ]);
    const convByPair = new Map(convRows.map((cv) => [`${cv.userAId}|${cv.userBId}`, cv.id]));
    const userById = new Map(userRows.map((u) => [u.id, u]));

    for (const mt of inserted) {
      const conversationId = convByPair.get(`${mt.male}|${mt.female}`);
      const male = userById.get(mt.male);
      const female = userById.get(mt.female);
      if (conversationId && male && female) {
        broadcastToUser(mt.male, { type: "match", partner: toPartnerUser(female), conversationId });
        broadcastToUser(mt.female, { type: "match", partner: toPartnerUser(male), conversationId });
      }
      const data = { type: "match", ...(conversationId ? { conversationId } : {}) };
      void sendPush(mt.male, { title: "새 매칭 ✨", body: "이번 주 매칭 상대가 도착했어요!", data });
      void sendPush(mt.female, { title: "새 매칭 ✨", body: "이번 주 매칭 상대가 도착했어요!", data });
    }
  }

  // No-match push only on the first run of the week (daily re-runs must not spam).
  if (firstRun) {
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
  }

  await db.update(matchRounds).set({ status: "completed" }).where(eq(matchRounds.id, round!.id));

  return {
    weekStart,
    roundId: round!.id,
    alreadyCompleted: !firstRun,
    males: males.length,
    females: females.length,
    matchCount: rows.length,
  };
}
