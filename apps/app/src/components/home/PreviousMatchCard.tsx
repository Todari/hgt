"use client";

import Link from "next/link";
import type { MatchResult } from "@hgt-client/contract";
import { css } from "_panda/css";
import { formatWeekLabel } from "@/lib/format";

/**
 * Compact recap of the most recent earlier match. Links to that pair's chat
 * (query-param route — static-export safe) so a conversation that started last
 * week stays one tap away while this week's reveal is still pending.
 */
export function PreviousMatchCard({ match }: { match: MatchResult }) {
  const { partner } = match;
  const chatHref = match.conversationId
    ? `/conversations/chat?c=${match.conversationId}`
    : "/conversations";

  return (
    <Link
      href={chatHref}
      aria-label={`지난주의 인연 ${partner.name}님과의 대화로 이동`}
      className={css({
        display: "flex",
        alignItems: "center",
        gap: "3",
        borderRadius: "liquid",
        padding: "4",
        background: "surface.card",
        border: "1px solid",
        borderColor: "surface.hairline",
        boxShadow: "cardSoft",
        transition: "transform 160ms ease",
        _active: { transform: "scale(0.99)" },
      })}
    >
      <span
        className={css({
          display: "grid",
          placeItems: "center",
          width: "44px",
          height: "44px",
          flexShrink: 0,
          borderRadius: "50%",
          background: "primary.50",
          border: "1px solid",
          borderColor: "primary.100",
          color: "primary.700",
          fontSize: "md",
          fontWeight: "black",
        })}
        aria-hidden
      >
        {partner.name.slice(0, 1)}
      </span>
      <span className={css({ display: "flex", flexDirection: "column", gap: "0.5", minWidth: 0, flex: 1 })}>
        <span className={css({ color: "ink.500", fontSize: "11px", fontWeight: "bold" })}>
          {formatWeekLabel(match.weekStart)}의 인연
        </span>
        <span className={css({ color: "ink.950", fontSize: "md", fontWeight: "black" })}>
          {partner.name}
        </span>
        <span
          className={css({
            color: "ink.500",
            fontSize: "xs",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          })}
        >
          {partner.major} · {partner.age}세
        </span>
      </span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className={css({ flexShrink: 0, color: "ink.300" })}>
        <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
