"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { css, cx } from "_panda/css";

type GlassTone = "default" | "quiet" | "strong";
type GlassVariant = "solid" | "glass";

const panelTone: Record<GlassTone, string> = {
  default: css({ background: "var(--content-surface)" }),
  quiet: css({ background: "rgba(255,252,247,.76)" }),
  strong: css({ background: "primary.500" }),
};

export function GlassPanel({
  children,
  className,
  tone = "default",
  variant: _variant = "solid",
  interactive = false,
  ...props
}: HTMLMotionProps<"section"> & {
  tone?: GlassTone;
  variant?: GlassVariant;
  interactive?: boolean;
}) {
  return (
    <motion.section
      className={cx(
        css({
          position: "relative",
          overflow: "hidden",
          borderRadius: "liquid",
          padding: "5",
          border: "1px solid",
          borderColor: "surface.hairline",
          boxShadow: "var(--content-shadow)",
        }),
        panelTone[tone],
        className,
      )}
      whileHover={interactive ? { y: -1 } : undefined}
      whileTap={interactive ? { scale: 0.99 } : undefined}
      transition={{ duration: 0.12 }}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function GlassBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        css({
          display: "inline-flex",
          alignItems: "center",
          width: "fit-content",
          minHeight: "30px",
          borderRadius: "capsule",
          paddingX: "3",
          color: "ink.950",
          background: "#fff3bd",
          border: "1px solid rgba(218,167,22,.22)",
          boxShadow: "none",
          fontSize: "xs",
          fontWeight: "black",
        }),
        className,
      )}
    >
      {children}
    </span>
  );
}

type GlassButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary";
  className?: string;
} & Omit<HTMLMotionProps<"button">, "className" | "children">;

export function GlassButton({
  children,
  href,
  variant = "primary",
  className,
  disabled,
  ...props
}: GlassButtonProps) {
  const classNames = cx(
    "glass-control",
    css({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "52px",
      borderRadius: "16px",
      paddingX: "6",
      paddingY: "2.5",
      color: variant === "primary" ? "white" : "ink.950",
      background: variant === "primary" ? "primary.500" : "surface.card",
      fontWeight: "black",
      whiteSpace: "nowrap",
      _disabled: { cursor: "not-allowed", opacity: 0.5 },
    }),
    className,
  );

  if (href) {
    return (
      <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.985 }}>
        <Link href={href} className={classNames}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      className={classNames}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

type GlassTextFieldProps = ComponentPropsWithoutRef<"input"> & {
  label: string;
  helper?: string;
  error?: string;
  containerClassName?: string;
};

export function GlassTextField({
  id,
  label,
  helper,
  error,
  className,
  containerClassName,
  ...props
}: GlassTextFieldProps) {
  const fieldId = id ?? `field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div
      className={cx(
        css({ display: "flex", flexDirection: "column", gap: "2" }),
        containerClassName,
      )}
    >
      <label
        htmlFor={fieldId}
        className={css({
          color: "ink.950",
          fontSize: "sm",
          fontWeight: "black",
        })}
      >
        {label}
      </label>
      <input
        id={fieldId}
        className={cx(
          css({
            width: "100%",
            minHeight: "50px",
            borderRadius: "12px",
            paddingX: "4",
            color: "ink.950",
            background: "rgba(255,255,255,.82)",
            fontSize: "16px",
            fontWeight: "medium",
            appearance: "none",
            border: "1px solid",
            borderColor: "surface.hairline",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.9)",
            _focusVisible: {
              outline: "none",
              borderColor: "primary.300",
              boxShadow: "0 0 0 3px rgba(255,79,63,.14)",
            },
            _placeholder: { color: "ink.300" },
          }),
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={helper || error ? `${fieldId}-note` : undefined}
        {...props}
      />
      {(helper || error) && (
        <p
          id={`${fieldId}-note`}
          className={css({
            color: error ? "primary.700" : "ink.500",
            fontSize: "xs",
            lineHeight: "1.6",
            fontWeight: error ? "black" : "medium",
          })}
        >
          {error ?? helper}
        </p>
      )}
    </div>
  );
}

type GlassTextareaProps = ComponentPropsWithoutRef<"textarea"> & {
  label: string;
  helper?: string;
  error?: string;
  containerClassName?: string;
};

export function GlassTextarea({
  id,
  label,
  helper,
  error,
  className,
  containerClassName,
  ...props
}: GlassTextareaProps) {
  const fieldId = id ?? `field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div
      className={cx(
        css({ display: "flex", flexDirection: "column", gap: "2" }),
        containerClassName,
      )}
    >
      <label
        htmlFor={fieldId}
        className={css({
          color: "ink.950",
          fontSize: "sm",
          fontWeight: "black",
        })}
      >
        {label}
      </label>
      <textarea
        id={fieldId}
        className={cx(
          css({
            width: "100%",
            minHeight: "108px",
            borderRadius: "12px",
            padding: "4",
            color: "ink.950",
            background: "rgba(255,255,255,.82)",
            fontSize: "16px",
            fontWeight: "medium",
            resize: "vertical",
            appearance: "none",
            border: "1px solid",
            borderColor: "surface.hairline",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.9)",
            _focusVisible: {
              outline: "none",
              borderColor: "primary.300",
              boxShadow: "0 0 0 3px rgba(255,79,63,.14)",
            },
            _placeholder: { color: "ink.300" },
          }),
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={helper || error ? `${fieldId}-note` : undefined}
        {...props}
      />
      {(helper || error) && (
        <p
          id={`${fieldId}-note`}
          className={css({
            color: error ? "primary.700" : "ink.500",
            fontSize: "xs",
            lineHeight: "1.6",
            fontWeight: error ? "black" : "medium",
          })}
        >
          {error ?? helper}
        </p>
      )}
    </div>
  );
}

export function GlassChip({
  children,
  selected = false,
  onClick,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  const classNames = css({
    display: "inline-flex",
    alignItems: "center",
    minHeight: "44px",
    borderRadius: "capsule",
    paddingX: "4",
    color: "ink.950",
    background: selected ? "rgba(255,79,63,.13)" : "surface.card",
    border: "1px solid",
    borderColor: selected ? "rgba(255,79,63,.4)" : "surface.hairline",
    boxShadow: selected ? "0 5px 16px rgba(255,79,63,.1)" : "none",
    fontSize: "sm",
    fontWeight: "black",
    cursor: onClick ? "pointer" : "default",
  });

  if (!onClick) return <span className={classNames}>{children}</span>;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={classNames}
    >
      {children}
    </button>
  );
}

export function SwitchKnob({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={css({
        position: "relative",
        flexShrink: 0,
        width: "51px",
        height: "31px",
        borderRadius: "capsule",
        background: checked ? "primary.500" : "rgba(104,99,91,.22)",
        border: "none",
        boxShadow: checked
          ? "inset 0 0 0 1px rgba(185,38,28,.1)"
          : "inset 0 0 0 1px rgba(17,17,15,.06)",
        transition: "background 160ms ease, box-shadow 160ms ease",
        _before: {
          content: '""',
          position: "absolute",
          top: "2px",
          left: checked ? "22px" : "2px",
          width: "27px",
          height: "27px",
          borderRadius: "50%",
          background: "white",
          border: "none",
          boxShadow: "0 1px 3px rgba(17,17,15,.24), 0 0 1px rgba(17,17,15,.18)",
          transition: "left 160ms cubic-bezier(.2,.8,.2,1)",
        },
      })}
    />
  );
}

export function GlassToggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={css({
        width: "100%",
        minHeight: "60px",
        borderRadius: "12px",
        padding: "3.5",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: "4",
        textAlign: "left",
        background: "surface.card",
        border: "1px solid",
        borderColor: "surface.hairline",
      })}
    >
      <span
        className={css({ display: "flex", flexDirection: "column", gap: "1" })}
      >
        <span
          className={css({
            color: "ink.950",
            fontSize: "sm",
            fontWeight: "black",
          })}
        >
          {label}
        </span>
        {description && (
          <span
            className={css({
              color: "ink.500",
              fontSize: "xs",
              lineHeight: "1.5",
            })}
          >
            {description}
          </span>
        )}
      </span>
      <SwitchKnob checked={checked} />
    </button>
  );
}

export function GlassFeatureCard({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <GlassPanel
      interactive
      tone="quiet"
      className={css({ minHeight: "210px" })}
    >
      <div
        className={css({ display: "flex", flexDirection: "column", gap: "3" })}
      >
        <span
          className={css({
            color: "primary.700",
            fontSize: "xs",
            fontWeight: "black",
          })}
        >
          {label}
        </span>
        <h3
          className={css({
            color: "ink.950",
            fontSize: "lg",
            lineHeight: "1.25",
            fontWeight: "black",
          })}
        >
          {title}
        </h3>
        <p
          className={css({
            color: "ink.500",
            fontSize: "sm",
            lineHeight: "1.7",
          })}
        >
          {children}
        </p>
      </div>
    </GlassPanel>
  );
}

export function GlassMetric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div
      className={css({
        minWidth: 0,
        border: "1px solid rgba(218,167,22,.22)",
        borderRadius: "14px",
        padding: "3",
        background: "#ffd84d",
        boxShadow: "0 6px 18px rgba(218,167,22,.1)",
      })}
    >
      <p
        className={css({
          color: "ink.950",
          fontSize: "xl",
          fontWeight: "black",
          lineHeight: "1.2",
          overflowWrap: "anywhere",
        })}
      >
        {value}
      </p>
      <p
        className={css({
          color: "ink.700",
          fontSize: "xs",
          fontWeight: "bold",
        })}
      >
        {label}
      </p>
    </div>
  );
}
