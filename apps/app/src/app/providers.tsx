"use client";

import { MotionConfig } from "framer-motion";
import { PushBootstrap } from "@/components/push/PushBootstrap";
import { NativeBridge } from "@/components/native/NativeBridge";

/**
 * App-wide client providers. `reducedMotion="user"` makes every framer-motion
 * animation honour the OS "reduce motion" setting — the ambient blob drift and
 * entrance transitions stop for motion-sensitive / battery-saver users.
 * PushBootstrap attaches the notification-tap deep-link handler at boot.
 * NativeBridge wires the Capacitor shell (status bar, Android back button);
 * it is a no-op on the web.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <PushBootstrap />
      <NativeBridge />
      {children}
    </MotionConfig>
  );
}
