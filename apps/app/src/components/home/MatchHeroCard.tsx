"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { MatchResult } from "@hgt-client/contract";
import { css } from "_panda/css";
import { formatWeekLabel } from "@/lib/format";

/*
 * Canonical keyword category order — mirrors `keywordCategorySchema` in
 * packages/contract (not imported to keep zod out of the client bundle).
 */
const CATEGORY_ORDER = ["성격", "취미", "관심사", "라이프스타일", "가치관"];

const MATCH_RED = "#ff4f3f";

function orderedCategories(
  byCategory: Record<string, string[]>,
): [string, string[]][] {
  const known = CATEGORY_ORDER.filter((c) => byCategory[c]?.length);
  const extra = Object.keys(byCategory).filter(
    (c) => !CATEGORY_ORDER.includes(c) && byCategory[c]?.length,
  );
  return [...known, ...extra].map((c) => [c, byCategory[c] ?? []]);
}

function VerifiedBadge() {
  return (
    <span
      className={css({
        display: "inline-flex",
        alignItems: "center",
        gap: "1",
        minHeight: "28px",
        borderRadius: "capsule",
        paddingX: "2.5",
        background: "rgba(84,130,242,.14)",
        border: "1px solid rgba(84,130,242,.18)",
        color: "ink.950",
        fontSize: "xs",
        fontWeight: "bold",
      })}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 2.5 4.5 5.6v5.2c0 4.8 3.2 9.2 7.5 10.7 4.3-1.5 7.5-5.9 7.5-10.7V5.6L12 2.5Z"
          fill="#d0463c"
        />
        <path
          d="m8.6 12 2.3 2.3 4.5-4.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      학교 인증
    </span>
  );
}

function KeywordChip({ value, shared }: { value: string; shared: boolean }) {
  return (
    <span
      className={css(
        {
          display: "inline-flex",
          alignItems: "center",
          minHeight: "32px",
          borderRadius: "capsule",
          paddingX: "3",
          fontSize: "13px",
          fontWeight: "bold",
          lineHeight: "1",
        },
        shared
          ? {
              color: "ink.950",
              background: "#fff3bd",
              border: "1px solid rgba(218,167,22,.22)",
              boxShadow: "none",
            }
          : {
              color: "ink.700",
              background: "surface.card",
              border: "1px solid",
              borderColor: "surface.hairline",
            },
      )}
    >
      {shared ? `✨ ${value}` : value}
    </span>
  );
}

/**
 * The weekly reveal: this week's matched partner. Keyed by `roundId` at the
 * call site so a fresh match (realtime `match` event → refetch) re-mounts and
 * replays the entrance — scale/fade only, reduced-motion safe via the global
 * MotionConfig.
 */
export function MatchHeroCard({ match }: { match: MatchResult }) {
  const { partner } = match;
  const shared = new Set(match.sharedKeywords);
  const categories = orderedCategories(partner.partnerKeywords);
  const propertyMeta = [
    partner.partnerProperties.height,
    partner.partnerProperties.smoke,
    partner.partnerProperties.religion,
    partner.partnerProperties.mbti,
  ]
    .filter(Boolean)
    .join(" · ");
  const chatHref = match.conversationId
    ? `/conversations/chat?c=${match.conversationId}`
    : "/conversations";

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.95, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.65, bounce: 0.16 }}
      aria-label="이번 주의 인연"
      className={css({
        position: "relative",
        overflow: "hidden",
        borderRadius: "liquid",
        padding: "5",
        background: "var(--content-surface)",
        border: "1px solid",
        borderColor: "surface.hairline",
        boxShadow: "var(--content-shadow)",
      })}
    >
      <div
        aria-hidden
        className={css({
          position: "absolute",
          top: 0,
          right: 0,
          left: 0,
          height: "5px",
          background: "primary.500",
          pointerEvents: "none",
        })}
      />

      <div
        className={css({
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "4",
        })}
      >
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "2",
            flexWrap: "wrap",
          })}
        >
          <span
            className={css({
              display: "inline-flex",
              alignItems: "center",
              minHeight: "28px",
              borderRadius: "capsule",
              paddingX: "3",
              background: "primary.500",
              color: "ink.950",
              border: "1px solid rgba(190,48,36,.18)",
              fontSize: "xs",
              fontWeight: "black",
            })}
          >
            {formatWeekLabel(match.weekStart)}의 인연
          </span>
          <VerifiedBadge />
        </div>

        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "1",
          })}
        >
          <h2
            className={css({
              color: "ink.950",
              fontSize: "28px",
              fontWeight: "black",
              lineHeight: "1.25",
            })}
          >
            {partner.name}
          </h2>
          <p
            className={css({
              color: "ink.500",
              fontSize: "sm",
              fontWeight: "bold",
            })}
          >
            {partner.major} · {partner.age}세
          </p>
          {propertyMeta && (
            <p
              className={css({
                color: "ink.500",
                fontSize: "xs",
                lineHeight: "1.6",
              })}
            >
              {propertyMeta}
            </p>
          )}
        </div>

        {partner.description && (
          <blockquote
            className={css({
              margin: 0,
              borderRadius: "14px",
              padding: "4",
              background: "rgba(54,185,128,.09)",
              border: "1px solid rgba(54,185,128,.15)",
            })}
          >
            <p
              className={css({
                color: "ink.700",
                fontSize: "sm",
                lineHeight: "1.7",
                fontWeight: "medium",
              })}
            >
              “{partner.description}”
            </p>
          </blockquote>
        )}

        {categories.length > 0 && (
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              gap: "3",
            })}
          >
            <div
              className={css({
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "2",
              })}
            >
              <p
                className={css({
                  color: "ink.500",
                  fontSize: "xs",
                  fontWeight: "black",
                })}
              >
                {partner.name}님을 표현하는 키워드
              </p>
              {match.sharedKeywords.length > 0 && (
                <p
                  className={css({
                    color: "primary.700",
                    fontSize: "xs",
                    fontWeight: "bold",
                  })}
                >
                  ✨ 둘 다 골랐어요
                </p>
              )}
            </div>
            {categories.map(([category, values]) => (
              <div
                key={category}
                className={css({
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5",
                })}
              >
                <p
                  className={css({
                    color: "ink.500",
                    fontSize: "11px",
                    fontWeight: "bold",
                    letterSpacing: "0.04em",
                  })}
                >
                  {category}
                </p>
                <div
                  className={css({
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1.5",
                  })}
                >
                  {values.map((value) => (
                    <KeywordChip
                      key={value}
                      value={value}
                      shared={shared.has(value)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "2",
          })}
        >
          <Link
            href={chatHref}
            className={css({
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              minHeight: "54px",
              borderRadius: "16px",
              color: "white",
              fontSize: "md",
              fontWeight: "black",
              background: MATCH_RED,
              border: "1px solid rgba(190,48,36,.18)",
              boxShadow: "0 10px 24px rgba(255,79,63,.2)",
              _active: {
                transform: "scale(.985)",
                boxShadow: "0 5px 14px rgba(255,79,63,.17)",
              },
            })}
          >
            대화 시작하기
          </Link>
          {match.sharedKeywords.length > 0 && (
            <p
              className={css({
                color: "ink.500",
                fontSize: "xs",
                textAlign: "center",
                lineHeight: "1.6",
              })}
            >
              둘 다 고른 ‘{match.sharedKeywords[0]}’ 이야기로 시작해보면 어때요?
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
