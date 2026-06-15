import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { bodyLimit } from "hono/body-limit";
import { HTTPException } from "hono/http-exception";
import { sql } from "drizzle-orm";
import { db } from "./db/client";
import { authRoutes } from "./routes/auth";
import { propertyRoutes } from "./routes/properties";
import { keywordRoutes } from "./routes/keywords";
import { meRoutes } from "./routes/me";
import { matchRoutes } from "./routes/match";
import { chatRoutes } from "./routes/chat";
import { deviceRoutes } from "./routes/devices";
import { safetyRoutes } from "./routes/safety";
import { adminRoutes } from "./routes/admin";
import { sessionAuth } from "./middleware/session";
import { fail } from "./lib/response";
import { initObservability, captureError } from "./lib/observability";
import { startMatchScheduler } from "./matching/scheduler";
import { setupWebSocket } from "./ws/socket";

// Error tracking (no-op unless SENTRY_DSN is set) — init before anything throws.
initObservability();

const app = new Hono();

// Request log — never log WS session tokens (`/ws?token=...`).
const maskWsToken = (line: string) =>
  line.replace(/(\/ws\?[^\s]*?token=)[^&\s]+/g, "$1[redacted]");
app.use("*", logger((line, ...rest) => console.log(maskWsToken(line), ...rest)));
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
// No endpoint accepts more than a short text body — cap requests at 64 KiB.
app.use(
  "*",
  bodyLimit({
    maxSize: 64 * 1024,
    onError: (c) => fail(c, "요청 본문이 너무 큽니다.", 413),
  }),
);

// Last-resort error handler: keep the `{ success, data }` envelope, log the
// real error server-side only.
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return fail(c, err.message || "요청을 처리할 수 없습니다.", err.status);
  }
  console.error("unhandled error:", err);
  captureError(err, { path: c.req.path, method: c.req.method });
  return fail(c, "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", 500);
});

// Unknown routes also use the envelope.
app.notFound((c) => fail(c, "요청한 리소스를 찾을 수 없습니다.", 404));

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
  console.log(`hgt api listening on http://localhost:${info.port}`);
});
injectWebSocket(server);

// Opt-in weekly matching (no-op unless MATCH_CRON_ENABLED=true).
startMatchScheduler();

export type AppType = typeof app;
