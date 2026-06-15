"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Conversation } from "@hgt-client/contract";
import { css } from "_panda/css";
import { AppShell } from "@/components/shell/AppShell";
import { Ambient } from "@/components/ui/Ambient";
import { OfflineBanner } from "@/components/ui/status";
import { api, ApiError, connectRealtime } from "@/lib/api";
import { getSession } from "@/lib/session";

/** Messenger-style relative time: 방금 / N분 전 / N시간 전 / 어제 / M.D. */
function formatListTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (diffMinutes < 1) return "방금";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  if (date.toDateString() === now.toDateString()) {
    return `${Math.floor(diffMinutes / 60)}시간 전`;
  }
  const yesterday = new Date(now.getTime() - 86_400_000);
  if (date.toDateString() === yesterday.toDateString()) return "어제";
  return `${date.getMonth() + 1}.${date.getDate()}.`;
}

const listCardCss = css({
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

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const unread = conversation.unreadCount > 0;
  const preview = conversation.lastMessage?.body ?? "아직 메시지가 없어요. 먼저 인사해보세요.";

  return (
    <Link
      href={`/conversations/chat?c=${conversation.id}`}
      className={css({
        display: "flex",
        alignItems: "center",
        gap: "3",
        minHeight: "72px",
        paddingX: "4",
        paddingY: "3",
        transition: "background 120ms ease",
        _active: { background: "rgba(10,17,24,.05)" },
      })}
    >
      <span
        aria-hidden
        className={css({
          display: "grid",
          placeItems: "center",
          width: "48px",
          height: "48px",
          flexShrink: 0,
          borderRadius: "50%",
          color: "primary.700",
          fontSize: "lg",
          fontWeight: "black",
          background: "linear-gradient(145deg, #ffe2db, #fff5f2)",
          border: "1px solid",
          borderColor: "primary.100",
        })}
      >
        {conversation.partner.name.slice(0, 1)}
      </span>

      <span className={css({ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "1" })}>
        <span className={css({ display: "flex", alignItems: "baseline", gap: "2" })}>
          <span
            className={css({
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "ink.950",
              fontSize: "md",
              fontWeight: "black",
            })}
          >
            {conversation.partner.name}
          </span>
          <span
            className={css({
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "ink.500",
              fontSize: "xs",
              fontWeight: "bold",
              flexShrink: 1,
            })}
          >
            {conversation.partner.major}
          </span>
          <span
            className={css({
              marginLeft: "auto",
              flexShrink: 0,
              color: unread ? "primary.600" : "ink.500",
              fontSize: "xs",
              fontWeight: unread ? "black" : "medium",
            })}
          >
            {formatListTime(conversation.lastMessage?.createdAt ?? conversation.createdAt)}
          </span>
        </span>

        <span className={css({ display: "flex", alignItems: "center", gap: "2" })}>
          <span
            className={css({
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: unread ? "ink.900" : "ink.500",
              fontSize: "sm",
              fontWeight: unread ? "bold" : "medium",
              lineHeight: "1.5",
            })}
          >
            {preview}
          </span>
          {unread && (
            <span
              className={css({
                flexShrink: 0,
                minWidth: "20px",
                height: "20px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "capsule",
                paddingX: "1.5",
                color: "white",
                fontSize: "11px",
                fontWeight: "black",
                background: "linear-gradient(135deg, #b83e3a, #d0463c)",
              })}
            >
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

function SkeletonRow() {
  return (
    <div
      aria-hidden
      className={css({ display: "flex", alignItems: "center", gap: "3", minHeight: "72px", paddingX: "4", paddingY: "3" })}
    >
      <span className={css({ width: "48px", height: "48px", flexShrink: 0, borderRadius: "50%", background: "rgba(10,17,24,.06)" })} />
      <span className={css({ flex: 1, display: "flex", flexDirection: "column", gap: "2" })}>
        <span className={css({ width: "40%", height: "14px", borderRadius: "7px", background: "rgba(10,17,24,.06)" })} />
        <span className={css({ width: "72%", height: "12px", borderRadius: "6px", background: "rgba(10,17,24,.05)" })} />
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className={css({
        background: "surface.card",
        border: "1px solid",
        borderColor: "surface.hairline",
        borderRadius: "liquid",
        boxShadow: "cardSoft",
        paddingX: "6",
        paddingY: "10",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "3",
      })}
    >
      <span
        aria-hidden
        className={css({
          display: "grid",
          placeItems: "center",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          color: "primary.600",
          background: "linear-gradient(145deg, #ffe2db, #fff5f2)",
        })}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 11.6c0 4.2-4 7.6-9 7.6-1 0-2-.14-2.9-.4L4 20.5l1.2-3.6C3.8 15.5 3 13.6 3 11.6 3 7.4 7 4 12 4s9 3.4 9 7.6Z" />
        </svg>
      </span>
      <div>
        <h2 className={css({ color: "ink.950", fontSize: "lg", fontWeight: "black" })}>
          아직 대화가 없어요
        </h2>
        <p className={css({ marginTop: "1.5", color: "ink.500", fontSize: "sm", lineHeight: "1.7" })}>
          매주 월요일 저녁, 새로운 매칭과 함께 대화가 열려요.
        </p>
      </div>
      <Link
        href="/home"
        className={css({
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "44px",
          borderRadius: "capsule",
          paddingX: "5",
          color: "primary.700",
          fontSize: "sm",
          fontWeight: "black",
          background: "primary.50",
          border: "1px solid",
          borderColor: "primary.100",
        })}
      >
        홈에서 매칭 확인하기
      </Link>
    </div>
  );
}

export default function ConversationsPage() {
  const router = useRouter();
  const [session, setSession] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Snapshot used by event handlers without re-subscribing the socket.
  const conversationsRef = useRef<Conversation[]>([]);
  conversationsRef.current = conversations;

  const refetch = useCallback(async (currentSession: string) => {
    try {
      const next = await api.getConversations(currentSession);
      setConversations(next);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "대화 목록을 불러오지 못했어요.");
    }
  }, []);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      router.replace("/signin");
      return;
    }

    setSession(currentSession);
    let active = true;

    void (async () => {
      try {
        const next = await api.getConversations(currentSession);
        if (!active) return;
        setConversations(next);
      } catch (err) {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "대화 목록을 불러오지 못했어요.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!session) return undefined;

    const socket = connectRealtime(
      session,
      (event) => {
        if (event.type === "message") {
          // Update the affected row in place — no full refetch per message.
          const known = conversationsRef.current.some(
            (conversation) => conversation.id === event.message.conversationId,
          );
          if (!known) {
            void refetch(session);
            return;
          }
          setConversations((previous) => {
            const index = previous.findIndex(
              (conversation) => conversation.id === event.message.conversationId,
            );
            if (index === -1) return previous;
            const target = previous[index];
            if (!target) return previous;
            const fromPartner = event.message.senderId === target.partner.id;
            const updated: Conversation = {
              ...target,
              lastMessage: event.message,
              unreadCount: target.unreadCount + (fromPartner ? 1 : 0),
            };
            const next = [...previous];
            next.splice(index, 1);
            return [updated, ...next];
          });
          return;
        }
        if (event.type === "match") {
          // A new match opens a new conversation — the list shape changed.
          void refetch(session);
        }
      },
      { onReconnect: () => void refetch(session) },
    );

    return () => socket.close();
  }, [refetch, session]);

  return (
    <>
      <Ambient />
      <AppShell unreadDot={conversations.some((conversation) => conversation.unreadCount > 0)}>
        <div className={css({ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "3" })}>
          <header
            className={css({
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "2",
              minHeight: "44px",
              paddingX: "1",
              paddingTop: "2",
            })}
          >
            <h1 className={css({ color: "ink.950", fontSize: "2xl", fontWeight: "black" })}>대화</h1>
            {!loading && conversations.length > 0 && (
              <p className={css({ color: "ink.500", fontSize: "xs", fontWeight: "bold" })}>
                {conversations.length}개의 대화
              </p>
            )}
          </header>

          <OfflineBanner />

          {error && (
            <div
              role="alert"
              className={css({
                borderRadius: "18px",
                border: "1px solid",
                borderColor: "primary.200",
                background: "primary.50",
                paddingX: "4",
                paddingY: "3",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "3",
              })}
            >
              <p className={css({ color: "primary.900", fontSize: "sm", fontWeight: "bold", lineHeight: "1.6" })}>
                {error}
              </p>
              {session && (
                <button
                  type="button"
                  onClick={() => void refetch(session)}
                  className={css({
                    flexShrink: 0,
                    minHeight: "44px",
                    paddingX: "3",
                    color: "primary.700",
                    fontSize: "sm",
                    fontWeight: "black",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  })}
                >
                  다시 시도
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className={listCardCss}>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : conversations.length ? (
            <div className={listCardCss}>
              {conversations.map((conversation) => (
                <ConversationRow key={conversation.id} conversation={conversation} />
              ))}
            </div>
          ) : (
            !error && <EmptyState />
          )}
        </div>
      </AppShell>
    </>
  );
}
