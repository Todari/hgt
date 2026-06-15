import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { hongikLoginSchema, logoutSchema } from "@hgt-client/contract";
import { db } from "../db/client";
import { users, bannedStudents, deviceTokens } from "../db/schema";
import { authenticateHongik, HongikAuthError, type HongikProfile } from "../hongik/login";
import { createSessionToken } from "../lib/session-token";
import { ok, fail } from "../lib/response";
import { toPublicUser } from "../lib/public-user";
import { rateLimit } from "../lib/rate-limit";
import { sessionAuth } from "../middleware/session";
import { closeUser } from "../ws/registry";
import type { AppEnv } from "../types";

// 재학생 게이팅: 허용할 학적상태 (env로 조정 가능; 기본 재학/휴학, 졸업 차단).
const ALLOWED_STATUSES = (process.env.HONGIK_ALLOWED_STATUSES ?? "재학,휴학")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * App Review용 데모 계정: `DEMO_ACCOUNTS="id:pw,id2:pw2"`. A matching id+pw
 * skips the Hongik portal entirely and signs in with a fixed demo profile.
 * Disabled (empty map) when the env var is unset.
 */
const DEMO_ACCOUNTS = new Map<string, string>(
  (process.env.DEMO_ACCOUNTS ?? "")
    .split(",")
    .map((pair) => pair.trim())
    .filter((pair) => pair.includes(":"))
    .map((pair) => {
      const sep = pair.indexOf(":");
      return [pair.slice(0, sep), pair.slice(sep + 1)] as const;
    }),
);

/** Fixed demo profile — only the studentId varies (the demo id itself). */
const demoProfile = (id: string): HongikProfile => ({
  studentId: id,
  name: "데모",
  major: "데모대학과",
  gender: "남",
  age: 24,
  academicStatus: "재학",
});

export const authRoutes = new Hono<AppEnv>();

/**
 * POST /auth/hongik — verify a Hongik student via the portal, then sign in.
 *
 * Body: { id (학번), pw (포털 비밀번호) }. The password is proxied to the portal
 * for verification and never stored or logged. On success we upsert the user
 * from the *verified* portal profile and issue a session.
 */
authRoutes.post("/auth/hongik", async (c) => {
  const parsed = hongikLoginSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return fail(c, parsed.error.issues.map((i) => i.message).join(", "), 400);
  }
  const { id, pw } = parsed.data;

  // Rate limit — prevent brute-forcing Hongik portal accounts through our API.
  const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  // Per-id (5/10min) is the real brute-force guard; per-ip is high so a whole
  // campus behind one NAT'd IP isn't blocked.
  if (!rateLimit(`hongik:ip:${ip}`, 300, 600_000) || !rateLimit(`hongik:id:${id}`, 5, 600_000)) {
    return fail(c, "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
  }

  let profile: HongikProfile;
  if (DEMO_ACCOUNTS.get(id) === pw) {
    // Env-gated App Review path — no portal round-trip, fixed profile.
    profile = demoProfile(id);
  } else {
    try {
      profile = await authenticateHongik(id, pw);
    } catch (err) {
      if (err instanceof HongikAuthError) {
        return fail(c, err.message, err.code === "INVALID_CREDENTIALS" ? 401 : 502);
      }
      return fail(c, "인증 처리 중 오류가 발생했습니다.", 500);
    }
  }

  // 재학생 전용 게이팅.
  if (
    profile.academicStatus &&
    ALLOWED_STATUSES.length > 0 &&
    !ALLOWED_STATUSES.includes(profile.academicStatus)
  ) {
    return fail(
      c,
      `이용할 수 없는 학적상태입니다 (${profile.academicStatus}). 재학·휴학생만 이용할 수 있습니다.`,
      403,
    );
  }

  // 이용 정지(밴) 게이팅 — 탈퇴 후 재가입해도 학번으로 차단된다.
  const [banned] = await db
    .select({ studentId: bannedStudents.studentId })
    .from(bannedStudents)
    .where(eq(bannedStudents.studentId, profile.studentId))
    .limit(1);
  if (banned) {
    return fail(c, "이용이 제한된 계정입니다. 문의가 필요하면 운영팀에 연락해주세요.", 403);
  }

  const session = createSessionToken();
  const values = {
    name: profile.name,
    studentId: profile.studentId,
    major: profile.major,
    gender: profile.gender === "남",
    age: profile.age ?? 0,
    academicStatus: profile.academicStatus,
    session,
  };

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.studentId, profile.studentId))
    .limit(1);

  if (existing) {
    await db.update(users).set({ ...values, updatedAt: new Date() }).where(eq(users.id, existing.id));
    // Session rotated — sockets opened with the old token must not live on.
    closeUser(existing.id);
  } else {
    await db.insert(users).values(values);
  }

  const [row] = await db.select().from(users).where(eq(users.studentId, profile.studentId)).limit(1);
  const user = row ? toPublicUser(row) : null;
  return ok(c, { session, user }, existing ? 200 : 201);
});

/**
 * POST /auth/logout — revoke the current session (sets `users.session` to
 * NULL), optionally unregister one push device token, and close the user's
 * sockets. Protected: requires the session being revoked.
 */
authRoutes.post("/auth/logout", sessionAuth, async (c) => {
  const me = c.get("user");
  const parsed = logoutSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return fail(c, parsed.error.issues.map((i) => i.message).join(", "), 400);
  }

  await db.update(users).set({ session: null, updatedAt: new Date() }).where(eq(users.id, me.id));
  if (parsed.data.deviceToken) {
    await db
      .delete(deviceTokens)
      .where(and(eq(deviceTokens.token, parsed.data.deviceToken), eq(deviceTokens.userId, me.id)));
  }
  closeUser(me.id);

  return ok(c, { loggedOut: true });
});
