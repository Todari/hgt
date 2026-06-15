"use client";

import { css } from "_panda/css";
import { josa } from "@/components/chat/lib";

/* Darkest-coral gradient that keeps white text ≥4.5:1 (see ui/glass.tsx). */
const CORAL_TEXT_GRADIENT = "linear-gradient(135deg, #b83e3a, #d0463c)";

/**
 * Build 2-3 one-tap starter lines from the shared keywords. Each line is a
 * warm, complete sentence the user can send as-is or edit.
 */
export function buildStarterLines(partnerName: string, sharedKeywords: string[]): string[] {
  const lines: string[] = [];
  const [first, second] = sharedKeywords;

  if (first) {
    lines.push(`두 분 다 '${first}'${josa(first, "을", "를")} 좋아하시네요! 어떻게 시작하게 되셨어요?`);
  }
  if (second) {
    lines.push(`'${second}' 키워드 보고 반가웠어요. 평소엔 어떻게 즐기시는 편이에요?`);
  }
  lines.push(`${partnerName}님, 반가워요! 프로필 보고 먼저 인사 드려요 :)`);

  return lines.slice(0, 3);
}

/**
 * Empty-thread helper: shows the keywords both sides chose plus tap-to-fill
 * starter lines. Rendered only when this conversation is the current match.
 */
export function Icebreakers({
  partnerName,
  sharedKeywords,
  onPick,
}: {
  partnerName: string;
  sharedKeywords: string[];
  onPick: (line: string) => void;
}) {
  const lines = buildStarterLines(partnerName, sharedKeywords);

  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "5",
        paddingX: "5",
        paddingY: "8",
        textAlign: "center",
      })}
    >
      <div className={css({ display: "flex", flexDirection: "column", gap: "2", alignItems: "center" })}>
        <span
          aria-hidden
          className={css({
            display: "grid",
            placeItems: "center",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            color: "primary.600",
            background: "linear-gradient(145deg, #ffe2db, #fff5f2)",
            boxShadow: "0 8px 22px rgba(255,107,95,.18)",
          })}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 11.6c0 4.2-4 7.6-9 7.6-1 0-2-.14-2.9-.4L4 20.5l1.2-3.6C3.8 15.5 3 13.6 3 11.6 3 7.4 7 4 12 4s9 3.4 9 7.6Z" />
          </svg>
        </span>
        <h2 className={css({ color: "ink.950", fontSize: "lg", fontWeight: "black", lineHeight: "1.35" })}>
          {partnerName}님과의 첫 대화예요
        </h2>
        <p className={css({ color: "ink.500", fontSize: "sm", lineHeight: "1.7" })}>
          가볍게 인사부터 건네보면 어때요?
        </p>
      </div>

      {sharedKeywords.length > 0 && (
        <div className={css({ display: "flex", flexDirection: "column", gap: "2.5", width: "100%" })}>
          <p className={css({ color: "primary.700", fontSize: "xs", fontWeight: "black" })}>
            ✨ 두 분이 함께 고른 키워드
          </p>
          <div className={css({ display: "flex", flexWrap: "wrap", gap: "1.5", justifyContent: "center" })}>
            {sharedKeywords.map((value) => (
              <span
                key={value}
                className={css({
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: "32px",
                  borderRadius: "capsule",
                  paddingX: "3",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: "bold",
                  lineHeight: "1",
                  background: CORAL_TEXT_GRADIENT,
                  boxShadow: "0 4px 12px rgba(255,107,95,.26)",
                })}
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={css({ display: "flex", flexDirection: "column", gap: "2", width: "100%" })}>
        <p className={css({ color: "ink.500", fontSize: "xs", fontWeight: "bold" })}>
          탭하면 메시지로 채워드려요
        </p>
        {lines.map((line) => (
          <button
            key={line}
            type="button"
            onClick={() => onPick(line)}
            className={css({
              width: "100%",
              borderRadius: "16px",
              paddingX: "4",
              paddingY: "3",
              minHeight: "52px",
              color: "ink.900",
              fontSize: "sm",
              fontWeight: "medium",
              lineHeight: "1.6",
              textAlign: "left",
              background: "surface.card",
              border: "1px solid",
              borderColor: "primary.100",
              boxShadow: "cardSoft",
              cursor: "pointer",
              transition: "transform 120ms ease, border-color 120ms ease",
              _active: { transform: "scale(0.99)", borderColor: "primary.300" },
            })}
          >
            {line}
          </button>
        ))}
      </div>
    </div>
  );
}
