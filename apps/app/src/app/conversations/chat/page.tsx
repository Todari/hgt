"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { css } from "_panda/css";
import { ChatRoom } from "@/components/chat/ChatRoom";

/** UUID v4 shape — the only ids the API will accept (non-UUID → 404). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function MissingConversation({ message }: { message: string }) {
  return (
    <main
      className={css({
        height: "100dvh",
        display: "grid",
        placeItems: "center",
        paddingX: "6",
        // fixed full-screen view escapes the body inset — re-pad here
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      })}
    >
      <div
        className={css({
          width: "100%",
          maxWidth: "360px",
          background: "surface.card",
          border: "1px solid",
          borderColor: "surface.hairline",
          borderRadius: "vessel",
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
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 11.6c0 4.2-4 7.6-9 7.6-1 0-2-.14-2.9-.4L4 20.5l1.2-3.6C3.8 15.5 3 13.6 3 11.6 3 7.4 7 4 12 4s9 3.4 9 7.6Z" />
            <path d="M12 8.5v3.2M12 14.6h.01" />
          </svg>
        </span>
        <div>
          <h1 className={css({ color: "ink.950", fontSize: "lg", fontWeight: "black" })}>
            대화를 열 수 없어요
          </h1>
          <p className={css({ marginTop: "1.5", color: "ink.500", fontSize: "sm", lineHeight: "1.7" })}>
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
            borderRadius: "capsule",
            color: "white",
            fontSize: "sm",
            fontWeight: "black",
            background: "linear-gradient(135deg, #b83e3a, #d0463c)",
            boxShadow: "0 10px 24px rgba(255,107,95,.28)",
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
    <Suspense fallback={<MissingConversation message="대화를 불러오는 중이에요." />}>
      <ChatRouteInner />
    </Suspense>
  );
}
