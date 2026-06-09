import { eq, inArray } from "drizzle-orm";
import type { Messaging } from "firebase-admin/messaging";
import { db } from "../db/client";
import { deviceTokens } from "../db/schema";

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

// Lazily initialized; `null` = not configured (push becomes a logged no-op).
let cached: Messaging | null | undefined;

async function messaging(): Promise<Messaging | null> {
  if (cached !== undefined) return cached;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return (cached = null);
  try {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getMessaging } = await import("firebase-admin/messaging");
    const app = getApps()[0] ?? initializeApp({ credential: cert(JSON.parse(raw)) });
    return (cached = getMessaging(app));
  } catch (e) {
    console.error("[push] firebase init failed:", e);
    return (cached = null);
  }
}

/** Send a push to all of a user's devices. No-op (logged) until FCM is configured. */
export async function sendPush(userId: string, payload: PushPayload): Promise<void> {
  const rows = await db
    .select({ token: deviceTokens.token })
    .from(deviceTokens)
    .where(eq(deviceTokens.userId, userId));
  const tokens = rows.map((r) => r.token);

  const fcm = await messaging();
  if (!fcm) {
    console.log(`[push] (FCM off) user=${userId} "${payload.title}: ${payload.body}" (${tokens.length} devices)`);
    return;
  }
  if (tokens.length === 0) return;

  try {
    const res = await fcm.sendEachForMulticast({
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
    });
    // Prune tokens FCM reports as dead (uninstalled / expired).
    const dead = res.responses
      .map((r, i) => (!r.success && /not-registered|invalid-(registration-token|argument)/.test(r.error?.code ?? "") ? tokens[i]! : null))
      .filter((t): t is string => t !== null);
    if (dead.length > 0) {
      await db.delete(deviceTokens).where(inArray(deviceTokens.token, dead));
    }
  } catch (e) {
    console.error("[push] send failed:", e);
  }
}
