"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { css } from "_panda/css";

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
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
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
        background: "surface.card",
        borderTop: "1px solid",
        borderTopColor: "surface.hairline",
        paddingX: "3",
        paddingTop: "2.5",
        // pin above the home indicator
        paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)",
      })}
    >
      <div
        className={css({
          display: "flex",
          alignItems: "flex-end",
          gap: "2",
          maxWidth: "480px",
          marginX: "auto",
        })}
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
            borderRadius: "22px",
            paddingX: "4",
            paddingY: "2.5",
            color: "ink.950",
            fontSize: "15px",
            lineHeight: "1.5",
            resize: "none",
            background: "ink.50",
            border: "1px solid",
            borderColor: "surface.hairline",
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
            background: "linear-gradient(135deg, #b83e3a, #d0463c)",
            boxShadow: "0 6px 16px rgba(255,107,95,.3)",
            border: "none",
            cursor: "pointer",
            transition: "transform 120ms ease, opacity 120ms ease",
            _disabled: { opacity: 0.42, cursor: "not-allowed", boxShadow: "none" },
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
