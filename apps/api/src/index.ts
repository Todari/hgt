import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";
import { propertyRoutes } from "./routes/properties";
import { keywordRoutes } from "./routes/keywords";
import { meRoutes } from "./routes/me";
import { matchRoutes } from "./routes/match";
import { adminRoutes } from "./routes/admin";
import { sessionAuth } from "./middleware/session";
import { startMatchScheduler } from "./matching/scheduler";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (process.env.CORS_ORIGINS ?? "http://localhost:3000").split(","),
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Health check.
app.get("/", (c) => c.text("Hello, World!"));

// Public routes.
app.route("/", authRoutes);

// Admin routes (token-gated via X-Admin-Token; not session-based).
app.route("/", adminRoutes);

// Protected routes (require a valid bearer session).
const protectedRoutes = new Hono();
protectedRoutes.use("*", sessionAuth);
protectedRoutes.route("/", userRoutes);
protectedRoutes.route("/", propertyRoutes);
protectedRoutes.route("/", keywordRoutes);
protectedRoutes.route("/", meRoutes);
protectedRoutes.route("/", matchRoutes);
app.route("/", protectedRoutes);

const port = Number(process.env.PORT ?? 8080);
serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`hgt api listening on http://localhost:${info.port}`);
});

// Opt-in weekly matching (no-op unless MATCH_CRON_ENABLED=true).
startMatchScheduler();

export type AppType = typeof app;
