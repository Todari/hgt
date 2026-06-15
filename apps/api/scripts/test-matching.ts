/**
 * Matching engine test: unit-checks the assignment algorithm, then seeds an
 * isolated population with known best-pairings and asserts the engine finds them.
 * Test users are created with a TESTMATCH_ prefix and cleaned up afterwards;
 * real users' `explore` flag is toggled off during the run and restored.
 *
 *   pnpm --filter api test:match
 */
import "dotenv/config";
import { eq, like, inArray } from "drizzle-orm";
import { db } from "../src/db/client";
import {
  users,
  keywords,
  userSelfKeywords,
  userIdealKeywords,
  matchRounds,
  matches,
} from "../src/db/schema";
import { runWeeklyMatch } from "../src/matching/engine";
import { maxWeightBipartite } from "../src/matching/assign";

const WEEK = "2099-01-04"; // a Monday, isolated test round
const PREFIX = "TESTMATCH_";

function unitChecks() {
  const m1 = [[5, 9], [8, 3]];
  const r1 = maxWeightBipartite(m1).sort((a, b) => a[0] - b[0]);
  const t1 = r1.reduce((s, [i, j]) => s + m1[i]![j]!, 0);
  console.log("[unit] 2x2 ->", JSON.stringify(r1), "total", t1, t1 === 17 ? "OK" : "FAIL(want 17)");

  const m2 = [[3, 0, 0], [0, 0, 7], [0, 5, 0]];
  const r2 = maxWeightBipartite(m2).sort((a, b) => a[0] - b[0]);
  const t2 = r2.reduce((s, [i, j]) => s + m2[i]![j]!, 0);
  console.log("[unit] 3x3 ->", JSON.stringify(r2), "total", t2, t2 === 15 ? "OK" : "FAIL(want 15)");

  const r3 = maxWeightBipartite([[0, 0], [0, 0]]);
  console.log("[unit] all-zero ->", JSON.stringify(r3), r3.length === 0 ? "OK" : "FAIL(want [])");
}

async function cleanup() {
  await db.delete(matchRounds).where(eq(matchRounds.weekStart, WEEK));
  await db.delete(users).where(like(users.studentId, PREFIX + "%"));
}

async function main() {
  unitChecks();

  const cat = await db.select().from(keywords);
  const kid = (v: string) => {
    const k = cat.find((x) => x.value === v);
    if (!k) throw new Error("missing seed keyword: " + v);
    return k.id;
  };

  await cleanup();

  // Isolate: disable explore for all currently-active users, remember them.
  const wasOn = (await db.select({ id: users.id }).from(users).where(eq(users.explore, true))).map((u) => u.id);
  if (wasOn.length) await db.update(users).set({ explore: false }).where(inArray(users.id, wasOn));

  const mk = async (sid: string, name: string, gender: boolean, self: string[], ideal: string[], terms = true) => {
    const [u] = await db
      .insert(users)
      // termsAgreedAt is required since the engine gates the pool on consent.
      .values({ studentId: PREFIX + sid, name, gender, age: 23, major: "테스트학과", explore: true, canCc: true, termsAgreedAt: terms ? new Date() : null })
      .returning();
    if (self.length) await db.insert(userSelfKeywords).values(self.map((v) => ({ userId: u!.id, keywordId: kid(v) })));
    if (ideal.length) await db.insert(userIdealKeywords).values(ideal.map((v) => ({ userId: u!.id, keywordId: kid(v) })));
  };

  // Designed best pairs: (남1,여1), (남2,여2), (남3,여3) each score 2.0; cross pairs 0.
  await mk("M1", "남1", true, ["활발한"], ["영화감상"]);
  await mk("M2", "남2", true, ["게임"], ["독서"]);
  await mk("M3", "남3", true, ["운동"], ["요리"]);
  await mk("F1", "여1", false, ["영화감상"], ["활발한"]);
  await mk("F2", "여2", false, ["독서"], ["게임"]);
  await mk("F3", "여3", false, ["요리"], ["운동"]);
  // Consent gate: a would-be perfect pair, but 남4 never agreed to terms —
  // neither may appear in the round (여4 is left without a counterpart).
  await mk("M4", "남4", true, ["여행"], ["패션"], false);
  await mk("F4", "여4", false, ["패션"], ["여행"]);

  const res = await runWeeklyMatch(WEEK);
  console.log("[run]", JSON.stringify(res));

  const rows = await db
    .select({ score: matches.score, mId: matches.maleUserId, fId: matches.femaleUserId })
    .from(matches)
    .where(eq(matches.roundId, res.roundId));
  const names = new Map(
    (await db.select({ id: users.id, name: users.name }).from(users).where(like(users.studentId, PREFIX + "%"))).map(
      (u) => [u.id, u.name],
    ),
  );
  const pairs = rows.map((r) => `${names.get(r.mId)}↔${names.get(r.fId)} (${r.score})`).sort();
  console.log("[matches]", pairs.join(", "));

  const expected = ["남1↔여1 (2)", "남2↔여2 (2)", "남3↔여3 (2)"];
  const correct = res.matchCount === 3 && expected.every((e) => pairs.includes(e));
  console.log(correct ? "✅ optimal 3 pairs matched" : "❌ unexpected pairs");
  const consentGated = !pairs.some((p) => p.includes("남4") || p.includes("여4"));
  console.log(consentGated ? "✅ consent gate: 약관 미동의 사용자 풀 제외" : "❌ 미동의 사용자가 매칭됨");

  // Re-runs only pair still-unmatched users: no NEW matches, existing 3 kept.
  const again = await runWeeklyMatch(WEEK);
  const kept = await db.$count(matches, eq(matches.roundId, res.roundId));
  const idempotent = again.alreadyCompleted && again.matchCount === 0 && kept === 3;
  console.log(idempotent ? "✅ idempotent re-run (새 매칭 0, 기존 3쌍 유지)" : "❌ re-run: " + JSON.stringify(again) + ` kept=${kept}`);

  await cleanup();
  if (wasOn.length) await db.update(users).set({ explore: true }).where(inArray(users.id, wasOn));
  console.log("cleaned up.");
  process.exit(correct && consentGated && idempotent ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  try {
    await cleanup();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
