"use client";

import { useState } from "react";
import { css } from "_panda/css";
import { GlassButton } from "@/components/ui/glass";
import { enablePush } from "@/lib/push";

/**
 * Push opt-in, shown only inside the native app (the caller gates on
 * `isNativePushAvailable()` so this never renders on web). A quiet inline card
 * — not a blocking banner — that asks for notification permission once.
 */
export function HomePushPanel({ session }: { session: string }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  async function onEnable() {
    setBusy(true);
    setNotice(null);
    try {
      const enabled = await enablePush(session);
      if (enabled) {
        setNotice("알림을 켰어요. 새 인연과 메시지를 바로 알려드릴게요.");
        setTimeout(() => setDismissed(true), 1800);
      } else {
        setNotice("알림을 켜지 못했어요. 기기 설정에서 알림 권한을 확인해주세요.");
      }
    } catch {
      setNotice("알림 권한을 설정하지 못했어요. 기기 설정을 확인해주세요.");
    } finally {
      setBusy(false);
    }
  }

  if (dismissed) return null;

  return (
    <section
      className={css({
        borderRadius: "liquid",
        padding: "4",
        background: "surface.card",
        border: "1px solid",
        borderColor: "surface.hairline",
        boxShadow: "cardSoft",
        display: "flex",
        flexDirection: "column",
        gap: "3",
      })}
    >
      <div className={css({ display: "flex", flexDirection: "column", gap: "1" })}>
        <p className={css({ color: "ink.950", fontSize: "sm", fontWeight: "black" })}>
          새 인연 알림 받기
        </p>
        <p className={css({ color: "ink.500", fontSize: "xs", lineHeight: "1.6" })}>
          매주 월요일, 소개가 도착하면 알림으로 알려드려요.
        </p>
      </div>
      {notice ? (
        <p className={css({ color: "ink.700", fontSize: "xs", fontWeight: "bold", lineHeight: "1.6" })}>
          {notice}
        </p>
      ) : (
        <GlassButton
          type="button"
          onClick={onEnable}
          disabled={busy}
          className={css({ width: "100%", minHeight: "48px" })}
        >
          {busy ? "확인 중..." : "알림 켜기"}
        </GlassButton>
      )}
    </section>
  );
}
