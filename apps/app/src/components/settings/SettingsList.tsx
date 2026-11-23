"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { css, cx } from "_panda/css";
import { SwitchKnob } from "@/components/ui/glass";

/*
 * iOS-style grouped settings list. Content groups stay opaque and quiet;
 * Liquid Glass is reserved for the floating navigation layer.
 */

const sectionCardCss = css({
  borderRadius: "18px",
  background: "var(--content-surface)",
  border: "1px solid var(--content-border)",
  boxShadow: "var(--content-shadow)",
  overflow: "hidden",
  "& > * + *": {
    borderTop: "1px solid",
    borderTopColor: "rgba(17,17,15,.1)",
  },
});

export function SettingsSection({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: string;
}) {
  return (
    <section
      className={css({ display: "flex", flexDirection: "column", gap: "1.5" })}
    >
      <h2
        className={css({
          paddingX: "4",
          color: "ink.500",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Pretendard Variable', sans-serif",
          fontSize: "13px",
          fontWeight: "semibold",
          letterSpacing: "-0.01em",
        })}
      >
        {title}
      </h2>
      <div className={sectionCardCss}>{children}</div>
      {footer && (
        <p
          className={css({
            paddingX: "4",
            color: "ink.500",
            fontSize: "xs",
            lineHeight: "1.6",
          })}
        >
          {footer}
        </p>
      )}
    </section>
  );
}

/* Base row: ≥56px touch target, label + optional description, trailing slot. */
const rowCss = css({
  width: "100%",
  minHeight: "56px",
  display: "flex",
  alignItems: "center",
  gap: "3",
  paddingX: "4",
  paddingY: "2.5",
  textAlign: "left",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Pretendard Variable', sans-serif",
  WebkitTapHighlightColor: "transparent",
  transition: "background 100ms ease, opacity 100ms ease",
  _active: { background: "rgba(17,17,15,.055)" },
  _disabled: { cursor: "not-allowed", opacity: 0.55 },
});

function RowText({
  label,
  description,
  danger = false,
}: {
  label: string;
  description?: string;
  danger?: boolean;
}) {
  return (
    <span
      className={css({
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: "0.5",
      })}
    >
      <span
        className={css({
          color: danger ? "primary.600" : "ink.950",
          fontSize: "16px",
          fontWeight: "medium",
          lineHeight: "1.35",
          letterSpacing: "-0.015em",
        })}
      >
        {label}
      </span>
      {description && (
        <span
          className={css({
            color: "ink.500",
            fontSize: "13px",
            fontWeight: "normal",
            lineHeight: "1.45",
            letterSpacing: "-0.01em",
          })}
        >
          {description}
        </span>
      )}
    </span>
  );
}

function Chevron() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={css({ flexShrink: 0, color: "rgba(104,99,91,.56)" })}
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function SettingsLinkRow({
  href,
  label,
  description,
  value,
}: {
  href: string;
  label: string;
  description?: string;
  value?: string;
}) {
  return (
    <Link href={href} className={rowCss}>
      <RowText label={label} description={description} />
      {value && (
        <span
          className={css({
            color: "ink.500",
            fontSize: "15px",
            fontWeight: "normal",
            flexShrink: 0,
          })}
        >
          {value}
        </span>
      )}
      <Chevron />
    </Link>
  );
}

export function SettingsButtonRow({
  label,
  description,
  onClick,
  disabled = false,
  danger = false,
  trailing,
}: {
  label: string;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={rowCss}
      onClick={onClick}
      disabled={disabled}
    >
      <RowText label={label} description={description} danger={danger} />
      {trailing ?? <Chevron />}
    </button>
  );
}

export function SettingsToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={rowCss}
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <RowText label={label} description={description} />
      <SwitchKnob checked={checked} />
    </button>
  );
}

/** Static info row (no action) — e.g. the identity summary. */
export function SettingsInfoRow({
  label,
  description,
  trailing,
}: {
  label: string;
  description?: string;
  trailing?: ReactNode;
}) {
  return (
    <div
      className={cx(
        rowCss,
        css({ cursor: "default", _active: { background: "transparent" } }),
      )}
    >
      <RowText label={label} description={description} />
      {trailing}
    </div>
  );
}
