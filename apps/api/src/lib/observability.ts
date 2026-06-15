/**
 * Optional error tracking. Entirely a no-op unless `SENTRY_DSN` is set, so local
 * dev and unconfigured deploys are unaffected. Wire-up: `initObservability()` at
 * boot, `captureError()` from the global error handler / background jobs.
 */
import * as Sentry from "@sentry/node";

let enabled = false;

export function initObservability() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return; // no DSN → tracking disabled (default)
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "production",
    // Conservative default; tune once real traffic is understood.
    tracesSampleRate: 0,
  });
  enabled = true;
  // Background-job / stray rejections that never reach app.onError.
  process.on("unhandledRejection", (reason) => captureError(reason));
  process.on("uncaughtException", (err) => captureError(err));
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  if (!enabled) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}
