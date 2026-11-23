"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { css } from "_panda/css";
import { ChatRoom } from "@/components/chat/ChatRoom";

/** UUID v4 shape — the only ids the API will accept (non-UUID → 404). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function MissingConversation({ message }: { message: string }) {
  return (
    <main
      className={css({
        height: "var(--hgt-page-height)",
        display: "grid",
        placeItems: "center",
        paddingX: "6",
      })}
    >
      <div
        className={css({
          width: "100%",
          maxWidth: "360px",
          background: "var(--content-surface)",
          border: "1px solid",
          borderColor: "surface.hairline",
          borderRadius: "liquid",
          boxShadow: "cardSoft",
          padding: "6",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "4",
        })}
      >
        <span
          aria-hidden
          className={css({
            justifySelf: "center",
            display: "grid",
            placeItems: "center",
            width: "56px",
            height: "56px",
            marginX: "auto",
            borderRadius: "50%",
            color: "primary.600",
            background: "primary.50",
          })}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M21 11.6c0 4.2-4 7.6-9 7.6-1 0-2-.14-2.9-.4L4 20.5l1.2-3.6C3.8 15.5 3 13.6 3 11.6 3 7.4 7 4 12 4s9 3.4 9 7.6Z" />
            <path d="M12 8.5v3.2M12 14.6h.01" />
          </svg>
        </span>
        <div>
          <h1
            className={css({
              color: "ink.950",
              fontSize: "lg",
              fontWeight: "black",
            })}
          >
            대화를 열 수 없어요
          </h1>
          <p
            className={css({
              marginTop: "1.5",
              color: "ink.500",
              fontSize: "sm",
              lineHeight: "1.7",
            })}
          >
            {message}
          </p>
        </div>
        <Link
          href="/conversations"
          className={css({
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "48px",
            borderRadius: "16px",
            color: "white",
            fontSize: "sm",
            fontWeight: "black",
            background: "primary.500",
            border: "1px solid rgba(190,48,36,.18)",
            boxShadow: "0 8px 20px rgba(255,79,63,.18)",
          })}
        >
          목록으로
        </Link>
      </div>
    </main>
  );
}

/** Reads the `?c=` cursor inside the Suspense boundary (output:export needs it). */
function ChatRouteInner() {
  const conversationId = useSearchParams().get("c");
  if (!conversationId || !UUID_RE.test(conversationId)) {
    return (
      <MissingConversation message="대화 주소가 올바르지 않아요. 대화 목록에서 다시 들어와 주세요." />
    );
  }
  return <ChatRoom conversationId={conversationId} />;
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={<MissingConversation message="대화를 불러오는 중이에요." />}
    >
      <ChatRouteInner />
    </Suspense>
  );
}
