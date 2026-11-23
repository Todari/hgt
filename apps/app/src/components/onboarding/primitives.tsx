"use client";

import type { ReactNode } from "react";
import { css, cx } from "_panda/css";

const BRAND_RED = "#ff4f3f";

/** Quiet content card. Brand emphasis belongs to selected controls and CTAs. */
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
          background: "var(--content-surface)",
          border: "1px solid var(--content-border)",
          borderRadius: "18px",
          boxShadow: "var(--content-shadow)",
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
        <h2 className={css({ color: "ink.950", fontSize: "md", fontWeight: "bold" })}>
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
        color: count > 0 ? "primary.700" : "ink.500",
        background: count > 0 ? "rgba(255,79,63,.12)" : "rgba(17,17,15,.06)",
        border: "1px solid transparent",
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
        borderRadius: "14px",
        fontSize: "sm",
        fontWeight: "bold",
        whiteSpace: "nowrap",
        cursor: disabled ? "not-allowed" : "pointer",
        color: "ink.950",
        background: selected ? "rgba(255,79,63,.13)" : "rgba(255,252,247,.82)",
        border: "1px solid",
        borderColor: selected ? "primary.400" : "rgba(54,45,40,.14)",
        boxShadow: selected
          ? "0 6px 16px rgba(217,54,41,.10), inset 0 1px 0 rgba(255,255,255,.8)"
          : "none",
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
        gap: "0.5",
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
              gap: "1",
              minWidth: "44px",
              minHeight: "44px",
              paddingX: "2.5",
              borderRadius: "capsule",
              fontSize: "13px",
              fontWeight: isActive ? "black" : "bold",
              whiteSpace: "nowrap",
              color: isActive ? "ink.950" : "ink.500",
              background: isActive ? "rgba(255,252,247,.94)" : "transparent",
              boxShadow: isActive ? "0 3px 10px rgba(73,48,38,.08)" : "none",
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
                  background: BRAND_RED,
                  border: "none",
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
