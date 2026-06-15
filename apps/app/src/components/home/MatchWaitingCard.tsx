"use client";

import { useEffect, useState } from "react";
import { css } from "_panda/css";

/* KST (Asia/Seoul) is UTC+9, no DST — mirrors apps/app/src/lib/format.ts. */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const REVEAL_HOUR_KST = 19; // matches MATCH_CRON fire time (Monday 19:00 KST)

/**
 * The UTC instant of the next match reveal — the upcoming Monday 19:00 KST.
 * If it is already past this week's reveal time, rolls to next Monday.
 */
function nextRevealTime(now: Date): Date {
  const kst = new Date(now.getTime() + KST_OFFSET_MS); // read UTC fields as KST
  const day = kst.getUTCDay(); // 0=Sun .. 6=Sat
  const daysUntilMonday = day === 1 ? 0 : (8 - day) % 7;
  const reveal = new Date(
    Date.UTC(
      kst.getUTCFullYear(),
      kst.getUTCMonth(),
      kst.getUTCDate() + daysUntilMonday,
      REVEAL_HOUR_KST,
    ),
  );
  // Already past today's reveal moment → jump a week.
  if (reveal.getTime() <= kst.getTime()) {
    reveal.setUTCDate(reveal.getUTCDate() + 7);
  }
  return new Date(reveal.getTime() - KST_OFFSET_MS); // back to a real UTC instant
}

type Remaining = { days: number; hours: number; minutes: number; total: number };

function remainingUntil(target: Date, now: Date): Remaining {
  const total = Math.max(0, target.getTime() - now.getTime());
  const minutes = Math.floor(total / 60_000);
  return {
    days: Math.floor(minutes / (60 * 24)),
    hours: Math.floor((minutes % (60 * 24)) / 60),
    minutes: minutes % 60,
    total,
  };
}

function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <div
      className={css({
        flex: "1",
        borderRadius: "18px",
        paddingY: "3",
        background: "primary.50",
        border: "1px solid",
        borderColor: "primary.100",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5",
      })}
    >
      <span className={css({ color: "primary.700", fontSize: "2xl", fontWeight: "black", lineHeight: "1" })}>
        {String(value).padStart(2, "0")}
      </span>
      <span className={css({ color: "ink.500", fontSize: "11px", fontWeight: "bold" })}>{label}</span>
    </div>
  );
}

/**
 * Shown when there is no match for this KST week (current=null). Two moods:
 * - default (pre-reveal): "곧 한 사람을 소개해드릴게요" + countdown to Monday 19:00 KST.
 * - noMatchThisWeek (the round ran but didn't pair you): acknowledge it warmly,
 *   then still count down to the next reveal.
 * Reduced-motion safe — no animation, just a ticking value.
 */
export function MatchWaitingCard({ noMatchThisWeek = false }: { noMatchThisWeek?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date()); // client-only: avoids SSR/hydration time mismatch
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const remaining = now ? remainingUntil(nextRevealTime(now), now) : null;

  return (
    <section
      aria-label={noMatchThisWeek ? "이번 주 매칭 결과" : "이번 주 인연을 찾는 중"}
      className={css({
        position: "relative",
        overflow: "hidden",
        borderRadius: "vessel",
        padding: "5",
        background: "surface.card",
        border: "1px solid",
        borderColor: "primary.200",
        boxShadow: "0 8px 28px rgba(255,107,95,.16)",
        display: "flex",
        flexDirection: "column",
        gap: "4",
      })}
    >
      <div
        aria-hidden
        className={css({
          position: "absolute",
          top: "-26%",
          right: "-18%",
          width: "72%",
          height: "52%",
          background:
            "radial-gradient(ellipse 60% 55% at 60% 40%, rgba(255,107,95,.13), transparent 72%)",
          pointerEvents: "none",
        })}
      />
      <div className={css({ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "4" })}>
        <span
          className={css({
            display: "inline-flex",
            alignItems: "center",
            width: "fit-content",
            minHeight: "28px",
            borderRadius: "capsule",
            paddingX: "3",
            background: "primary.100",
            color: "primary.900",
            fontSize: "xs",
            fontWeight: "black",
          })}
        >
          {noMatchThisWeek ? "이번 주 매칭 결과" : "이번 주 인연을 찾는 중"}
        </span>
        <div className={css({ display: "flex", flexDirection: "column", gap: "1" })}>
          <h2 className={css({ color: "ink.950", fontSize: "22px", fontWeight: "black", lineHeight: "1.3" })}>
            {noMatchThisWeek ? "이번 주는 인연을 찾지 못했어요" : "곧 한 사람을 소개해드릴게요"}
          </h2>
          <p className={css({ color: "ink.500", fontSize: "sm", lineHeight: "1.7" })}>
            {noMatchThisWeek
              ? "아쉽지만 이번 주엔 맞는 분을 찾지 못했어요. 키워드를 다듬으면 다음 주 인연을 만날 확률이 높아져요."
              : "매주 월요일 저녁 7시, 키워드가 맞는 단 한 사람을 골라 보내드려요."}
          </p>
        </div>

        <div
          className={css({ display: "flex", flexDirection: "column", gap: "2" })}
          aria-live="polite"
        >
          <p className={css({ color: "ink.700", fontSize: "xs", fontWeight: "bold" })}>다음 소개까지</p>
          <div className={css({ display: "flex", gap: "2" })}>
            {remaining ? (
              <>
                <CountUnit value={remaining.days} label="일" />
                <CountUnit value={remaining.hours} label="시간" />
                <CountUnit value={remaining.minutes} label="분" />
              </>
            ) : (
              // SSR / first paint placeholder — same shape, no flash of wrong time
              <>
                <CountUnit value={0} label="일" />
                <CountUnit value={0} label="시간" />
                <CountUnit value={0} label="분" />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
