/**
 * Launch-feature checks: block (excludes from matching), unblock, chat read
 * state (unread count + mark-read), report, and the rate-limit logic.
 *
 *   pnpm --filter api exec tsx scripts/test-launch.ts
 */
import "dotenv/config";
import { eq, inArray, like } from "drizzle-orm";
import { db } from "../src/db/client";
import { users, keywords, matchRounds } from "../src/db/schema";
import { runWeeklyMatch } from "../src/matching/engine";
import { rateLimit } from "../src/lib/rate-limit";

const BASE = "http://localhost:8080";
const PREFIX = "TESTLAUNCH_";
// Isolated PAST Monday — never touches the live (current-week) round.
const WEEK = "2020-01-27";
const SESS_M = "launch_session_m_0000000000000000000000000";
const SESS_F = "launch_session_f_0000000000000000000000000";
const SESS_N = "launch_session_n_0000000000000000000000000";

const authed = (s: string) => ({ "Content-Type": "application/json", Authorization: `Bearer ${s}` });
const j = async (r: Response) => {
  const t = await r.text();
  try {
    return { status: r.status, body: JSON.parse(t) };
  } catch {
    return { status: r.status, body: t };
  }
};

async function cleanup() {
  await db.delete(matchRounds).where(eq(matchRounds.weekStart, WEEK));
  await db.delete(users).where(like(users.studentId, `${PREFIX}%`));
}

async function isolatedRun(mId: string, fId: string) {
  const others = (await db.select({ id: users.id }).from(users).where(eq(users.explore, true)))
    .map((u) => u.id)
    .filter((id) => id !== mId && id !== fId);
  if (others.length) await db.update(users).set({ explore: false }).where(inArray(users.id, others));
  await db.delete(matchRounds).where(eq(matchRounds.weekStart, WEEK));
  const run = await runWeeklyMatch(WEEK);
  if (others.length) await db.update(users).set({ explore: true }).where(inArray(users.id, others));
  return run;
}

async function main() {
  let pass = true;
  const check = (n: string, c: boolean) => {
    console.log(`  ${c ? "✅" : "❌"} ${n}`);
    if (!c) pass = false;
  };

  // 0) rate-limit logic (no portal hits)
  const allowed = [1, 2, 3, 4, 5].map(() => rateLimit("unit-test", 5, 60_000));
  const blocked = rateLimit("unit-test", 5, 60_000);
  check("0. 레이트리밋: 5회 허용 후 6번째 차단", allowed.every(Boolean) && blocked === false);

  await cleanup();
  const cat = await db.select().from(keywords);
  const kid = (v: string) => {
    const k = cat.find((x) => x.value === v);
    if (!k) throw new Error("keyword " + v);
    return k.id;
  };

  const m = (await db.insert(users).values({ studentId: `${PREFIX}M`, name: "남", gender: true, age: 25, major: "A", explore: true, canCc: true, academicStatus: "재학", termsAgreedAt: new Date(), session: SESS_M }).returning())[0]!;
  const f = (await db.insert(users).values({ studentId: `${PREFIX}F`, name: "여", gender: false, age: 24, major: "B", explore: true, canCc: true, academicStatus: "재학", termsAgreedAt: new Date(), session: SESS_F }).returning())[0]!;
  await fetch(`${BASE}/me/profile`, { method: "PUT", headers: authed(SESS_M), body: JSON.stringify({ selfKeywordIds: [kid("게임")], idealKeywordIds: [kid("영화감상")] }) });
  await fetch(`${BASE}/me/profile`, { method: "PUT", headers: authed(SESS_F), body: JSON.stringify({ selfKeywordIds: [kid("영화감상")], idealKeywordIds: [kid("게임")] }) });

  // 1) block excludes from matching
  await fetch(`${BASE}/me/blocks`, { method: "POST", headers: authed(SESS_M), body: JSON.stringify({ userId: f.id }) });
  const blockedRun = await isolatedRun(m.id, f.id);
  check("1. 차단된 쌍은 매칭 안 됨 (matchCount=0)", blockedRun.matchCount === 0);

  // 2) unblock -> they match -> conversation created
  await fetch(`${BASE}/me/blocks/${f.id}`, { method: "DELETE", headers: authed(SESS_M) });
  const okRun = await isolatedRun(m.id, f.id);
  check("2. 차단 해제 후 매칭됨 (matchCount=1)", okRun.matchCount === 1);

  const convs = await fetch(`${BASE}/conversations`, { headers: authed(SESS_F) }).then(j);
  const convId = convs.body?.data?.[0]?.id as string;

  // 3) read state — M sends, F sees unread, then marks read
  await fetch(`${BASE}/conversations/${convId}/messages`, { method: "POST", headers: authed(SESS_M), body: JSON.stringify({ body: "안녕!" }) });
  const before = await fetch(`${BASE}/conversations`, { headers: authed(SESS_F) }).then(j);
  check("3. 안읽음 카운트 = 1", before.body?.data?.[0]?.unreadCount === 1);
  await fetch(`${BASE}/conversations/${convId}/read`, { method: "POST", headers: authed(SESS_F) });
  const after = await fetch(`${BASE}/conversations`, { headers: authed(SESS_F) }).then(j);
  check("4. 읽음 처리 후 카운트 = 0", after.body?.data?.[0]?.unreadCount === 0);

  // 4) report
  const report = await fetch(`${BASE}/reports`, { method: "POST", headers: authed(SESS_F), body: JSON.stringify({ userId: m.id, reason: "부적절한 메시지" }) }).then(j);
  check("5. 신고 (201)", report.status === 201);

  // 5) block ends the existing conversation (hidden from list + send 403)
  await fetch(`${BASE}/me/blocks`, { method: "POST", headers: authed(SESS_M), body: JSON.stringify({ userId: f.id }) });
  const afterBlock = await fetch(`${BASE}/conversations`, { headers: authed(SESS_M) }).then(j);
  check("6. 차단 시 대화 목록에서 숨김", (afterBlock.body?.data?.length ?? -1) === 0);
  const blockedSend = await fetch(`${BASE}/conversations/${convId}/messages`, { method: "POST", headers: authed(SESS_M), body: JSON.stringify({ body: "x" }) }).then(j);
  check("7. 차단 시 메시지 전송 403", blockedSend.status === 403);

  // 6) terms consent stamps termsAgreedAt
  await fetch(`${BASE}/me/profile`, { method: "PUT", headers: authed(SESS_F), body: JSON.stringify({ agreedToTerms: true }) });
  const meAfter = await fetch(`${BASE}/me`, { headers: authed(SESS_F) }).then(j);
  check("8. 약관 동의 → termsAgreedAt 기록", Boolean(meAfter.body?.data?.termsAgreedAt));

  // 7) FIRST consent also defaults the user into the matching pool
  // ('매칭 풀에 자동으로 참여됩니다. 설정에서 끌 수 있어요')
  await db.insert(users).values({ studentId: `${PREFIX}N`, name: "신규", gender: false, age: 22, major: "C", explore: false, canCc: true, academicStatus: "재학", session: SESS_N });
  await fetch(`${BASE}/me/profile`, { method: "PUT", headers: authed(SESS_N), body: JSON.stringify({ agreedToTerms: true }) });
  const meNew = await fetch(`${BASE}/me`, { headers: authed(SESS_N) }).then(j);
  check("9. 첫 약관 동의 → explore 자동 활성화", meNew.body?.data?.explore === true && Boolean(meNew.body?.data?.termsAgreedAt));

  await cleanup();
  console.log(pass ? "\n🎉 런칭 기능 E2E 통과" : "\n❌ 일부 실패");
  process.exit(pass ? 0 : 1);
}

main().catch(async (e) => {
  console.error("error:", e);
  try {
    await cleanup();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
