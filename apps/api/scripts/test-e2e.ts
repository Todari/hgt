/**
 * Full E2E flow check against the running API (localhost:8080):
 *   login → profile/keyword setup (PUT /me/profile) → GET /me → weekly match →
 *   GET /me/match shows the partner.
 *
 * Uses the real portal login for the entry point, plus two synthetic registered
 * students (with injected sessions) as the match pool, so a real match is
 * produced. Everything is cleaned up afterwards.
 *
 *   pnpm --filter api exec tsx scripts/test-e2e.ts
 */
import "dotenv/config";
import { eq, inArray, like } from "drizzle-orm";
import { db } from "../src/db/client";
import { users, keywords, matchRounds } from "../src/db/schema";
import { runWeeklyMatch } from "../src/matching/engine";

const BASE = "http://localhost:8080";
const PREFIX = "TESTE2E_";
// Isolated PAST Monday — never touches the live (current-week) round, so
// /me/match surfaces this round as `previous`.
const WEEK = "2020-01-20";
const SESS_M = "e2e_session_male_000000000000000000000000";
const SESS_F = "e2e_session_female_0000000000000000000000";

type Res = { status: number; body: any };
const j = async (r: Response): Promise<Res> => {
  const t = await r.text();
  try {
    return { status: r.status, body: JSON.parse(t) };
  } catch {
    return { status: r.status, body: t };
  }
};
const authed = (sess: string) => ({ "Content-Type": "application/json", Authorization: `Bearer ${sess}` });

async function cleanup() {
  await db.delete(matchRounds).where(eq(matchRounds.weekStart, WEEK));
  await db.delete(users).where(like(users.studentId, `${PREFIX}%`));
}

async function main() {
  let pass = true;
  const check = (name: string, cond: boolean) => {
    console.log(`  ${cond ? "✅" : "❌"} ${name}`);
    if (!cond) pass = false;
  };

  // 0) entry point — real portal login (credentials from env; never commit them)
  const portalId = process.env.HONGIK_ID;
  const portalPw = process.env.HONGIK_PW;
  if (portalId && portalPw) {
    const login = await fetch(`${BASE}/auth/hongik`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: portalId, pw: portalPw }),
    }).then(j);
    check("1. 로그인 (POST /auth/hongik) → 세션 발급", login.status === 200 && Boolean(login.body?.data?.session));
  } else {
    console.log("  ⏭ 1. 로그인 — HONGIK_ID/HONGIK_PW 미설정으로 건너뜀");
  }

  await cleanup();

  const cat = await db.select().from(keywords);
  const kid = (v: string): string => {
    const k = cat.find((x) => x.value === v);
    if (!k) throw new Error(`seed keyword missing: ${v}`);
    return k.id;
  };

  // 1) two registered students (the match pool) with injected sessions
  const m = (
    await db.insert(users).values({ studentId: `${PREFIX}M`, name: "이지훈", gender: true, age: 24, major: "기계공학과", explore: true, canCc: true, academicStatus: "재학", termsAgreedAt: new Date(), session: SESS_M }).returning()
  )[0]!;
  const f = (
    await db.insert(users).values({ studentId: `${PREFIX}F`, name: "박서연", gender: false, age: 23, major: "시각디자인과", explore: true, canCc: true, academicStatus: "재학", termsAgreedAt: new Date(), session: SESS_F }).returning()
  )[0]!;
  check("2. 상대 풀 구성 (학생 2명 등록)", Boolean(m) && Boolean(f));

  // 2) profile/keyword setup via the real endpoint (the onboarding step)
  const putM = await fetch(`${BASE}/me/profile`, {
    method: "PUT",
    headers: authed(SESS_M),
    body: JSON.stringify({ selfKeywordIds: [kid("유머러스한"), kid("게임")], idealKeywordIds: [kid("감성적인"), kid("영화감상")], explore: true, canCc: true }),
  }).then(j);
  const putF = await fetch(`${BASE}/me/profile`, {
    method: "PUT",
    headers: authed(SESS_F),
    body: JSON.stringify({ selfKeywordIds: [kid("감성적인"), kid("영화감상")], idealKeywordIds: [kid("유머러스한"), kid("게임")], explore: true, canCc: true }),
  }).then(j);
  check("3. 프로필/키워드 저장 (PUT /me/profile, 온보딩)", putM.status === 200 && putF.status === 200);

  // 3) read back
  const meM = await fetch(`${BASE}/me`, { headers: authed(SESS_M) }).then(j);
  check("4. 프로필 조회 (GET /me) — 키워드 반영", meM.body?.data?.selfKeywords?.length === 2 && meM.body?.data?.idealKeywords?.length === 2);

  // 4) run the weekly match, isolated to just these two
  const others = (await db.select({ id: users.id }).from(users).where(eq(users.explore, true)))
    .map((u) => u.id)
    .filter((id) => id !== m.id && id !== f.id);
  if (others.length) await db.update(users).set({ explore: false }).where(inArray(users.id, others));
  await db.delete(matchRounds).where(eq(matchRounds.weekStart, WEEK));
  const run = await runWeeklyMatch(WEEK);
  if (others.length) await db.update(users).set({ explore: true }).where(inArray(users.id, others));
  check("5. 주간 매칭 실행 → 1쌍 성사", run.matchCount === 1);

  // 5) the payoff — each user sees their partner ({ current, previous };
  // the isolated round is in the past, so it lands in `previous`)
  const matchM = await fetch(`${BASE}/me/match`, { headers: authed(SESS_M) }).then(j);
  const matchF = await fetch(`${BASE}/me/match`, { headers: authed(SESS_F) }).then(j);
  check("6. 매칭 결과 (GET /me/match) — 남→박서연", matchM.body?.data?.previous?.partner?.name === "박서연");
  check("7. 매칭 결과 (GET /me/match) — 여→이지훈", matchF.body?.data?.previous?.partner?.name === "이지훈");
  console.log(`     → 매칭: 이지훈 ↔ 박서연  (점수 ${matchM.body?.data?.previous?.score})`);

  await cleanup();
  console.log(pass ? "\n🎉 E2E 전 구간 통과 — 로그인→프로필→매칭→상대확인" : "\n❌ E2E 일부 실패");
  process.exit(pass ? 0 : 1);
}

main().catch(async (e) => {
  console.error("E2E error:", e);
  try {
    await cleanup();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
