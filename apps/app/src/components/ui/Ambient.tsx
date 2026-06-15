"use client";

import { css, cx } from "_panda/css";

/**
 * THE shared ambient background — mount exactly one per page, as the first
 * child of the page root, and delete any per-page animated blur layers.
 *
 * GPU budget (see apps/app/CLAUDE.md):
 * - static gradient wash by default; blur is fixed at 13px (≤14px cap) and
 *   never animated, so the layer rasterizes once.
 * - on `pointer: fine` (desktop) a single transform-only drift is allowed —
 *   the `.hgt-ambient-drift` animation lives in globals.css and is disabled
 *   on touch devices and under `prefers-reduced-motion`.
 */
export function Ambient({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx(
        css({
          position: "fixed",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }),
        className,
      )}
    >
      <div
        className={cx(
          "hgt-ambient-drift",
          css({
            position: "absolute",
            top: "-12%",
            right: "-22%",
            width: "120%",
            height: "56%",
            background:
              "linear-gradient(108deg, transparent, rgba(255,107,95,.14) 34%, rgba(255,107,95,.07) 62%, transparent)",
            filter: "blur(13px)",
            transform: "rotate(9deg) translateZ(0)",
          }),
        )}
      />
      <div
        className={css({
          position: "absolute",
          bottom: "-18%",
          left: "-24%",
          width: "110%",
          height: "44%",
          background:
            "radial-gradient(ellipse 70% 60% at 38% 62%, rgba(255,107,95,.1), transparent 70%)",
          transform: "translateZ(0)",
        })}
      />
    </div>
  );
}
