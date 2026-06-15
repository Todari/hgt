/**
 * QA: create a persistent matched pair (with profile + chat) and print the male
 * user's session so a headless browser can view the authed screens. Not for prod.
 *
 *   pnpm --filter api exec tsx scripts/qa-seed.ts
 */
import "dotenv/config";
import { eq, inArray, like } from "drizzle-orm";
import { db } from "../src/db/client";
import { users, keywords, matchRounds } from "../src/db/schema";
import { runWeeklyMatch, weekStartMonday } from "../src/matching/engine";

const BASE = "http://localhost:8080";
const PREFIX = "QASEED_";
const SM = "qa_seed_male_000000000000000000000000000";
const SF = "qa_seed_female_0000000000000000000000000";
const authed = (s: string) => ({ "Content-Type": "application/json", Authorization: `Bearer ${s}` });

async function main() {
  await db.delete(matchRounds).where(eq(matchRounds.weekStart, weekStartMonday()));
  await db.delete(users).where(like(users.studentId, `${PREFIX}%`));
  const cat = await db.select().from(keywords);
  const kid = (v: string) => {
    const k = cat.find((x) => x.value === v);
    if (!k) throw new Error("keyword " + v);
    return k.id;
  };

  const m = (await db.insert(users).values({ studentId: `${PREFIX}M`, name: "이태훈", gender: true, age: 24, major: "컴퓨터공학과", description: "음악과 영화를 좋아하는 공대생입니다. 주말엔 카페 투어 다녀요.", explore: true, canCc: true, academicStatus: "재학", session: SM }).returning())[0]!;
  const f = (await db.insert(users).values({ studentId: `${PREFIX}F`, name: "박서연", gender: false, age: 23, major: "시각디자인과", description: "그림 그리고 전시 보러 다니는 걸 좋아해요.", explore: true, canCc: true, academicStatus: "재학", session: SF }).returning())[0]!;
  await fetch(`${BASE}/me/profile`, { method: "PUT", headers: authed(SM), body: JSON.stringify({ selfKeywordIds: [kid("게임"), kid("영화감상"), kid("음악감상")], idealKeywordIds: [kid("감성적인"), kid("그림")], targetMinAge: 20, targetMaxAge: 26, agreedToTerms: true }) });
  await fetch(`${BASE}/me/profile`, { method: "PUT", headers: authed(SF), body: JSON.stringify({ selfKeywordIds: [kid("감성적인"), kid("그림"), kid("영화감상")], idealKeywordIds: [kid("게임"), kid("음악감상")], agreedToTerms: true }) });

  const others = (await db.select({ id: users.id }).from(users).where(eq(users.explore, true))).map((u) => u.id).filter((id) => id !== m.id && id !== f.id);
  if (others.length) await db.update(users).set({ explore: false }).where(inArray(users.id, others));
  await db.delete(matchRounds).where(eq(matchRounds.weekStart, weekStartMonday()));
  await runWeeklyMatch(weekStartMonday());
  if (others.length) await db.update(users).set({ explore: true }).where(inArray(users.id, others));

  const convs = (await fetch(`${BASE}/conversations`, { headers: authed(SM) }).then((r) => r.json())) as { data?: Array<{ id: string }> };
  const convId = convs.data?.[0]?.id;
  if (convId) {
    await fetch(`${BASE}/conversations/${convId}/messages`, { method: "POST", headers: authed(SF), body: JSON.stringify({ body: "안녕하세요! 프로필 보고 연락드려요 :)" }) });
    await fetch(`${BASE}/conversations/${convId}/messages`, { method: "POST", headers: authed(SM), body: JSON.stringify({ body: "안녕하세요 반가워요! 영화 좋아하신다니 반갑네요" }) });
  }
  console.log(JSON.stringify({ session: SM, sessionFemale: SF, convId }));
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
