import { Hono } from "hono";
import { runWeeklyMatch, weekStartMonday } from "../matching/engine";
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
