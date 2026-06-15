"use client";

import type { ReactNode } from "react";
import { css } from "_panda/css";

/**
 * Fullscreen onboarding wizard shell — its own progress header + sticky
 * safe-area-padded bottom action bar. Intentionally does NOT use AppShell
 * (no TabBar): onboarding is a focused, exit-only flow.
 */

export type WizardStep = {
  /** Short label shown under the dots (e.g. "약관 동의"). */
  label: string;
};

function StepDots({
  steps,
  current,
  reachable,
  onJump,
}: {
  steps: WizardStep[];
  current: number;
  /** Indices the user may jump to directly (edit mode). */
  reachable: (index: number) => boolean;
  onJump: (index: number) => void;
}) {
  return (
    <div
      className={css({ display: "flex", alignItems: "center", gap: "2" })}
      role="tablist"
      aria-label="가입 단계"
    >
      {steps.map((step, index) => {
        const active = index === current;
        const done = index < current;
        const canJump = reachable(index) && index !== current;
        return (
          <button
            key={step.label}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`${index + 1}단계 ${step.label}`}
            disabled={!canJump}
            onClick={() => canJump && onJump(index)}
            className={css({
              flex: 1,
              height: "6px",
              borderRadius: "capsule",
              border: "none",
              padding: 0,
              cursor: canJump ? "pointer" : "default",
              background:
                active || done
                  ? "linear-gradient(135deg, #ff7a6b, #d0463c)"
                  : "rgba(10,17,24,.12)",
              opacity: done && !active ? 0.85 : 1,
              transition: "background 200ms ease, opacity 200ms ease",
            })}
          />
        );
      })}
    </div>
  );
}

export function WizardChrome({
  steps,
  current,
  title,
  subtitle,
  reachable,
  onJump,
  onBack,
  children,
  footer,
}: {
  steps: WizardStep[];
  current: number;
  title: string;
  subtitle: string;
  reachable: (index: number) => boolean;
  onJump: (index: number) => void;
  /** Back affordance in the header. Null hides it (first reachable step). */
  onBack: (() => void) | null;
  children: ReactNode;
  /** The sticky action bar content. */
  footer: ReactNode;
}) {
  return (
    <div
      className={css({
        position: "relative",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
      })}
    >
      <div className="mesh-field" aria-hidden />

      {/* Progress header */}
      <header
        className={css({
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: "480px",
          marginX: "auto",
          paddingX: "5",
          paddingTop: "3",
          display: "flex",
          flexDirection: "column",
          gap: "3",
        })}
      >
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "2",
            minHeight: "32px",
          })}
        >
          {onBack ? (
            <button
              type="button"
              aria-label="이전 단계"
              onClick={onBack}
              className={css({
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                marginLeft: "-6px",
                borderRadius: "capsule",
                color: "ink.700",
                _active: { background: "rgba(10,17,24,.06)" },
              })}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>
          ) : (
            <span className={css({ width: "32px" })} aria-hidden />
          )}
          <p
            className={css({
              flex: 1,
              textAlign: "center",
              color: "ink.500",
              fontSize: "xs",
              fontWeight: "black",
              letterSpacing: "0.02em",
            })}
          >
            {current + 1} / {steps.length}
          </p>
          <span className={css({ width: "32px" })} aria-hidden />
        </div>

        <StepDots
          steps={steps}
          current={current}
          reachable={reachable}
          onJump={onJump}
        />

        <div className={css({ marginTop: "1" })}>
          <h1
            className={css({
              color: "ink.950",
              fontSize: "2xl",
              fontWeight: "black",
              lineHeight: "1.2",
            })}
          >
            {title}
          </h1>
          <p
            className={css({
              marginTop: "1.5",
              color: "ink.500",
              fontSize: "sm",
              lineHeight: "1.6",
            })}
          >
            {subtitle}
          </p>
        </div>
      </header>

      {/* Scrollable step body */}
      <div
        className={css({
          position: "relative",
          zIndex: 1,
          flex: 1,
          width: "100%",
          maxWidth: "480px",
          marginX: "auto",
          paddingX: "5",
          paddingTop: "4",
          // clear the sticky action bar (≈80px) + its safe-area inset
          paddingBottom: "calc(96px + env(safe-area-inset-bottom))",
        })}
      >
        {children}
      </div>

      {/* Sticky bottom action bar */}
      <div
        className={css({
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          background: "surface.card",
          borderTop: "1px solid",
          borderTopColor: "surface.hairline",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        })}
      >
        <div
          className={css({
            width: "100%",
            maxWidth: "480px",
            marginX: "auto",
            paddingX: "5",
            paddingY: "3",
            display: "flex",
            gap: "3",
            alignItems: "center",
          })}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}

/** Primary action button for the sticky bar — full-width, 52px, coral. */
export function WizardPrimaryButton({
  children,
  onClick,
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={css({
        flex: 1,
        minHeight: "52px",
        borderRadius: "capsule",
        border: "none",
        color: "white",
        fontSize: "md",
        fontWeight: "black",
        // White-text-safe coral (light end clamped to primary.600). See ui/glass.tsx.
        background: "linear-gradient(135deg, #b83e3a, #d0463c)",
        boxShadow: "0 10px 24px rgba(255,107,95,.28)",
        transition: "opacity 160ms ease, transform 120ms ease",
        _active: { transform: disabled ? "none" : "scale(0.99)" },
        _disabled: {
          cursor: "not-allowed",
          opacity: 0.45,
          boxShadow: "none",
        },
      })}
    >
      {children}
    </button>
  );
}

/** Secondary (ghost) action — used for the 이전 button when present in the bar. */
export function WizardGhostButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={css({
        minHeight: "52px",
        paddingX: "5",
        borderRadius: "capsule",
        border: "1px solid",
        borderColor: "surface.hairline",
        background: "transparent",
        color: "ink.700",
        fontSize: "md",
        fontWeight: "bold",
        whiteSpace: "nowrap",
        _active: { background: "rgba(10,17,24,.05)" },
      })}
    >
      {children}
    </button>
  );
}
