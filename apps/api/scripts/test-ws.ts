/**
 * WebSocket realtime check: F opens a socket, M sends a message via REST,
 * F receives it live over the socket.
 *
 *   pnpm --filter api exec tsx scripts/test-ws.ts
 */
import "dotenv/config";
import { eq, inArray, like } from "drizzle-orm";
import { db } from "../src/db/client";
import { users, keywords, matchRounds } from "../src/db/schema";
import { runWeeklyMatch, weekStartMonday } from "../src/matching/engine";

const BASE = "http://localhost:8080";
const PREFIX = "TESTWS_";
const SESS_M = "ws_session_male_0000000000000000000000000";
const SESS_F = "ws_session_female_000000000000000000000000";

const authed = (s: string) => ({ "Content-Type": "application/json", Authorization: `Bearer ${s}` });
const j = async (r: Response) => {
  const t = await r.text();
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
};

interface WSLike {
  addEventListener(type: string, cb: (evt: { data?: string }) => void, opts?: { once?: boolean }): void;
  send(data: string): void;
  close(): void;
}
const WebSocketCtor = (globalThis as unknown as { WebSocket: new (url: string) => WSLike }).WebSocket;

async function cleanup() {
  await db.delete(matchRounds).where(eq(matchRounds.weekStart, weekStartMonday()));
  await db.delete(users).where(like(users.studentId, `${PREFIX}%`));
}

function nextMessage(ws: WSLike, timeoutMs: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("WS message timeout")), timeoutMs);
    ws.addEventListener("message", (evt) => { clearTimeout(timer); resolve(JSON.parse(String(evt.data))); }, { once: true });
  });
}

async function main() {
  await cleanup();
  const cat = await db.select().from(keywords);
  const kid = (v: string) => {
    const k = cat.find((x) => x.value === v);
    if (!k) throw new Error("keyword " + v);
    return k.id;
  };

  const m = (await db.insert(users).values({ studentId: `${PREFIX}M`, name: "남", gender: true, age: 25, major: "A과", explore: true, canCc: true, academicStatus: "재학", session: SESS_M }).returning())[0]!;
  const f = (await db.insert(users).values({ studentId: `${PREFIX}F`, name: "여", gender: false, age: 24, major: "B과", explore: true, canCc: true, academicStatus: "재학", session: SESS_F }).returning())[0]!;
  await fetch(`${BASE}/me/profile`, { method: "PUT", headers: authed(SESS_M), body: JSON.stringify({ selfKeywordIds: [kid("게임")], idealKeywordIds: [kid("영화감상")] }) });
  await fetch(`${BASE}/me/profile`, { method: "PUT", headers: authed(SESS_F), body: JSON.stringify({ selfKeywordIds: [kid("영화감상")], idealKeywordIds: [kid("게임")] }) });

  const others = (await db.select({ id: users.id }).from(users).where(eq(users.explore, true))).map((u) => u.id).filter((id) => id !== m.id && id !== f.id);
  if (others.length) await db.update(users).set({ explore: false }).where(inArray(users.id, others));
  await db.delete(matchRounds).where(eq(matchRounds.weekStart, weekStartMonday()));
  await runWeeklyMatch(weekStartMonday());
  if (others.length) await db.update(users).set({ explore: true }).where(inArray(users.id, others));

  const convs = await fetch(`${BASE}/conversations`, { headers: authed(SESS_M) }).then(j);
  const convId = convs.data[0].id as string;

  // F connects
  const ws = new WebSocketCtor(`ws://localhost:8080/ws?token=${SESS_F}`);
  await new Promise<void>((res, rej) => {
    const t = setTimeout(() => rej(new Error("WS open timeout")), 5000);
    ws.addEventListener("open", () => { clearTimeout(t); res(); }, { once: true });
    ws.addEventListener("error", () => { clearTimeout(t); rej(new Error("WS error")); }, { once: true });
  });
  console.log("  ✅ WS 연결됨 (F, 토큰 인증)");

  const received = nextMessage(ws, 5000);
  await fetch(`${BASE}/conversations/${convId}/messages`, { method: "POST", headers: authed(SESS_M), body: JSON.stringify({ body: "실시간 메시지!" }) });
  const event = await received;

  const okEvent = event?.type === "message" && event?.message?.body === "실시간 메시지!";
  console.log(`  ${okEvent ? "✅" : "❌"} REST 전송 → WS 실시간 수신: "${event?.message?.body ?? JSON.stringify(event)}"`);

  ws.close();
  await cleanup();
  console.log(okEvent ? "\n🎉 WebSocket 실시간 통과" : "\n❌ 실패");
  process.exit(okEvent ? 0 : 1);
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
