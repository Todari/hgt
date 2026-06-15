/**
 * App Review demo seed — give the DEMO_ACCOUNTS reviewer a COMPLETE experience:
 * a finished profile, a current-week match with a demo partner, and a
 * conversation with a couple of messages. Run ONCE on the target server before
 * submitting to the stores.
 *
 *   # uses the first DEMO_ACCOUNTS entry (id:pw) from the env:
 *   DEMO_ACCOUNTS="review01:somepass" pnpm --filter api exec tsx scripts/demo-seed.ts
 *   # or pass the id explicitly:
 *   pnpm --filter api exec tsx scripts/demo-seed.ts review01
 *
 * Safe for production: it does NOT run the weekly matcher or touch the global
 * match round / other users — it inserts the demo match + conversation directly
 * and only ever removes its own demo partner (prefix DEMOSEED_). The reviewer
 * logs in normally afterwards (login rotates the session but keeps this data).
 */
import "dotenv/config";
import { and, eq, like, or } from "drizzle-orm";
import { db } from "../src/db/client";
import {
  users,
  keywords,
  matchRounds,
  matches,
  conversations,
  messages,
} from "../src/db/schema";
import { weekStartMonday } from "../src/matching/engine";

const BASE = process.env.DEMO_SEED_BASE ?? "http://localhost:8080";
const PARTNER_PREFIX = "DEMOSEED_";
// Deterministic throwaway sessions so we can call the authed profile endpoint.
// The reviewer's real login rotates the demo user's session afterwards.
const DEMO_SESSION = "demo_seed_session_aaaaaaaaaaaaaaaaaaaaaaaa";
const PARTNER_SESSION = "demo_seed_session_partner_bbbbbbbbbbbbbbbbbb";
const authed = (s: string) => ({ "Content-Type": "application/json", Authorization: `Bearer ${s}` });

function resolveDemoId(): string {
  const fromArg = process.argv[2];
  if (fromArg) return fromArg;
  const first = (process.env.DEMO_ACCOUNTS ?? "").split(",")[0]?.trim() ?? "";
  const id = first.includes(":") ? first.slice(0, first.indexOf(":")) : "";
  if (!id) {
    throw new Error(
      "No demo id. Set DEMO_ACCOUNTS='id:pw' or pass the id as the first arg.",
    );
  }
  return id;
}

async function setProfile(session: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/me/profile`, {
    method: "PUT",
    headers: authed(session),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT /me/profile failed (${res.status}): ${await res.text()}`);
}

async function main() {
  const demoId = resolveDemoId();
  const cat = await db.select().from(keywords);
  const kid = (v: string) => {
    const k = cat.find((x) => x.value === v);
    if (!k) throw new Error(`keyword not found: ${v} (run db:seed first)`);
    return k.id;
  };

  // Clean any prior demo partner (cascades its match + conversation + messages).
  await db.delete(users).where(like(users.studentId, `${PARTNER_PREFIX}%`));

  // Upsert the demo user (studentId = the DEMO_ACCOUNTS id so login finds it).
  const [existingDemo] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.studentId, demoId))
    .limit(1);
  let demoUserId: string;
  if (existingDemo) {
    await db
      .update(users)
      .set({ session: DEMO_SESSION, explore: true, updatedAt: new Date() })
      .where(eq(users.id, existingDemo.id));
    demoUserId = existingDemo.id;
  } else {
    const inserted = (
      await db
        .insert(users)
        .values({
          studentId: demoId,
          name: "데모",
          gender: true,
          age: 24,
          major: "데모대학과",
          description: "데모 계정입니다. 영화와 음악을 좋아해요.",
          explore: true,
          canCc: true,
          academicStatus: "재학",
          session: DEMO_SESSION,
        })
        .returning()
    )[0]!;
    demoUserId = inserted.id;
  }

  // Demo partner (female).
  const partner = (
    await db
      .insert(users)
      .values({
        studentId: `${PARTNER_PREFIX}F`,
        name: "이서연",
        gender: false,
        age: 23,
        major: "시각디자인과",
        description: "그림 그리고 전시 보러 다니는 걸 좋아해요. 영화도 자주 봐요.",
        explore: true,
        canCc: true,
        academicStatus: "재학",
        session: PARTNER_SESSION,
      })
      .returning()
  )[0]!;

  // Profiles + keywords through the API (validation + join tables + consent).
  await setProfile(DEMO_SESSION, {
    selfKeywordIds: [kid("게임"), kid("영화감상"), kid("음악감상")],
    idealKeywordIds: [kid("감성적인"), kid("그림")],
    targetMinAge: 20,
    targetMaxAge: 26,
    agreedToTerms: true,
  });
  await setProfile(PARTNER_SESSION, {
    selfKeywordIds: [kid("감성적인"), kid("그림"), kid("영화감상")],
    idealKeywordIds: [kid("게임"), kid("음악감상")],
    agreedToTerms: true,
  });

  // Ensure this KST week's round exists WITHOUT disturbing real matches.
  const week = weekStartMonday();
  const [round] =
    (await db.select().from(matchRounds).where(eq(matchRounds.weekStart, week)).limit(1)) ?? [];
  const roundId =
    round?.id ?? (await db.insert(matchRounds).values({ weekStart: week }).returning())[0]!.id;

  // Insert the demo match directly (male = demo, female = partner). The partner
  // was just recreated so no stale match row exists for this round.
  await db
    .insert(matches)
    .values({ roundId, maleUserId: demoUserId, femaleUserId: partner.id, score: 3 })
    .onConflictDoNothing();

  // Conversation for the pair + starter messages.
  const [conv] = await db
    .insert(conversations)
    .values({ userAId: demoUserId, userBId: partner.id })
    .onConflictDoNothing()
    .returning();
  const conversation =
    conv ??
    (
      await db
        .select()
        .from(conversations)
        .where(
          or(
            and(eq(conversations.userAId, demoUserId), eq(conversations.userBId, partner.id)),
            and(eq(conversations.userAId, partner.id), eq(conversations.userBId, demoUserId)),
          ),
        )
        .limit(1)
    )[0]!;

  const existingMsgs = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.conversationId, conversation.id))
    .limit(1);
  if (existingMsgs.length === 0) {
    await db.insert(messages).values([
      { conversationId: conversation.id, senderId: partner.id, body: "안녕하세요! 프로필 보고 연락드려요 :)" },
      { conversationId: conversation.id, senderId: demoUserId, body: "안녕하세요 반가워요! 영화 좋아하신다니 반갑네요" },
    ]);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        demoId,
        note: "Log in via DEMO_ACCOUNTS (id:pw). The session above is temporary and is rotated on login.",
        conversationId: conversation.id,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
