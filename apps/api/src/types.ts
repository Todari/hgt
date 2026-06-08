import type { users } from "./db/schema";

/** A full user row as stored in the DB (includes the private session token). */
export type DbUser = typeof users.$inferSelect;

/** Hono environment: the session middleware attaches the authed user. */
export type AppEnv = {
  Variables: {
    user: DbUser;
  };
};
