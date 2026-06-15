"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";

/**
 * Native shell wiring for the Capacitor build. Mounted once in providers.tsx;
 * a no-op on the web (every effect bails when not running natively), so it is
 * safe to ship in the same bundle.
 *
 * Responsibilities:
 *  - Android hardware back button: pop the in-app history when possible,
 *    otherwise minimise the app (Android convention) instead of leaving a
 *    dead button or killing the process.
 *  - Status bar: light (white) content over the coral chrome, non-overlay so
 *    the web layout's safe-area padding (env(safe-area-inset-top)) is the only
 *    thing reserving the notch — we don't want the WebView drawn under the bar.
 */
export function NativeBridge() {
  const router = useRouter();
  const pathname = usePathname();

  // Status bar style — run once. Light icons read against coral; overlay off so
  // the bar occupies its own space and the CSS safe-area padding handles insets.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void StatusBar.setStyle({ style: Style.Light });
    void StatusBar.setOverlaysWebView({ overlay: false });
  }, []);

  // Android hardware back button. `canGoBack` is the OS view-stack flag, but in
  // a single-page export that is unreliable across route changes, so we also
  // treat the known top-level destinations as "exit points": from there, back
  // minimises the app; anywhere deeper, we navigate back in the SPA history.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
      return;
    }

    let handle: { remove: () => void } | undefined;
    const rootRoutes = new Set(["/home", "/signin", "/"]);

    void CapApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack && !rootRoutes.has(pathname)) {
        router.back();
      } else {
        void CapApp.minimizeApp();
      }
    }).then((h) => {
      handle = h;
    });

    return () => {
      handle?.remove();
    };
  }, [router, pathname]);

  return null;
}
