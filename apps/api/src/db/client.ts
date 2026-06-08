import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set (see apps/api/.env.example)");
}

// RDS requires TLS; local docker Postgres does not.
const ssl = process.env.DATABASE_SSL === "true" ? "require" : false;

const client = postgres(url, { ssl, max: 10 });

export const db = drizzle(client, { schema, casing: "snake_case" });
export { schema };
