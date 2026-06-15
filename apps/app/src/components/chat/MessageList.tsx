"use client";

import { motion } from "framer-motion";
import { css } from "_panda/css";
import { buildChatItems, formatTimeOfDay, type ChatMessage } from "@/components/chat/lib";
import { formatMessageDay } from "@/lib/format";

/* Darkest-coral gradient that keeps white text ≥4.5:1 (see ui/glass.tsx). */
const CORAL_TEXT_GRADIENT = "linear-gradient(135deg, #b83e3a, #d0463c)";

function DaySeparator({ date }: { date: string }) {
  return (
    <div className={css({ display: "grid", placeItems: "center", marginY: "1.5" })}>
      <span
        className={css({
          borderRadius: "capsule",
          paddingX: "3",
          paddingY: "1",
          color: "ink.500",
          fontSize: "11px",
          fontWeight: "bold",
          background: "rgba(10,17,24,.06)",
        })}
      >
        {formatMessageDay(date)}
      </span>
    </div>
  );
}

function MessageBubble({
  message,
  mine,
  runStart,
  runEnd,
  showRead,
  onRetry,
  onDelete,
}: {
  message: ChatMessage;
  mine: boolean;
  runStart: boolean;
  runEnd: boolean;
  showRead: boolean;
  onRetry: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
}) {
  const failed = message.clientStatus === "failed";
  const sending = message.clientStatus === "sending";

  // Corner radii: only the run-start corner on the sender's side is rounded
  // hard; mid-run bubbles keep a tight matching corner (KakaoTalk style).
  const radius = mine
    ? `20px ${runStart ? "20px" : "8px"} ${runEnd ? "8px" : "8px"} 20px`
    : `${runStart ? "20px" : "8px"} 20px 20px ${runEnd ? "8px" : "8px"}`;

  const meta = (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: "0.5",
        flexShrink: 0,
        paddingBottom: "1",
        textAlign: mine ? "right" : "left",
      })}
    >
      {mine && showRead && !failed && !sending && (
        <span className={css({ color: "primary.600", fontSize: "10px", fontWeight: "black", lineHeight: "1" })}>
          읽음
        </span>
      )}
      <span className={css({ color: "ink.300", fontSize: "10px", fontWeight: "bold", lineHeight: "1", whiteSpace: "nowrap" })}>
        {sending ? "전송 중" : formatTimeOfDay(message.createdAt)}
      </span>
    </div>
  );

  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        alignItems: mine ? "flex-end" : "flex-start",
        marginTop: runStart ? "2.5" : "0.5",
      })}
    >
      <motion.div
        className={css({
          display: "flex",
          alignItems: "flex-end",
          gap: "1.5",
          maxWidth: "82%",
          flexDirection: mine ? "row-reverse" : "row",
        })}
        initial={message.clientStatus ? { opacity: 0, y: 6 } : false}
        animate={{ opacity: failed ? 0.85 : 1, y: 0 }}
        transition={{ duration: 0.16 }}
      >
        <div
          className={css({
            borderRadius: radius,
            paddingX: "3.5",
            paddingY: "2.5",
            color: mine ? "white" : "ink.900",
            background: mine ? CORAL_TEXT_GRADIENT : "surface.card",
            border: mine ? "none" : "1px solid",
            borderColor: mine ? undefined : "surface.hairline",
            boxShadow: mine ? "0 6px 16px rgba(255,107,95,.2)" : "cardSoft",
            overflowWrap: "anywhere",
          })}
        >
          <p className={css({ fontSize: "15px", lineHeight: "1.55", whiteSpace: "pre-wrap" })}>
            {message.body}
          </p>
        </div>
        {/* timestamp/읽음 only at the END of a run, beside the bubble */}
        {(runEnd || failed || sending) && meta}
      </motion.div>

      {failed && (
        <div className={css({ display: "flex", alignItems: "center", gap: "1.5", marginTop: "1" })}>
          <span className={css({ color: "primary.700", fontSize: "11px", fontWeight: "bold" })}>
            전송 실패
          </span>
          <button
            type="button"
            onClick={() => onRetry(message)}
            className={css({
              minHeight: "28px",
              borderRadius: "capsule",
              paddingX: "2.5",
              color: "primary.700",
              fontSize: "11px",
              fontWeight: "black",
              background: "primary.50",
              border: "1px solid",
              borderColor: "primary.200",
              cursor: "pointer",
            })}
          >
            재전송
          </button>
          <button
            type="button"
            onClick={() => onDelete(message)}
            className={css({
              minHeight: "28px",
              borderRadius: "capsule",
              paddingX: "2.5",
              color: "ink.500",
              fontSize: "11px",
              fontWeight: "bold",
              background: "ink.50",
              border: "1px solid",
              borderColor: "surface.hairline",
              cursor: "pointer",
            })}
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}

/** The day-separated, run-grouped message column. */
export function MessageList({
  messages,
  myId,
  onRetry,
  onDelete,
}: {
  messages: ChatMessage[];
  myId: string;
  onRetry: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
}) {
  const items = buildChatItems(messages, myId);

  return (
    <div className={css({ display: "flex", flexDirection: "column", paddingX: "3", paddingY: "2" })}>
      {items.map((item) =>
        item.kind === "day" ? (
          <DaySeparator key={item.key} date={item.date} />
        ) : (
          <MessageBubble
            key={item.key}
            message={item.message}
            mine={item.mine}
            runStart={item.runStart}
            runEnd={item.runEnd}
            showRead={item.showRead}
            onRetry={onRetry}
            onDelete={onDelete}
          />
        ),
      )}
    </div>
  );
}
