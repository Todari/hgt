import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { createPropertySchema, propertyTypeSchema } from "@hgt-client/contract";
import { db } from "../db/client";
import { properties } from "../db/schema";
import { ok, fail } from "../lib/response";
import { adminAuth } from "../middleware/admin";

export const propertyRoutes = new Hono();

// POST /property — create a selectable option value. Admin-only: the option
// catalog is operator-curated, regular users only read it.
propertyRoutes.post("/property", adminAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createPropertySchema.safeParse(body);
  if (!parsed.success) {
    return fail(c, parsed.error.issues.map((i) => i.message).join(", "), 400);
  }
  const [created] = await db.insert(properties).values(parsed.data).returning();
  return ok(c, created, 201);
});

// GET /property — list all option values.
propertyRoutes.get("/property", async (c) => {
  const rows = await db.select().from(properties);
  return ok(c, rows);
});

// GET /property/:type?value= — look up one option value by type + value.
propertyRoutes.get("/property/:type", async (c) => {
  const type = propertyTypeSchema.safeParse(c.req.param("type"));
  const value = c.req.query("value");
  if (!type.success) {
    return fail(c, "Unknown property type", 400);
  }
  if (!value) {
    return fail(c, "Query param 'value' is required", 400);
  }
  const [row] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.type, type.data), eq(properties.value, value)))
    .limit(1);
  if (!row) {
    return fail(c, "Property not found", 404);
  }
  return ok(c, row);
});
