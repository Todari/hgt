import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { api } from "./api";

/**
 * Push lifecycle, split in two:
 *
 * - `attachPushListeners()` — tap handling. Runs at app BOOT (PushBootstrap in
 *   providers.tsx) so a cold-start from a notification still deep-links.
 * - `enablePush()` — permission + token registration. Runs on explicit user
 *   opt-in, after login.
 *
 * Delivery requires Firebase config in the native projects:
 *   - Android: `android/app/google-services.json`
 *   - iOS: `ios/App/App/GoogleService-Info.plist` + an APNs key in Firebase
 * and `FIREBASE_SERVICE_ACCOUNT` set on the backend.
 */

const PUSH_TOKEN_KEY = "hgt_push_token";
const REGISTER_TIMEOUT_MS = 15_000;

/** True when running inside Capacitor with the push plugin compiled in. */
export function isNativePushAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("PushNotifications");
}

/** The last device token this app registered with the backend (null = none). */
export function getStoredPushToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PUSH_TOKEN_KEY);
}

function storePushToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PUSH_TOKEN_KEY, token);
}

let tapListenerAttached = false;
let navigateRef: ((path: string) => void) | null = null;

/**
 * Attach the notification-tap handler (idempotent — repeat calls only refresh
 * the navigate callback). Both message and match pushes carry
 * `data.conversationId`, which deep-links into the chat screen.
 */
export function attachPushListeners(navigate: (path: string) => void): void {
  navigateRef = navigate;
  if (tapListenerAttached || !isNativePushAvailable()) return;
  tapListenerAttached = true;

  void PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const data = action.notification.data as { type?: string; conversationId?: string };
    const target = data?.conversationId
      ? `/conversations/chat?c=${data.conversationId}`
      : "/home";
    navigateRef?.(target);
  });
}

let enabling: Promise<boolean> | null = null;

/**
 * Ask for permission, register with FCM/APNs and forward the device token to
 * the backend. Resolves `true` only when the token actually reached the
 * backend; on web it's always `false` (push is native-only).
 */
export function enablePush(session: string): Promise<boolean> {
  if (!isNativePushAvailable()) return Promise.resolve(false);
  if (enabling) return enabling;
  enabling = doEnablePush(session).finally(() => {
    enabling = null;
  });
  return enabling;
}

async function doEnablePush(session: string): Promise<boolean> {
  let permission = await PushNotifications.checkPermissions();
  if (permission.receive !== "granted") {
    permission = await PushNotifications.requestPermissions();
  }
  if (permission.receive !== "granted") return false;

  const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";

  return new Promise<boolean>((resolve) => {
    const handles: PluginListenerHandle[] = [];
    let settled = false;
    const settle = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      for (const handle of handles) void handle.remove();
      resolve(ok);
    };
    // A token that never arrives (no APNs entitlement, no network) must not
    // hang the opt-in UI forever.
    const timeout = setTimeout(() => settle(false), REGISTER_TIMEOUT_MS);

    void (async () => {
      // Listeners BEFORE register() — otherwise a fast token fires into the void.
      handles.push(
        await PushNotifications.addListener("registration", (token) => {
          void (async () => {
            try {
              await api.registerDevice(session, { platform, token: token.value });
              storePushToken(token.value);
              settle(true);
            } catch {
              settle(false);
            }
          })();
        }),
      );
      handles.push(
        await PushNotifications.addListener("registrationError", (err) => {
          console.error("[push] registration error", err);
          settle(false);
        }),
      );
      await PushNotifications.register();
    })().catch(() => settle(false));
  });
}

/**
 * Logout support: forget the stored device token (and unregister natively,
 * best-effort) and hand it back so the caller can pass it to `api.logout`
 * — the backend then stops pushing to this device.
 */
export async function disablePush(): Promise<string | null> {
  const token = getStoredPushToken();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(PUSH_TOKEN_KEY);
  }
  if (isNativePushAvailable()) {
    try {
      await PushNotifications.unregister();
    } catch {
      /* best-effort — the server-side token removal is what matters */
    }
  }
  return token;
}
