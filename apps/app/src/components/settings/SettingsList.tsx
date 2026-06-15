"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { css, cx } from "_panda/css";
import { SwitchKnob } from "@/components/ui/glass";

/*
 * iOS-style grouped settings list: a section label above a solid card whose
 * rows are divided by hairlines. Solid surfaces only (GPU budget) — no
 * backdrop blur, one soft shadow.
 */

const sectionCardCss = css({
  background: "surface.card",
  border: "1px solid",
  borderColor: "surface.hairline",
  borderRadius: "liquid",
  boxShadow: "cardSoft",
  overflow: "hidden",
  "& > * + *": {
    borderTop: "1px solid",
    borderTopColor: "surface.hairline",
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
    <section className={css({ display: "flex", flexDirection: "column", gap: "2" })}>
      <h2
        className={css({
          paddingX: "4",
          color: "ink.500",
          fontSize: "xs",
          fontWeight: "black",
          letterSpacing: "0.02em",
        })}
      >
        {title}
      </h2>
      <div className={sectionCardCss}>{children}</div>
      {footer && (
        <p className={css({ paddingX: "4", color: "ink.500", fontSize: "xs", lineHeight: "1.6" })}>
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
  paddingY: "3",
  textAlign: "left",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  transition: "background 120ms ease",
  _active: { background: "rgba(10,17,24,.05)" },
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
          color: danger ? "primary.700" : "ink.950",
          fontSize: "md",
          fontWeight: "bold",
          lineHeight: "1.4",
        })}
      >
        {label}
      </span>
      {description && (
        <span className={css({ color: "ink.500", fontSize: "xs", lineHeight: "1.55" })}>
          {description}
        </span>
      )}
    </span>
  );
}

function Chevron() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={css({ flexShrink: 0, color: "ink.300" })}
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
        <span className={css({ color: "ink.500", fontSize: "sm", flexShrink: 0 })}>{value}</span>
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
    <button type="button" className={rowCss} onClick={onClick} disabled={disabled}>
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
    <div className={cx(rowCss, css({ cursor: "default", _active: { background: "transparent" } }))}>
      <RowText label={label} description={description} />
      {trailing}
    </div>
  );
}
