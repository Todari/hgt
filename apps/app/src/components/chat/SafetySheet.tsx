"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PartnerUser } from "@hgt-client/contract";
import { css } from "_panda/css";
import { api, ApiError } from "@/lib/api";

type Mode = "menu" | "report";

/**
 * Overflow (⋯) bottom sheet: 차단 / 신고 actions ported from the old
 * SafetyActions. Motion is translateY only (no blur) per the GPU budget.
 * A successful block calls `onBlocked` so the room can leave to /conversations.
 */
export function SafetySheet({
  open,
  onClose,
  session,
  partner,
  onBlocked,
}: {
  open: boolean;
  onClose: () => void;
  session: string;
  partner: PartnerUser;
  onBlocked: () => void;
}) {
  const [mode, setMode] = useState<Mode>("menu");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"block" | "report" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function reset() {
    setMode("menu");
    setReason("");
    setBusy(null);
    setNotice(null);
  }

  function close() {
    if (busy) return;
    reset();
    onClose();
  }

  async function onBlock() {
    const confirmed = window.confirm(
      `${partner.name}님을 차단하시겠어요? 차단하면 이 대화와 매칭이 모두 제한돼요.`,
    );
    if (!confirmed) return;

    setBusy("block");
    setNotice(null);
    try {
      await api.blockUser(session, partner.id);
      onBlocked();
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "차단에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setBusy(null);
    }
  }

  async function onReport() {
    const nextReason = reason.trim();
    if (!nextReason) {
      setNotice("신고 사유를 입력해 주세요.");
      return;
    }

    setBusy("report");
    setNotice(null);
    try {
      await api.reportUser(session, partner.id, nextReason);
      setReason("");
      setNotice("신고가 접수됐어요. 운영팀이 빠르게 확인할게요.");
      setMode("menu");
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "신고에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AnimatePresence onExitComplete={reset}>
      {open && (
        <motion.div
          className={css({
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            background: "rgba(10,17,24,.42)",
          })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="안전 조치"
            className={css({
              width: "100%",
              maxWidth: "480px",
              marginX: "auto",
              background: "surface.card",
              borderTopRadius: "vessel",
              boxShadow: "0 -12px 40px rgba(10,17,24,.22)",
              paddingX: "5",
              paddingTop: "3",
              paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
              display: "flex",
              flexDirection: "column",
              gap: "3",
            })}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", duration: 0.42, bounce: 0.08 }}
            onClick={(event) => event.stopPropagation()}
          >
            <span
              aria-hidden
              className={css({
                width: "40px",
                height: "4px",
                borderRadius: "capsule",
                background: "rgba(10,17,24,.16)",
                alignSelf: "center",
                marginBottom: "1",
              })}
            />

            {mode === "menu" ? (
              <>
                <div className={css({ textAlign: "center" })}>
                  <h2 className={css({ color: "ink.950", fontSize: "md", fontWeight: "black" })}>
                    {partner.name}님과의 대화
                  </h2>
                  <p className={css({ marginTop: "1", color: "ink.500", fontSize: "xs", lineHeight: "1.6" })}>
                    불편한 상황이 생기면 언제든 멈출 수 있어요.
                  </p>
                </div>

                {notice && (
                  <p
                    className={css({
                      borderRadius: "16px",
                      background: "primary.50",
                      border: "1px solid",
                      borderColor: "primary.100",
                      paddingX: "4",
                      paddingY: "3",
                      color: "primary.900",
                      fontSize: "sm",
                      fontWeight: "bold",
                      lineHeight: "1.6",
                      textAlign: "center",
                    })}
                  >
                    {notice}
                  </p>
                )}

                <div className={css({ display: "flex", flexDirection: "column", gap: "2", marginTop: "1" })}>
                  <button
                    type="button"
                    onClick={() => {
                      setNotice(null);
                      setMode("report");
                    }}
                    className={css({
                      minHeight: "52px",
                      borderRadius: "16px",
                      paddingX: "4",
                      display: "flex",
                      alignItems: "center",
                      gap: "3",
                      color: "ink.900",
                      fontSize: "sm",
                      fontWeight: "bold",
                      background: "ink.50",
                      border: "1px solid",
                      borderColor: "surface.hairline",
                      cursor: "pointer",
                      _active: { background: "ink.100" },
                    })}
                  >
                    <SheetIcon kind="report" />
                    신고하기
                  </button>
                  <button
                    type="button"
                    onClick={() => void onBlock()}
                    disabled={busy != null}
                    className={css({
                      minHeight: "52px",
                      borderRadius: "16px",
                      paddingX: "4",
                      display: "flex",
                      alignItems: "center",
                      gap: "3",
                      color: "primary.700",
                      fontSize: "sm",
                      fontWeight: "black",
                      background: "primary.50",
                      border: "1px solid",
                      borderColor: "primary.100",
                      cursor: "pointer",
                      _disabled: { opacity: 0.6, cursor: "not-allowed" },
                      _active: { background: "primary.100" },
                    })}
                  >
                    <SheetIcon kind="block" />
                    {busy === "block" ? "차단하는 중..." : "차단하기"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={close}
                  className={css({
                    minHeight: "48px",
                    borderRadius: "16px",
                    color: "ink.500",
                    fontSize: "sm",
                    fontWeight: "bold",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    marginTop: "1",
                  })}
                >
                  닫기
                </button>
              </>
            ) : (
              <>
                <div className={css({ display: "flex", alignItems: "center", gap: "2" })}>
                  <button
                    type="button"
                    aria-label="뒤로"
                    onClick={() => {
                      setNotice(null);
                      setMode("menu");
                    }}
                    className={css({
                      display: "grid",
                      placeItems: "center",
                      width: "36px",
                      height: "36px",
                      flexShrink: 0,
                      borderRadius: "12px",
                      color: "ink.700",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      _active: { background: "ink.50" },
                    })}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M15 5l-7 7 7 7" />
                    </svg>
                  </button>
                  <h2 className={css({ color: "ink.950", fontSize: "md", fontWeight: "black" })}>
                    신고하기
                  </h2>
                </div>
                <p className={css({ color: "ink.500", fontSize: "xs", lineHeight: "1.6", paddingX: "1" })}>
                  어떤 점이 불편했는지 구체적으로 적어주시면 검토에 큰 도움이 돼요.
                </p>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="상황을 구체적으로 적어주세요."
                  className={css({
                    width: "100%",
                    minHeight: "120px",
                    borderRadius: "16px",
                    padding: "4",
                    color: "ink.950",
                    fontSize: "md",
                    lineHeight: "1.6",
                    resize: "none",
                    background: "ink.50",
                    border: "1px solid",
                    borderColor: "surface.hairline",
                    _focusVisible: {
                      outline: "none",
                      borderColor: "primary.300",
                      boxShadow: "0 0 0 3px rgba(255,107,95,.16)",
                    },
                  })}
                />
                {notice && (
                  <p className={css({ color: "primary.700", fontSize: "sm", fontWeight: "bold", paddingX: "1" })}>
                    {notice}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void onReport()}
                  disabled={busy != null}
                  className={css({
                    minHeight: "52px",
                    borderRadius: "capsule",
                    color: "white",
                    fontSize: "sm",
                    fontWeight: "black",
                    background: "linear-gradient(135deg, #b83e3a, #d0463c)",
                    boxShadow: "0 10px 24px rgba(255,107,95,.28)",
                    border: "none",
                    cursor: "pointer",
                    _disabled: { opacity: 0.6, cursor: "not-allowed" },
                  })}
                >
                  {busy === "report" ? "접수하는 중..." : "신고 접수"}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SheetIcon({ kind }: { kind: "report" | "block" }) {
  return (
    <span aria-hidden className={css({ display: "inline-flex", flexShrink: 0 })}>
      {kind === "report" ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 21V4h11l-1.4 3.5L15 11H4" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M5.6 5.6l12.8 12.8" />
        </svg>
      )}
    </span>
  );
}
