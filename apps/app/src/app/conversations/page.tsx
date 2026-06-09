"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Conversation } from "@hgt-client/contract";
import { css, cx } from "_panda/css";
import { GlassBadge, GlassButton, GlassPanel } from "@/components/ui/glass";
import { api, ApiError, connectRealtime } from "@/lib/api";
import { formatChatTime } from "@/lib/format";
import { getSession } from "@/lib/session";

function conversationPreview(conversation: Conversation): string {
  return conversation.lastMessage?.body ?? "아직 메시지가 없습니다.";
}

export default function ConversationsPage() {
  const router = useRouter();
  const [session, setSession] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async (currentSession: string) => {
    const next = await api.getConversations(currentSession);
    setConversations(next);
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
        setError(err instanceof ApiError ? err.message : "대화 목록을 불러오지 못했습니다.");
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

    const socket = connectRealtime(session, (event) => {
      if (event.type === "message" || event.type === "match") {
        void loadConversations(session).catch((err) => {
          setError(err instanceof ApiError ? err.message : "대화 목록을 갱신하지 못했습니다.");
        });
      }
    });

    return () => socket.close();
  }, [loadConversations, session]);

  return (
    <main
      className={css({
        position: "relative",
        minHeight: "100dvh",
        overflow: "hidden",
        padding: { base: "4", md: "8" },
      })}
    >
      <div className="mesh-field" aria-hidden />
      <motion.div
        aria-hidden
        className={css({
          position: "absolute",
          top: "7%",
          left: "-18%",
          width: "88%",
          height: "36%",
          background:
            "linear-gradient(108deg, transparent, rgba(255,107,95,.15) 34%, rgba(255,107,95,.08), transparent)",
          filter: "blur(34px)",
          transform: "rotate(-8deg)",
        })}
        animate={{ x: [-16, 16, -16], y: [0, 14, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />

      <section
        className={css({
          position: "relative",
          zIndex: 1,
          maxWidth: "960px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "6",
        })}
      >
        <nav
          className={cx(
            "glass-nav",
            css({
              minHeight: "64px",
              borderRadius: "capsule",
              display: "flex",
              alignItems: { base: "flex-start", sm: "center" },
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "3",
              padding: "2",
              paddingLeft: { base: "4", md: "5" },
            }),
          )}
        >
          <div className={css({ position: "relative", zIndex: 1 })}>
            <p className={css({ color: "ink.950", fontSize: "sm", fontWeight: "black" })}>
              HGT 대화
            </p>
            <p className={css({ color: "ink.500", fontSize: "xs", fontWeight: "bold" })}>
              한 사람에게 집중하는 안전한 대화
            </p>
          </div>
          <div
            className={css({
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: { base: "flex-start", sm: "flex-end" },
              gap: "2",
              width: { base: "100%", sm: "auto" },
            })}
          >
            <GlassButton href="/home" variant="secondary">
              홈
            </GlassButton>
            <GlassButton href="/settings" variant="secondary">
              설정
            </GlassButton>
          </div>
        </nav>

        <header
          className={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", md: "1fr auto" },
            gap: "4",
            alignItems: "end",
          })}
        >
          <div className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
            <GlassBadge>Conversations</GlassBadge>
            <h1
              className={css({
                color: "ink.950",
                fontSize: { base: "3xl", md: "5xl" },
                lineHeight: "1.06",
                fontWeight: "black",
              })}
            >
              진지하게 이어지는 대화만 모았습니다.
            </h1>
          </div>
        </header>

        {error && (
          <GlassPanel tone="quiet" className={css({ padding: "4" })}>
            <p className={css({ position: "relative", zIndex: 1, color: "ink.900", fontWeight: "bold" })}>
              {error}
            </p>
          </GlassPanel>
        )}

        {loading ? (
          <GlassPanel className={css({ minHeight: "240px", display: "grid", placeItems: "center" })}>
            <p className={css({ position: "relative", zIndex: 1, color: "ink.700", fontWeight: "bold" })}>
              대화 목록을 불러오는 중입니다.
            </p>
          </GlassPanel>
        ) : conversations.length ? (
          <div className={css({ display: "grid", gap: "3" })}>
            {conversations.map((conversation) => (
              <Link key={conversation.id} href={`/conversations/${conversation.id}`}>
                <GlassPanel
                  interactive
                  tone={conversation.unreadCount > 0 ? "strong" : "quiet"}
                  className={css({
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: "4",
                    alignItems: "center",
                    padding: { base: "4", md: "5" },
                  })}
                >
                  <div
                    className={css({
                      position: "relative",
                      zIndex: 1,
                      display: "grid",
                      placeItems: "center",
                      width: "52px",
                      height: "52px",
                      borderRadius: "18px",
                      color: "primary.700",
                      fontSize: "sm",
                      fontWeight: "black",
                      background: "rgba(255,255,255,.52)",
                      border: "1px solid rgba(255,255,255,.72)",
                      boxShadow: "0 14px 26px rgba(255,107,95,.14)",
                    })}
                  >
                    {conversation.partner.name.slice(0, 1)}
                  </div>
                  <div className={css({ position: "relative", zIndex: 1, minWidth: 0 })}>
                    <div
                      className={css({
                        display: "flex",
                        alignItems: "baseline",
                        gap: "2",
                        minWidth: 0,
                      })}
                    >
                      <h2
                        className={css({
                          color: "ink.950",
                          fontSize: "lg",
                          fontWeight: "black",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        })}
                      >
                        {conversation.partner.name}
                      </h2>
                      <span
                        className={css({
                          color: "ink.500",
                          fontSize: "xs",
                          fontWeight: "bold",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        })}
                      >
                        {conversation.partner.major}
                      </span>
                    </div>
                    <p
                      className={css({
                        marginTop: "1",
                        color: conversation.unreadCount > 0 ? "ink.900" : "ink.500",
                        fontSize: "sm",
                        fontWeight: conversation.unreadCount > 0 ? "bold" : "medium",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      })}
                    >
                      {conversationPreview(conversation)}
                    </p>
                  </div>
                  <div
                    className={css({
                      position: "relative",
                      zIndex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "2",
                    })}
                  >
                    <span className={css({ color: "ink.500", fontSize: "xs", fontWeight: "bold" })}>
                      {formatChatTime(conversation.lastMessage?.createdAt ?? conversation.createdAt)}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span
                        className={css({
                          minWidth: "28px",
                          height: "28px",
                          display: "grid",
                          placeItems: "center",
                          borderRadius: "capsule",
                          paddingX: "2",
                          color: "white",
                          fontSize: "xs",
                          fontWeight: "black",
                          background:
                            "linear-gradient(135deg, rgba(184,62,58,.94), rgba(255,107,95,.9))",
                          boxShadow: "0 12px 24px rgba(255,107,95,.22)",
                        })}
                      >
                        {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </GlassPanel>
              </Link>
            ))}
          </div>
        ) : (
          <GlassPanel
            tone="quiet"
            className={css({
              minHeight: "260px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "4",
            })}
          >
            <GlassBadge>대화 없음</GlassBadge>
            <div className={css({ position: "relative", zIndex: 1 })}>
              <h2 className={css({ color: "ink.950", fontSize: "2xl", fontWeight: "black" })}>
                아직 열린 대화가 없습니다.
              </h2>
              <p className={css({ marginTop: "2", color: "ink.700", lineHeight: "1.7" })}>
                매칭이 준비되면 이곳에서 한 사람과의 대화를 이어갈 수 있습니다.
              </p>
            </div>
            <GlassButton href="/home">매칭 확인하기</GlassButton>
          </GlassPanel>
        )}
      </section>
    </main>
  );
}
