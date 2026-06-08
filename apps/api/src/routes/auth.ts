import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { hongikLoginSchema } from "@hgt-client/contract";
import { db } from "../db/client";
import { users } from "../db/schema";
import { authenticateHongik, HongikAuthError, type HongikProfile } from "../hongik/login";
import { createSessionToken } from "../lib/session-token";
import { ok, fail } from "../lib/response";

// 재학생 게이팅: 허용할 학적상태 (env로 조정 가능; 기본 재학/휴학, 졸업 차단).
const ALLOWED_STATUSES = (process.env.HONGIK_ALLOWED_STATUSES ?? "재학,휴학")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const authRoutes = new Hono();

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

  let profile: HongikProfile;
  try {
    profile = await authenticateHongik(id, pw);
  } catch (err) {
    if (err instanceof HongikAuthError) {
      return fail(c, err.message, err.code === "INVALID_CREDENTIALS" ? 401 : 502);
    }
    return fail(c, "인증 처리 중 오류가 발생했습니다.", 500);
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
  } else {
    await db.insert(users).values(values);
  }

  const [row] = await db.select().from(users).where(eq(users.studentId, profile.studentId)).limit(1);
  const user = row ? (({ session: _session, ...rest }) => rest)(row) : null;
  return ok(c, { session, user }, existing ? 200 : 201);
});
