"use client";

import { useEffect } from "react";
import { css } from "_panda/css";
import { GlassButton, GlassPanel } from "@/components/ui/glass";

/** Route-segment error boundary — shown when a page throws during render. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] route error", error);
  }, [error]);

  return (
    <main
      className={css({
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "5",
      })}
    >
      <GlassPanel
        className={css({
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4",
          padding: "8",
          textAlign: "center",
        })}
      >
        <h1 className={css({ color: "ink.950", fontSize: "xl", fontWeight: "black" })}>
          문제가 발생했어요
        </h1>
        <p className={css({ color: "ink.500", fontSize: "sm", lineHeight: "1.7" })}>
          일시적인 오류일 수 있어요. 잠시 후 다시 시도해주세요.
        </p>
        <GlassButton type="button" onClick={reset} className={css({ width: "100%" })}>
          다시 시도
        </GlassButton>
      </GlassPanel>
    </main>
  );
}
