import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { runWeeklyMatch, weekStartMonday } from "../matching/engine";
import { db } from "../db/client";
import { bannedStudents, reports, users } from "../db/schema";
import { adminAuth } from "../middleware/admin";
import { ok, fail } from "../lib/response";
import { closeUser } from "../ws/registry";

export const adminRoutes = new Hono();

adminRoutes.use("/admin/*", adminAuth);

// POST /admin/match/run — run the weekly match (the weekly cron also calls this).
// Body: { weekStart?: "YYYY-MM-DD" } (defaults to this week's Monday).
adminRoutes.post("/admin/match/run", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { weekStart?: string };
  const weekStart = typeof body?.weekStart === "string" ? body.weekStart : weekStartMonday();
  return ok(c, await runWeeklyMatch(weekStart));
});

// GET /admin/reports — review user reports (newest first). Left joins +
// snapshot columns: reports remain reviewable after either account is deleted.
adminRoutes.get("/admin/reports", async (c) => {
  const reporter = alias(users, "reporter");
  const reported = alias(users, "reported");
  const rows = await db
    .select({
      id: reports.id,
      reason: reports.reason,
      createdAt: reports.createdAt,
      reportedId: reports.reportedId,
      reporterName: reporter.name,
      reporterStudentId: reporter.studentId,
      reportedName: reported.name,
      reportedStudentId: reported.studentId,
      snapshotName: reports.reportedName,
      snapshotStudentId: reports.reportedStudentId,
    })
    .from(reports)
    .leftJoin(reporter, eq(reports.reporterId, reporter.id))
    .leftJoin(reported, eq(reports.reportedId, reported.id))
    .orderBy(desc(reports.createdAt));
  return ok(
    c,
    rows.map(({ snapshotName, snapshotStudentId, ...r }) => ({
      ...r,
      reportedName: r.reportedName ?? snapshotName,
      reportedStudentId: r.reportedStudentId ?? snapshotStudentId,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

const banUserSchema = z.object({ reason: z.string().min(1).max(1000) });

// POST /admin/users/:id/ban — ban by student id (survives account deletion),
// revoke the session and close live sockets.
adminRoutes.post("/admin/users/:id/ban", async (c) => {
  const parsed = banUserSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return fail(c, parsed.error.issues.map((i) => i.message).join(", "), 400);
  }

  const userId = c.req.param("id");
  // Non-uuid ids would make Postgres throw — treat them as "not found".
  if (!z.string().uuid().safeParse(userId).success) {
    return fail(c, "존재하지 않는 사용자입니다.", 404);
  }
  const [user] = await db
    .select({ id: users.id, studentId: users.studentId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return fail(c, "존재하지 않는 사용자입니다.", 404);

  await db
    .insert(bannedStudents)
    .values({ studentId: user.studentId, reason: parsed.data.reason })
    .onConflictDoUpdate({
      target: bannedStudents.studentId,
      set: { reason: parsed.data.reason },
    });
  await db.update(users).set({ session: null, updatedAt: new Date() }).where(eq(users.id, user.id));
  closeUser(user.id);

  return ok(c, { banned: true, studentId: user.studentId }, 201);
});
