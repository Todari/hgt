import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { runWeeklyMatch, weekStartMonday } from "../matching/engine";
import { db } from "../db/client";
import { reports, users } from "../db/schema";
import { adminAuth } from "../middleware/admin";
import { ok } from "../lib/response";

export const adminRoutes = new Hono();

adminRoutes.use("/admin/*", adminAuth);

// POST /admin/match/run — run the weekly match (the weekly cron also calls this).
// Body: { weekStart?: "YYYY-MM-DD" } (defaults to this week's Monday).
adminRoutes.post("/admin/match/run", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { weekStart?: string };
  const weekStart = typeof body?.weekStart === "string" ? body.weekStart : weekStartMonday();
  return ok(c, await runWeeklyMatch(weekStart));
});

// GET /admin/reports — review user reports (newest first).
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
    })
    .from(reports)
    .innerJoin(reporter, eq(reports.reporterId, reporter.id))
    .innerJoin(reported, eq(reports.reportedId, reported.id))
    .orderBy(desc(reports.createdAt));
  return ok(
    c,
    rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  );
});
