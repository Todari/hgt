import { Hono } from "hono";
import { db } from "../db/client";
import { keywords } from "../db/schema";
import { ok } from "../lib/response";
import type { AppEnv } from "../types";

export const keywordRoutes = new Hono<AppEnv>();

// GET /keyword — the full curated keyword catalog (for the profile picker).
keywordRoutes.get("/keyword", async (c) => {
  const rows = await db.select().from(keywords);
  return ok(
    c,
    rows.map((k) => ({ id: k.id, value: k.value, category: k.category })),
  );
});
