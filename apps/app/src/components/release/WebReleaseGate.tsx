"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isWebWaitlistMode } from "@/lib/release";
import { getSession } from "@/lib/session";

const WAITLIST_WEB_ROUTES = new Set([
  "/",
  "/signin",
  "/waitlist",
  "/safety",
  "/terms",
  "/privacy",
]);

/**
 * Prevent a verified web user from bypassing the pre-launch waitlist with a
 * direct app URL. Native Capacitor shells always retain the complete product.
 */
export function WebReleaseGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const shouldBlock = Boolean(
      isWebWaitlistMode() &&
      getSession() &&
      !WAITLIST_WEB_ROUTES.has(pathname),
    );

    if (shouldBlock) {
      setBlocked(true);
      window.location.replace("/waitlist");
    } else {
      setBlocked(false);
    }
  }, [pathname]);

  return blocked ? null : children;
}
