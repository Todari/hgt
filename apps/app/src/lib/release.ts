import { Capacitor } from "@capacitor/core";

export type WebAppMode = "waitlist" | "open";

/**
 * The public website stays in verified pre-registration mode until launch.
 * Capacitor builds always bypass this gate and expose the full app.
 */
export function getWebAppMode(): WebAppMode {
  return process.env.NEXT_PUBLIC_WEB_APP_MODE === "open" ? "open" : "waitlist";
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function isWebWaitlistMode(): boolean {
  return !isNativeApp() && getWebAppMode() === "waitlist";
}

export function getPostAuthRoute(termsAgreedAt: string | null | undefined): string {
  if (isWebWaitlistMode()) return "/waitlist";
  return termsAgreedAt ? "/home" : "/onboarding";
}
