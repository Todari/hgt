"use client";

import { useEffect, useState } from "react";
import { css } from "_panda/css";
import { GlassBadge, GlassButton, GlassPanel } from "@/components/ui/glass";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!window.navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <GlassPanel tone="quiet" className={css({ padding: "4" })}>
      <p
        className={css({
          position: "relative",
          zIndex: 1,
          color: "ink.900",
          fontSize: "sm",
          fontWeight: "bold",
          lineHeight: "1.7",
        })}
      >
        네트워크 연결이 불안정합니다. 저장, 메시지 전송, 신고 처리가 지연될 수 있습니다.
      </p>
    </GlassPanel>
  );
}

export function SafetyGuideBanner() {
  return (
    <GlassPanel
      tone="quiet"
      className={css({
        display: "grid",
        gridTemplateColumns: { base: "1fr", md: "1fr auto" },
        gap: "4",
        alignItems: "center",
        padding: "4",
      })}
    >
      <div className={css({ position: "relative", zIndex: 1 })}>
        <GlassBadge>Safety Guide</GlassBadge>
        <p className={css({ marginTop: "3", color: "ink.900", fontWeight: "bold", lineHeight: "1.7" })}>
          첫 만남은 공개된 장소에서, 개인정보 공유는 천천히 진행해주세요. 불편한 상황은
          차단과 신고로 바로 멈출 수 있습니다.
        </p>
      </div>
      <GlassButton href="/safety" variant="secondary">
        안전 가이드
      </GlassButton>
    </GlassPanel>
  );
}
