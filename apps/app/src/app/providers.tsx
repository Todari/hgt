"use client";

import { MotionConfig } from "framer-motion";

/**
 * App-wide client providers. `reducedMotion="user"` makes every framer-motion
 * animation honour the OS "reduce motion" setting — the ambient blob drift and
 * entrance transitions stop for motion-sensitive / battery-saver users.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
