"use client";

import type { ReactNode } from "react";
import { css, cx } from "_panda/css";

/*
 * White-text-safe coral gradient: the LIGHT end is clamped to primary.600
 * (#d0463c, ≈4.55:1 vs white). #ff7a6b/#ff6b5f/#ff9a87 fail WCAG AA under
 * white text — never put white text on those. See ui/glass.tsx.
 */
const CORAL_TEXT_GRADIENT = "linear-gradient(135deg, #b83e3a, #d0463c)";

/** Solid content card, opaque, one soft shadow — matches the settings list. */
export function StepCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        css({
          background: "surface.card",
          border: "1px solid",
          borderColor: "surface.hairline",
          borderRadius: "liquid",
          boxShadow: "cardSoft",
          padding: "4",
        }),
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Small section heading + optional helper line above a group of inputs. */
export function FieldHeader({
  title,
  helper,
  trailing,
}: {
  title: string;
  helper?: string;
  trailing?: ReactNode;
}) {
  return (
    <div
      className={css({
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "3",
      })}
    >
      <div className={css({ minWidth: 0 })}>
        <h2 className={css({ color: "ink.950", fontSize: "md", fontWeight: "black" })}>
          {title}
        </h2>
        {helper && (
          <p
            className={css({
              marginTop: "1",
              color: "ink.500",
              fontSize: "xs",
              lineHeight: "1.55",
            })}
          >
            {helper}
          </p>
        )}
      </div>
      {trailing && (
        <span className={css({ flexShrink: 0, marginTop: "0.5" })}>{trailing}</span>
      )}
    </div>
  );
}

/** Live counter pill, e.g. "3개 선택됨" — turns coral once a value is chosen. */
export function CountPill({ count, suffix = "개 선택됨" }: { count: number; suffix?: string }) {
  return (
    <span
      className={css({
        display: "inline-flex",
        alignItems: "center",
        minHeight: "26px",
        paddingX: "2.5",
        borderRadius: "capsule",
        fontSize: "xs",
        fontWeight: "black",
        whiteSpace: "nowrap",
        color: count > 0 ? "white" : "ink.500",
        background: count > 0 ? CORAL_TEXT_GRADIENT : "rgba(10,17,24,.07)",
      })}
    >
      {count}
      {suffix}
    </span>
  );
}

/**
 * Selectable pill (chip). 44px min touch target. `disabled` greys it out
 * (used to gate the religion picker behind sensitive-data consent).
 */
export function Pill({
  children,
  selected,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={css({
        display: "inline-flex",
        alignItems: "center",
        minHeight: "44px",
        paddingX: "4",
        borderRadius: "capsule",
        fontSize: "sm",
        fontWeight: "bold",
        whiteSpace: "nowrap",
        cursor: disabled ? "not-allowed" : "pointer",
        color: selected ? "white" : "ink.800",
        background: selected ? CORAL_TEXT_GRADIENT : "surface.card",
        border: "1px solid",
        borderColor: selected ? "transparent" : "surface.hairline",
        boxShadow: selected ? "0 8px 18px rgba(255,107,95,.22)" : "none",
        opacity: disabled ? 0.4 : 1,
        transition: "background 140ms ease, box-shadow 140ms ease, opacity 140ms ease",
        _active: { transform: disabled ? "none" : "scale(0.97)" },
      })}
    >
      {children}
    </button>
  );
}

/** A wrapping row of pills. */
export function PillRow({ children }: { children: ReactNode }) {
  return (
    <div className={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>{children}</div>
  );
}

/**
 * Horizontal segmented tab bar (one active at a time). Scrolls horizontally
 * if the labels overflow. Each tab shows its label + optional count badge.
 */
export function SegmentedTabs({
  tabs,
  active,
  onSelect,
}: {
  tabs: Array<{ key: string; label: string; count?: number }>;
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div
      role="tablist"
      className={css({
        display: "flex",
        gap: "1",
        padding: "1",
        borderRadius: "capsule",
        background: "rgba(10,17,24,.05)",
        overflowX: "auto",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      })}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onSelect(tab.key)}
            className={css({
              flex: "0 0 auto",
              display: "inline-flex",
              alignItems: "center",
              gap: "1.5",
              minHeight: "38px",
              paddingX: "3.5",
              borderRadius: "capsule",
              fontSize: "sm",
              fontWeight: isActive ? "black" : "bold",
              whiteSpace: "nowrap",
              color: isActive ? "ink.950" : "ink.500",
              background: isActive ? "surface.card" : "transparent",
              boxShadow: isActive ? "0 2px 8px rgba(17,24,32,.1)" : "none",
              transition: "background 140ms ease, color 140ms ease",
            })}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={css({
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "18px",
                  height: "18px",
                  paddingX: "1",
                  borderRadius: "capsule",
                  fontSize: "10px",
                  fontWeight: "black",
                  color: "white",
                  background: CORAL_TEXT_GRADIENT,
                })}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
