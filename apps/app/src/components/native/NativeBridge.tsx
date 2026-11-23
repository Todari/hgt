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
 *  - Status bar: native styling plus Android's non-overlay mode. iOS does not
 *    implement `setOverlaysWebView`; its safe area is handled by the web
 *    layout's `env(safe-area-inset-top)` padding.
 */
export function NativeBridge() {
  const router = useRouter();
  const pathname = usePathname();

  // iOS uses a real UITabBarController owned by the Capacitor shell. Mark the
  // document so the web fallback is removed, and bridge native tab selections
  // back into the existing Next.js history.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
      return;
    }

    const root = document.documentElement;
    root.classList.add("hgt-native-ios");

    const handleNativeTab = (event: Event) => {
      const path = (event as CustomEvent<{ path?: string }>).detail?.path;
      if (path === "/home" || path === "/conversations" || path === "/settings") {
        router.push(path);
      }
    };

    window.addEventListener("hgt:native-tab", handleNativeTab);
    return () => {
      root.classList.remove("hgt-native-ios");
      window.removeEventListener("hgt:native-tab", handleNativeTab);
    };
  }, [router]);

  // Status bar style — run once. `setOverlaysWebView` is Android-only in
  // @capacitor/status-bar, so do not emit an UNIMPLEMENTED native error on iOS.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void StatusBar.setStyle({ style: Style.Light });
    if (Capacitor.getPlatform() === "android") {
      void StatusBar.setOverlaysWebView({ overlay: false });
    }
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
