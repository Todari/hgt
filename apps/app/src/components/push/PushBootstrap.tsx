"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { attachPushListeners } from "@/lib/push";

/**
 * Mounted once in providers.tsx so the notification-tap handler exists from
 * app boot — a push tapped while the app was cold still deep-links into the
 * right conversation. Renders nothing.
 */
export function PushBootstrap() {
  const router = useRouter();

  useEffect(() => {
    attachPushListeners((path) => router.push(path));
  }, [router]);

  return null;
}
