import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users } from "../db/schema";
import { ok, fail } from "../lib/response";
import type { AppEnv, DbUser } from "../types";

export const userRoutes = new Hono<AppEnv>();

/** Strip the private session token before sending a user to the client. */
const toPublicUser = ({ session: _session, ...rest }: DbUser) => rest;

// GET /user — list all users.
userRoutes.get("/user", async (c) => {
  const rows = await db.select().from(users);
  return ok(c, rows.map(toPublicUser));
});

// GET /user/:userId — fetch a single user by id.
userRoutes.get("/user/:userId", async (c) => {
  const userId = c.req.param("userId");
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!row) {
    return fail(c, "User not found", 404);
  }
  return ok(c, toPublicUser(row));
});
