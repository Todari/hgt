"use client";

import { css, cx } from "_panda/css";

/** Shared, static brand wash. Quiet enough to sit behind readable app content. */
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
        className={css({
          position: "absolute",
          top: "5%",
          right: "-44px",
          width: "104px",
          height: "104px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,79,63,.16), transparent 68%)",
          opacity: 0.52,
        })}
      />
      <div
        className={css({
          position: "absolute",
          bottom: "7%",
          left: "-38px",
          width: "82px",
          height: "82px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,216,77,.14), transparent 70%)",
          opacity: 0.5,
        })}
      />
    </div>
  );
}
