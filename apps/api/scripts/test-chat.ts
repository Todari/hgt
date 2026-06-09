/**
 * Chat + push backend E2E (against the running API):
 *   match → conversation auto-created → register device → send message
 *   (persist + push trigger) → read history → access control.
 *
 *   pnpm --filter api exec tsx scripts/test-chat.ts
 */
import "dotenv/config";
import { eq, inArray, like } from "drizzle-orm";
import { db } from "../src/db/client";
import { users, keywords, matchRounds } from "../src/db/schema";
import { runWeeklyMatch, weekStartMonday } from "../src/matching/engine";

const BASE = "http://localhost:8080";
const PREFIX = "TESTCHAT_";
const SESS_M = "chat_session_male_00000000000000000000000";
const SESS_F = "chat_session_female_000000000000000000000";
const SESS_X = "chat_session_other_0000000000000000000000";

type Res = { status: number; body: any };
const j = async (r: Response): Promise<Res> => {
  const t = await r.text();
  try {
    return { status: r.status, body: JSON.parse(t) };
  } catch {
    return { status: r.status, body: t };
  }
};
const authed = (s: string) => ({ "Content-Type": "application/json", Authorization: `Bearer ${s}` });

async function cleanup() {
  await db.delete(matchRounds).where(eq(matchRounds.weekStart, weekStartMonday()));
  await db.delete(users).where(like(users.studentId, `${PREFIX}%`));
}

async function main() {
  let pass = true;
  const check = (n: string, c: boolean) => {
    console.log(`  ${c ? "✅" : "❌"} ${n}`);
    if (!c) pass = false;
  };

  await cleanup();
  const cat = await db.select().from(keywords);
  const kid = (v: string) => {
    const k = cat.find((x) => x.value === v);
    if (!k) throw new Error("keyword " + v);
    return k.id;
  };

  const m = (await db.insert(users).values({ studentId: `${PREFIX}M`, name: "남학생", gender: true, age: 25, major: "전자공학과", explore: true, canCc: true, academicStatus: "재학", session: SESS_M }).returning())[0]!;
  const f = (await db.insert(users).values({ studentId: `${PREFIX}F`, name: "여학생", gender: false, age: 24, major: "미디어학부", explore: true, canCc: true, academicStatus: "재학", session: SESS_F }).returning())[0]!;
  await db.insert(users).values({ studentId: `${PREFIX}X`, name: "제3자", gender: true, age: 26, major: "기타학과", explore: false, canCc: true, academicStatus: "재학", session: SESS_X });

  await fetch(`${BASE}/me/profile`, { method: "PUT", headers: authed(SESS_M), body: JSON.stringify({ selfKeywordIds: [kid("게임")], idealKeywordIds: [kid("영화감상")] }) });
  await fetch(`${BASE}/me/profile`, { method: "PUT", headers: authed(SESS_F), body: JSON.stringify({ selfKeywordIds: [kid("영화감상")], idealKeywordIds: [kid("게임")] }) });

  const others = (await db.select({ id: users.id }).from(users).where(eq(users.explore, true))).map((u) => u.id).filter((id) => id !== m.id && id !== f.id);
  if (others.length) await db.update(users).set({ explore: false }).where(inArray(users.id, others));
  await db.delete(matchRounds).where(eq(matchRounds.weekStart, weekStartMonday()));
  const run = await runWeeklyMatch(weekStartMonday());
  if (others.length) await db.update(users).set({ explore: true }).where(inArray(users.id, others));
  check("1. 매칭 성사 → 대화 자동 생성 (matchCount=1)", run.matchCount === 1);

  const convs = await fetch(`${BASE}/conversations`, { headers: authed(SESS_M) }).then(j);
  const conv = convs.body?.data?.[0];
  check("2. GET /conversations — 상대=여학생", conv?.partner?.name === "여학생");
  const convId = conv?.id as string;

  const dev = await fetch(`${BASE}/me/devices`, { method: "POST", headers: authed(SESS_F), body: JSON.stringify({ platform: "ios", token: "fake-device-token-123" }) }).then(j);
  check("3. POST /me/devices — 디바이스 등록 (201)", dev.status === 201);

  const send = await fetch(`${BASE}/conversations/${convId}/messages`, { method: "POST", headers: authed(SESS_M), body: JSON.stringify({ body: "안녕하세요! 반가워요 :)" }) }).then(j);
  check("4. 메시지 전송 (201) + 푸시 트리거", send.status === 201 && send.body?.data?.body === "안녕하세요! 반가워요 :)");

  const hist = await fetch(`${BASE}/conversations/${convId}/messages`, { headers: authed(SESS_F) }).then(j);
  check("5. 상대가 이력 조회 — 1건, 발신자=남학생", hist.body?.data?.length === 1 && hist.body.data[0].senderId === m.id);

  const denied = await fetch(`${BASE}/conversations/${convId}/messages`, { headers: authed(SESS_X) }).then(j);
  check("6. 제3자 접근 차단 (404)", denied.status === 404);

  await cleanup();
  console.log(pass ? "\n🎉 채팅+푸시 백엔드 E2E 통과" : "\n❌ 일부 실패");
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
