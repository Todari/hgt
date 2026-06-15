"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { Conversation, MeProfile, PartnerUser } from "@hgt-client/contract";
import { css } from "_panda/css";
import { Composer } from "@/components/chat/Composer";
import { Icebreakers } from "@/components/chat/Icebreakers";
import { mergeMessages, type ChatMessage } from "@/components/chat/lib";
import { MessageList } from "@/components/chat/MessageList";
import { SafetySheet } from "@/components/chat/SafetySheet";
import { api, ApiError, connectRealtime } from "@/lib/api";
import { getSession } from "@/lib/session";

const PAGE_SIZE = 50;
/** Autoscroll only when the user is already within this many px of the bottom. */
const NEAR_BOTTOM_PX = 120;

type LoadState = "loading" | "ready" | "error";

function partnerSummary(partner: PartnerUser): string {
  return `${partner.major} · ${partner.age}세`;
}

export function ChatRoom({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<string | null>(null);
  const [me, setMe] = useState<MeProfile | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Pagination
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // Autoscroll / jump pill
  const [showJumpPill, setShowJumpPill] = useState(false);
  // Icebreakers eligibility (this conv === current match)
  const [icebreakers, setIcebreakers] = useState<string[] | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  // Mutable mirrors so effect/event callbacks read fresh values without re-subscribing.
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;
  const sessionRef = useRef<string | null>(null);
  sessionRef.current = session;

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setShowJumpPill(false);
  }, []);

  /* ---- initial load: history + markRead (+ icebreaker eligibility) ---- */
  useEffect(() => {
    const current = getSession();
    if (!current) {
      router.replace("/signin");
      return;
    }
    setSession(current);
    let active = true;

    void (async () => {
      try {
        const [profile, conversationList, history] = await Promise.all([
          api.getMe(current),
          api.getConversations(current),
          api.getMessages(current, conversationId, { limit: PAGE_SIZE }),
        ]);
        const conv = conversationList.find((item) => item.id === conversationId);
        if (!conv) throw new ApiError("대화를 찾을 수 없어요.", 404);

        await api.markRead(current, conversationId);
        if (!active) return;

        setMe(profile);
        setConversation(conv);
        setMessages(history);
        setHasMore(history.length >= PAGE_SIZE);
        setLoadState("ready");

        // Icebreakers only when the thread is empty AND this is the live match.
        if (history.length === 0) {
          try {
            const match = await api.getMyMatch(current);
            if (active && match.current?.conversationId === conversationId) {
              setIcebreakers(match.current.sharedKeywords);
            }
          } catch {
            /* icebreakers are optional — ignore failures */
          }
        }
      } catch (err) {
        if (!active) return;
        setErrorMessage(err instanceof ApiError ? err.message : "대화를 불러오지 못했어요.");
        setLoadState("error");
      }
    })();

    return () => {
      active = false;
    };
  }, [conversationId, router]);

  /* ---- pin to bottom on first ready render ---- */
  useEffect(() => {
    if (loadState === "ready") scrollToBottom("auto");
    // run once when the room becomes ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadState]);

  /* ---- merge helper: dedupe + sort, pending sinks to bottom ---- */
  const ingest = useCallback((incoming: ChatMessage[]) => {
    setMessages((current) => mergeMessages(current, incoming));
  }, []);

  /* ---- realtime: new messages + reconnect refetch ---- */
  useEffect(() => {
    if (!session) return undefined;

    const refetchNewest = async () => {
      try {
        const history = await api.getMessages(session, conversationId, { limit: PAGE_SIZE });
        ingest(history);
        await api.markRead(session, conversationId);
      } catch {
        /* transient — next event/reconnect will heal */
      }
    };

    const socket = connectRealtime(
      session,
      (event) => {
        if (event.type !== "message") return; // ping swallowed in api.ts; match irrelevant here
        if (event.message.conversationId !== conversationId) return;
        const wasNear = isNearBottom();
        ingest([event.message]);
        void api.markRead(session, conversationId);
        if (wasNear) {
          requestAnimationFrame(() => scrollToBottom("smooth"));
        } else {
          setShowJumpPill(true);
        }
      },
      { onReconnect: () => void refetchNewest() },
    );

    return () => socket.close();
  }, [conversationId, ingest, isNearBottom, scrollToBottom, session]);

  /* ---- infinite up-scroll: load older, preserve scroll position ---- */
  const loadOlder = useCallback(async () => {
    const current = sessionRef.current;
    const el = scrollRef.current;
    if (!current || !el || loadingOlder || !hasMore) return;

    const oldest = messagesRef.current.find((m) => !m.clientStatus);
    if (!oldest) return;

    setLoadingOlder(true);
    const prevHeight = el.scrollHeight;
    const prevTop = el.scrollTop;
    try {
      const older = await api.getMessages(current, conversationId, {
        limit: PAGE_SIZE,
        before: oldest.createdAt,
      });
      setHasMore(older.length >= PAGE_SIZE);
      if (older.length > 0) {
        ingest(older);
        // Restore the viewport to the same message after prepending.
        requestAnimationFrame(() => {
          const node = scrollRef.current;
          if (!node) return;
          node.scrollTop = prevTop + (node.scrollHeight - prevHeight);
        });
      }
    } catch {
      /* leave hasMore; user can scroll to retry */
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, hasMore, ingest, loadingOlder]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadOlder();
      },
      { root, rootMargin: "120px 0px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadOlder]);

  /* ---- toggle jump pill as the user scrolls ---- */
  const onScroll = useCallback(() => {
    if (isNearBottom()) setShowJumpPill(false);
  }, [isNearBottom]);

  /* ---- send (optimistic) ---- */
  const sendBody = useCallback(
    async (body: string, reuseId?: string) => {
      const current = sessionRef.current;
      if (!current) return;
      const trimmed = body.trim();
      if (!trimmed) return;

      const tempId = reuseId ?? `temp-${crypto.randomUUID()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        conversationId,
        senderId: me?.id ?? "",
        body: trimmed,
        createdAt: new Date().toISOString(),
        readAt: null,
        clientStatus: "sending",
      };
      setMessages((curr) => {
        const without = curr.filter((m) => m.id !== tempId);
        return mergeMessages(without, [optimistic]);
      });
      requestAnimationFrame(() => scrollToBottom("smooth"));

      try {
        const sent = await api.sendMessage(current, conversationId, trimmed);
        // Drop the temp row, add the settled server row.
        setMessages((curr) => mergeMessages(curr.filter((m) => m.id !== tempId), [sent]));
      } catch {
        setMessages((curr) =>
          curr.map((m) => (m.id === tempId ? { ...m, clientStatus: "failed" } : m)),
        );
      }
    },
    [conversationId, me?.id, scrollToBottom],
  );

  const onSend = useCallback(() => {
    const body = draft;
    if (!body.trim()) return;
    setDraft("");
    setIcebreakers(null);
    void sendBody(body);
  }, [draft, sendBody]);

  const onRetry = useCallback(
    (message: ChatMessage) => {
      void sendBody(message.body, message.id);
    },
    [sendBody],
  );

  const onDelete = useCallback((message: ChatMessage) => {
    setMessages((curr) => curr.filter((m) => m.id !== message.id));
  }, []);

  const partner = conversation?.partner ?? null;
  const settledCount = useMemo(
    () => messages.filter((m) => !m.clientStatus).length,
    [messages],
  );
  const showIcebreakers = icebreakers !== null && settledCount === 0;

  return (
    <div
      className={css({
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--hgt-paper, #f8efec)",
      })}
    >
      {/* ---------------- header ---------------- */}
      <header
        className={css({
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "1.5",
          minHeight: "52px",
          paddingX: "1.5",
          paddingTop: "env(safe-area-inset-top)",
          background: "surface.card",
          borderBottom: "1px solid",
          borderBottomColor: "surface.hairline",
        })}
      >
        <button
          type="button"
          aria-label="뒤로"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.replace("/conversations");
          }}
          className={css({
            display: "grid",
            placeItems: "center",
            width: "44px",
            height: "44px",
            flexShrink: 0,
            borderRadius: "50%",
            color: "ink.900",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            _active: { background: "ink.50" },
          })}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>

        <div className={css({ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0" })}>
          <div className={css({ display: "flex", alignItems: "center", gap: "1.5", minWidth: 0 })}>
            <span
              className={css({
                color: "ink.950",
                fontSize: "md",
                fontWeight: "black",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              })}
            >
              {partner ? partner.name : "대화"}
            </span>
            {partner && (
              <span
                className={css({
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5",
                  flexShrink: 0,
                  height: "18px",
                  borderRadius: "capsule",
                  paddingX: "1.5",
                  color: "primary.700",
                  fontSize: "10px",
                  fontWeight: "black",
                  background: "primary.50",
                  border: "1px solid",
                  borderColor: "primary.100",
                })}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 2.5 4.5 5.6v5.2c0 4.8 3.2 9.2 7.5 10.7 4.3-1.5 7.5-5.9 7.5-10.7V5.6L12 2.5Z" fill="#d0463c" />
                  <path d="m8.6 12 2.3 2.3 4.5-4.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                인증
              </span>
            )}
          </div>
          {partner && (
            <span
              className={css({
                color: "ink.500",
                fontSize: "11px",
                fontWeight: "bold",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              })}
            >
              {partnerSummary(partner)}
            </span>
          )}
        </div>

        {partner && session && (
          <button
            type="button"
            aria-label="대화 옵션"
            onClick={() => setSheetOpen(true)}
            className={css({
              display: "grid",
              placeItems: "center",
              width: "44px",
              height: "44px",
              flexShrink: 0,
              borderRadius: "50%",
              color: "ink.700",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              _active: { background: "ink.50" },
            })}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="12" cy="5" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="12" cy="19" r="1.7" />
            </svg>
          </button>
        )}
      </header>

      {/* ---------------- messages (only this scrolls) ---------------- */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className={css({
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        })}
      >
        {loadState === "loading" && (
          <div className={css({ height: "100%", display: "grid", placeItems: "center" })}>
            <p className={css({ color: "ink.500", fontSize: "sm", fontWeight: "bold" })}>
              대화를 불러오는 중이에요.
            </p>
          </div>
        )}

        {loadState === "error" && (
          <div className={css({ height: "100%", display: "grid", placeItems: "center", paddingX: "8" })}>
            <div className={css({ textAlign: "center" })}>
              <p className={css({ color: "ink.900", fontSize: "sm", fontWeight: "bold", lineHeight: "1.7" })}>
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={() => router.replace("/conversations")}
                className={css({
                  marginTop: "3",
                  minHeight: "44px",
                  borderRadius: "capsule",
                  paddingX: "5",
                  color: "primary.700",
                  fontSize: "sm",
                  fontWeight: "black",
                  background: "primary.50",
                  border: "1px solid",
                  borderColor: "primary.100",
                  cursor: "pointer",
                })}
              >
                목록으로
              </button>
            </div>
          </div>
        )}

        {loadState === "ready" && (
          <>
            {/* top sentinel for infinite up-scroll */}
            {hasMore && (
              <div ref={topSentinelRef} className={css({ display: "grid", placeItems: "center", paddingY: "3" })}>
                <span className={css({ color: "ink.500", fontSize: "12px", fontWeight: "bold" })}>
                  {loadingOlder ? "불러오는 중..." : "이전 대화 보기"}
                </span>
              </div>
            )}

            {showIcebreakers && partner ? (
              <Icebreakers
                partnerName={partner.name}
                sharedKeywords={icebreakers ?? []}
                onPick={(line) => setDraft(line)}
              />
            ) : settledCount === 0 && messages.length === 0 ? (
              <div className={css({ height: "100%", display: "grid", placeItems: "center", paddingX: "8" })}>
                <p className={css({ color: "ink.500", fontSize: "sm", fontWeight: "bold", textAlign: "center", lineHeight: "1.7" })}>
                  아직 메시지가 없어요.{"\n"}먼저 인사를 건네보세요.
                </p>
              </div>
            ) : (
              me && (
                <MessageList
                  messages={messages}
                  myId={me.id}
                  onRetry={onRetry}
                  onDelete={onDelete}
                />
              )
            )}
          </>
        )}
      </div>

      {/* ---------------- jump-to-bottom pill ---------------- */}
      <div
        className={css({
          position: "relative",
          maxWidth: "480px",
          width: "100%",
          marginX: "auto",
        })}
      >
        <AnimatePresence>
          {showJumpPill && (
            <motion.button
              type="button"
              onClick={() => scrollToBottom("smooth")}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className={css({
                position: "absolute",
                bottom: "2",
                left: "50%",
                transform: "translateX(-50%)",
                display: "inline-flex",
                alignItems: "center",
                gap: "1.5",
                minHeight: "36px",
                borderRadius: "capsule",
                paddingX: "4",
                color: "white",
                fontSize: "13px",
                fontWeight: "black",
                background: "linear-gradient(135deg, #b83e3a, #d0463c)",
                boxShadow: "0 8px 20px rgba(255,107,95,.32)",
                border: "none",
                cursor: "pointer",
                zIndex: 5,
              })}
            >
              새 메시지
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ---------------- composer ---------------- */}
      {loadState === "ready" && (
        <Composer value={draft} onChange={setDraft} onSend={onSend} />
      )}

      {/* ---------------- safety sheet ---------------- */}
      {partner && session && (
        <SafetySheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          session={session}
          partner={partner}
          onBlocked={() => router.replace("/conversations")}
        />
      )}
    </div>
  );
}
