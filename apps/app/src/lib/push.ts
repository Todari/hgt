import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { api } from "./api";

/**
 * Register this device for push notifications (native only) and forward the
 * token to the backend. Call after login with the session.
 *
 * Delivery requires Firebase config in the native projects:
 *   - Android: `android/app/google-services.json`
 *   - iOS: `ios/App/App/GoogleService-Info.plist` + an APNs key in Firebase
 * and `FIREBASE_SERVICE_ACCOUNT` set on the backend.
 */
export async function initPush(session: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") return;

  await PushNotifications.register();

  await PushNotifications.addListener("registration", async (token) => {
    const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
    try {
      await api.registerDevice(session, { platform, token: token.value });
    } catch {
      /* a failed registration just means no push until next launch */
    }
  });

  await PushNotifications.addListener("registrationError", (err) => {
    console.error("[push] registration error", err);
  });

  // Deep-link: tapping a push opens the relevant screen.
  await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const data = action.notification.data as { type?: string; conversationId?: string };
    if (typeof window === "undefined") return;
    if (data?.type === "message" && data.conversationId) {
      window.location.href = `/conversations/${data.conversationId}`;
    } else if (data?.type === "match") {
      window.location.href = "/home";
    }
  });
}
