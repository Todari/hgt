import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { sql } from "drizzle-orm";
import { db } from "./db/client";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";
import { propertyRoutes } from "./routes/properties";
import { keywordRoutes } from "./routes/keywords";
import { meRoutes } from "./routes/me";
import { matchRoutes } from "./routes/match";
import { chatRoutes } from "./routes/chat";
import { deviceRoutes } from "./routes/devices";
import { safetyRoutes } from "./routes/safety";
import { adminRoutes } from "./routes/admin";
import { sessionAuth } from "./middleware/session";
import { startMatchScheduler } from "./matching/scheduler";
import { setupWebSocket } from "./ws/socket";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [
      ...(process.env.CORS_ORIGINS ?? "http://localhost:3000").split(","),
      // Capacitor native webview origins (iOS / Android)
      "capacitor://localhost",
      "http://localhost",
      "https://localhost",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Health check.
app.get("/", (c) => c.text("Hello, World!"));
app.get("/health", async (c) => {
  try {
    await db.execute(sql`select 1`);
    return c.json({ ok: true });
  } catch {
    return c.json({ ok: false }, 503);
  }
});

// Public routes.
app.route("/", authRoutes);

// Admin routes (token-gated via X-Admin-Token; not session-based).
app.route("/", adminRoutes);

// Realtime WebSocket (/ws?token=...) — token-authed; registered BEFORE the
// protected wildcard so session auth doesn't reject the upgrade.
const injectWebSocket = setupWebSocket(app);

// Protected routes (require a valid bearer session).
const protectedRoutes = new Hono();
protectedRoutes.use("*", sessionAuth);
protectedRoutes.route("/", userRoutes);
protectedRoutes.route("/", propertyRoutes);
protectedRoutes.route("/", keywordRoutes);
protectedRoutes.route("/", meRoutes);
protectedRoutes.route("/", matchRoutes);
protectedRoutes.route("/", chatRoutes);
protectedRoutes.route("/", deviceRoutes);
protectedRoutes.route("/", safetyRoutes);
app.route("/", protectedRoutes);

const port = Number(process.env.PORT ?? 8080);
const server = serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`hgt api listening on http://localhost:${info.port}`);
});
injectWebSocket(server);

// Opt-in weekly matching (no-op unless MATCH_CRON_ENABLED=true).
startMatchScheduler();

export type AppType = typeof app;
