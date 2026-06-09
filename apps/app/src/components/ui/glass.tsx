"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { css, cx } from "_panda/css";

type GlassTone = "default" | "quiet" | "strong";

const toneStyles: Record<GlassTone, string> = {
  default: css({ boxShadow: "glassFloat" }),
  quiet: css({
    background:
      "linear-gradient(145deg, rgba(255,255,255,.58), rgba(255,255,255,.24))",
    boxShadow:
      "0 1px 0 rgba(255,255,255,.72) inset, 0 14px 30px rgba(10,17,24,.08), 0 10px 26px rgba(255,107,95,.1)",
  }),
  strong: css({ boxShadow: "actionGlow" }),
};

export function GlassPanel({
  children,
  className,
  tone = "default",
  interactive = false,
  ...props
}: HTMLMotionProps<"section"> & {
  tone?: GlassTone;
  interactive?: boolean;
}) {
  const classNames = cx(
    "glass-panel",
    toneStyles[tone],
    css({
      position: "relative",
      overflow: "hidden",
      borderRadius: "liquid",
      padding: "5",
    }),
    className,
  );

  return (
    <motion.section
      className={classNames}
      whileHover={interactive ? { y: -4 } : undefined}
      transition={{ duration: 0.18 }}
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
        "glass-panel",
        css({
          position: "relative",
          zIndex: 1,
          display: "inline-flex",
          alignItems: "center",
          width: "fit-content",
          minHeight: "34px",
          borderRadius: "capsule",
          paddingX: "4",
          color: "ink.700",
          fontSize: "sm",
          fontWeight: "bold",
          boxShadow: "glassInset",
        }),
        className,
      )}
    >
      <span className={css({ position: "relative", zIndex: 1 })}>{children}</span>
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
      position: "relative",
      zIndex: 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "52px",
      borderRadius: "capsule",
      paddingX: "6",
      paddingY: "2.5",
      border: "1px solid rgba(255,255,255,.72)",
      fontWeight: "black",
      whiteSpace: "nowrap",
      _disabled: {
        cursor: "not-allowed",
        opacity: 0.58,
      },
    }),
    variant === "primary"
      ? css({
          color: "white",
          background:
            "linear-gradient(135deg, rgba(184,62,58,.94), rgba(255,107,95,.9) 58%, rgba(255,154,135,.86))",
          boxShadow: "actionGlow",
        })
      : css({
          color: "ink.800",
          background:
            "linear-gradient(145deg, rgba(255,255,255,.7), rgba(255,255,255,.3))",
          boxShadow: "glassLift",
        }),
    className,
  );

  const content = <span className={css({ position: "relative", zIndex: 1 })}>{children}</span>;

  if (href) {
    return (
      <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link href={href} className={classNames}>
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      className={classNames}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -3, scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      {...props}
    >
      {content}
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
    <div className={cx(css({ display: "flex", flexDirection: "column", gap: "2" }), containerClassName)}>
      <label
        htmlFor={fieldId}
        className={css({ color: "ink.700", fontSize: "sm", fontWeight: "bold" })}
      >
        {label}
      </label>
      <input
        id={fieldId}
        className={cx(
          "glass-field",
          css({
            minHeight: "52px",
            borderRadius: "18px",
            paddingX: "4",
            color: "ink.950",
            fontSize: "md",
            fontWeight: "medium",
            boxShadow:
              "0 1px 0 rgba(255,255,255,.78) inset, 0 14px 30px rgba(10,17,24,.08)",
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
            fontWeight: error ? "bold" : "medium",
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
    <div className={cx(css({ display: "flex", flexDirection: "column", gap: "2" }), containerClassName)}>
      <label
        htmlFor={fieldId}
        className={css({ color: "ink.700", fontSize: "sm", fontWeight: "bold" })}
      >
        {label}
      </label>
      <textarea
        id={fieldId}
        className={cx(
          "glass-field",
          css({
            minHeight: "108px",
            borderRadius: "18px",
            padding: "4",
            color: "ink.950",
            fontSize: "md",
            fontWeight: "medium",
            resize: "vertical",
            boxShadow:
              "0 1px 0 rgba(255,255,255,.78) inset, 0 14px 30px rgba(10,17,24,.08)",
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
            fontWeight: error ? "bold" : "medium",
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
  const classNames = cx(
    onClick ? "glass-control" : undefined,
    css({
      position: "relative",
      zIndex: 1,
      display: "inline-flex",
      alignItems: "center",
      minHeight: "36px",
      borderRadius: "capsule",
      paddingX: "4",
      color: selected ? "white" : "ink.700",
      fontSize: "sm",
      fontWeight: "bold",
      cursor: onClick ? "pointer" : "default",
      background: selected
        ? "linear-gradient(135deg, rgba(184,62,58,.94), rgba(255,107,95,.88))"
        : "rgba(255,255,255,.36)",
      border: "1px solid",
      borderColor: selected ? "rgba(255,255,255,.76)" : "rgba(255,255,255,.58)",
      boxShadow: selected
        ? "0 1px 0 rgba(255,255,255,.58) inset, 0 12px 26px rgba(255,107,95,.22)"
        : "0 1px 0 rgba(255,255,255,.72) inset, 0 10px 20px rgba(10,17,24,.07)",
    }),
  );

  const content = <span className={css({ position: "relative", zIndex: 1 })}>{children}</span>;

  if (!onClick) {
    return <span className={classNames}>{content}</span>;
  }

  return (
    <button type="button" aria-pressed={selected} onClick={onClick} className={classNames}>
      {content}
    </button>
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
      className={cx(
        "glass-control",
        css({
          position: "relative",
          zIndex: 1,
          width: "100%",
          borderRadius: "20px",
          padding: "3",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: "4",
          textAlign: "left",
          background: "rgba(255,255,255,.36)",
          boxShadow: "0 1px 0 rgba(255,255,255,.72) inset, 0 12px 26px rgba(10,17,24,.07)",
        }),
      )}
    >
      <span
        className={css({
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "1",
        })}
      >
        <span className={css({ color: "ink.950", fontSize: "sm", fontWeight: "black" })}>
          {label}
        </span>
        {description && (
          <span className={css({ color: "ink.500", fontSize: "xs", lineHeight: "1.5" })}>
            {description}
          </span>
        )}
      </span>
      <span
        className={css({
          position: "relative",
          zIndex: 1,
          width: "46px",
          height: "28px",
          borderRadius: "capsule",
          background: checked
            ? "linear-gradient(135deg, #b83e3a, #ff6b5f)"
            : "rgba(10,17,24,.12)",
          boxShadow: checked
            ? "0 10px 20px rgba(255,107,95,.24)"
            : "0 1px 0 rgba(255,255,255,.62) inset",
          transition: "background 160ms ease, box-shadow 160ms ease",
          _before: {
            content: '""',
            position: "absolute",
            top: "4px",
            left: checked ? "22px" : "4px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "rgba(255,255,255,.9)",
            boxShadow: "0 4px 10px rgba(10,17,24,.16)",
            transition: "left 160ms ease",
          },
        })}
      />
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
    <GlassPanel interactive tone="quiet" className={css({ minHeight: "210px" })}>
      <div className={css({ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "3" })}>
        <span className={css({ color: "primary.700", fontSize: "xs", fontWeight: "black" })}>
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
        <p className={css({ color: "ink.500", fontSize: "sm", lineHeight: "1.7" })}>
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
        border: "1px solid rgba(255,255,255,.58)",
        borderRadius: "20px",
        padding: "3",
        background: "rgba(255,255,255,.36)",
        boxShadow: "0 12px 26px rgba(10,17,24,.07)",
        backdropFilter: "blur(11px)",
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
      <p className={css({ color: "ink.500", fontSize: "xs", fontWeight: "bold" })}>
        {label}
      </p>
    </div>
  );
}
