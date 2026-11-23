"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { attachPushListeners, enablePush, getStoredPushToken } from "@/lib/push";
import { getSession } from "@/lib/session";

/**
 * Mounted once in providers.tsx so the notification-tap handler exists from
 * app boot — a push tapped while the app was cold still deep-links into the
 * right conversation. Renders nothing.
 */
export function PushBootstrap() {
  const router = useRouter();

  useEffect(() => {
    attachPushListeners((path) => router.push(path));

    // FCM registration tokens can rotate. Refresh devices that have already
    // opted in, without prompting users who never enabled notifications.
    const session = getSession();
    if (session && getStoredPushToken()) {
      void enablePush(session);
    }
  }, [router]);

  return null;
}
