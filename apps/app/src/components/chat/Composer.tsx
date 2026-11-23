"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { css, cx } from "_panda/css";

const MAX_LEN = 2000;
const MAX_HEIGHT = 120;

/** Devices with a real mouse/keyboard get Enter-to-send; touch keeps newline. */
function usePointerFine(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fine;
}

/**
 * Pinned message composer. Auto-grows the textarea up to MAX_HEIGHT, sends via
 * the 44px+ button (always) and Enter (pointer:fine only, IME-guarded). The
 * value is controlled by the parent so icebreaker taps can prefill it.
 */
export function Composer({
  value,
  onChange,
  onSend,
  disabled,
  notice,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  /** Inline error shown above the input (e.g. a rejected message reason). */
  notice?: string | null;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const pointerFine = usePointerFine();
  const canSend = value.trim().length > 0 && !disabled;

  // Auto-grow: reset to measure, then clamp to MAX_HEIGHT.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter") return;
    // Korean IME composition: Enter commits the syllable, never sends.
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
    if (event.shiftKey) return; // explicit newline
    // Mobile (coarse pointer): Enter inserts a newline; send is button-only.
    if (!pointerFine) return;
    event.preventDefault();
    if (canSend) onSend();
  }

  function submit() {
    if (canSend) onSend();
  }

  return (
    <div
      className={css({
        flexShrink: 0,
        paddingX: "3",
        paddingTop: "2",
        // pin above the home indicator
        paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
      })}
    >
      {notice && (
        <p
          role="alert"
          className={css({
            maxWidth: "480px",
            marginX: "auto",
            marginBottom: "2",
            color: "primary.700",
            fontSize: "13px",
            fontWeight: "bold",
            lineHeight: "1.5",
          })}
        >
          {notice}
        </p>
      )}
      <div
        className={cx(
          "liquid-glass",
          css({
            display: "flex",
            alignItems: "flex-end",
            gap: "1.5",
            width: "100%",
            maxWidth: "460px",
            marginX: "auto",
            padding: "1",
            borderRadius: "28px",
            overflow: "hidden",
          }),
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value.slice(0, MAX_LEN))}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="메시지를 입력하세요"
          aria-label="메시지 입력"
          className={css({
            flex: 1,
            minHeight: "44px",
            maxHeight: `${MAX_HEIGHT}px`,
            // 28px outer radius - 4px shell padding = 24px.
            borderRadius: "24px",
            paddingX: "4",
            paddingY: "2.5",
            color: "ink.950",
            fontSize: "15px",
            lineHeight: "1.5",
            resize: "none",
            background: "rgba(255,250,240,.38)",
            border: "1px solid",
            borderColor: "rgba(255,255,255,.48)",
            _focusVisible: {
              outline: "none",
              borderColor: "primary.300",
              boxShadow: "0 0 0 3px rgba(255,107,95,.14)",
            },
            _placeholder: { color: "ink.300" },
          })}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="메시지 보내기"
          className={css({
            display: "grid",
            placeItems: "center",
            width: "44px",
            height: "44px",
            flexShrink: 0,
            borderRadius: "50%",
            color: "white",
            background:
              "linear-gradient(145deg, rgba(255,125,108,.94), rgba(217,54,41,.94))",
            boxShadow:
              "0 7px 18px rgba(217,54,41,.24), inset 0 1px 0 rgba(255,255,255,.48)",
            border: "1px solid",
            borderColor: "rgba(255,255,255,.54)",
            cursor: "pointer",
            transition: "transform 120ms ease, opacity 120ms ease",
            _disabled: {
              opacity: 0.42,
              cursor: "not-allowed",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.28)",
            },
            _active: { transform: canSend ? "scale(0.92)" : "none" },
          })}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
