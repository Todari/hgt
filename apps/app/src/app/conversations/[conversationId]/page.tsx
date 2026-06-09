"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Conversation, MeProfile, Message, User } from "@hgt-client/contract";
import { css, cx } from "_panda/css";
import {
  GlassBadge,
  GlassButton,
  GlassPanel,
  GlassTextarea,
} from "@/components/ui/glass";
import { api, ApiError, connectRealtime } from "@/lib/api";
import { formatChatTime, formatMessageDay } from "@/lib/format";
import { getSession } from "@/lib/session";

function getConversationId(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function partnerSummary(partner: User): string {
  return `${partner.major} · ${partner.age}세 · ${partner.gender ? "남" : "여"}`;
}

function SafetyActions({
  session,
  partner,
}: {
  session: string;
  partner: User;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"block" | "report" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onBlock() {
    const confirmed = window.confirm(
      `${partner.name}님을 차단하시겠어요? 차단 후에는 이 상대와의 대화와 매칭이 제한됩니다.`,
    );
    if (!confirmed) return;

    setBusy("block");
    setNotice(null);
    try {
      await api.blockUser(session, partner.id);
      setNotice("상대를 차단했습니다.");
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "차단에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function onReport() {
    const nextReason = reason.trim();
    if (!nextReason) {
      setNotice("신고 사유를 입력해주세요.");
      return;
    }

    setBusy("report");
    setNotice(null);
    try {
      await api.reportUser(session, partner.id, nextReason);
      setReason("");
      setNotice("신고가 접수되었습니다.");
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "신고에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <GlassPanel tone="quiet" className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
      <div className={css({ position: "relative", zIndex: 1 })}>
        <h2 className={css({ color: "ink.950", fontSize: "xl", fontWeight: "black" })}>
          안전 조치
        </h2>
        <p className={css({ marginTop: "1", color: "ink.500", fontSize: "sm", lineHeight: "1.7" })}>
          불편한 대화가 생기면 상대를 차단하거나 운영팀에 신고할 수 있습니다.
        </p>
      </div>
      <GlassTextarea
        label="신고 사유"
        placeholder="상황을 구체적으로 적어주세요."
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        maxLength={1000}
      />
      <div className={css({ position: "relative", zIndex: 1, display: "flex", flexWrap: "wrap", gap: "2" })}>
        <GlassButton type="button" variant="secondary" onClick={onBlock} disabled={busy != null}>
          {busy === "block" ? "차단 중..." : "상대 차단"}
        </GlassButton>
        <GlassButton type="button" onClick={onReport} disabled={busy != null}>
          {busy === "report" ? "신고 중..." : "신고 접수"}
        </GlassButton>
      </div>
      {notice && (
        <p className={css({ position: "relative", zIndex: 1, color: "ink.900", fontSize: "sm", fontWeight: "bold" })}>
          {notice}
        </p>
      )}
    </GlassPanel>
  );
}

export default function ConversationRoomPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = getConversationId(params.conversationId);
  const [session, setSession] = useState<string | null>(null);
  const [me, setMe] = useState<MeProfile | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const appendMessage = useCallback((message: Message) => {
    setMessages((current) => {
      if (current.some((item) => item.id === message.id)) return current;
      return [...current, message];
    });
  }, []);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      router.replace("/signin");
      return;
    }
    if (!conversationId) {
      setError("대화를 찾을 수 없습니다.");
      setLoading(false);
      return;
    }

    setSession(currentSession);
    let active = true;

    void (async () => {
      try {
        const [profile, conversationList, history] = await Promise.all([
          api.getMe(currentSession),
          api.getConversations(currentSession),
          api.getMessages(currentSession, conversationId),
        ]);
        const currentConversation = conversationList.find((item) => item.id === conversationId) ?? null;
        if (!currentConversation) throw new ApiError("대화를 찾을 수 없습니다.", 404);

        await api.markRead(currentSession, conversationId);
        if (!active) return;
        setMe(profile);
        setConversation(currentConversation);
        setMessages(history);
      } catch (err) {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "대화를 불러오지 못했습니다.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [conversationId, router]);

  useEffect(() => {
    if (!session || !conversationId) return undefined;

    const socket = connectRealtime(session, (event) => {
      if (event.type !== "message" || event.message.conversationId !== conversationId) return;
      appendMessage(event.message);
      void api.markRead(session, conversationId);
    });

    return () => socket.close();
  }, [appendMessage, conversationId, session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const groupedMessages = useMemo(
    () =>
      messages.map((message, index) => {
        const previous = messages[index - 1];
        const startsNewDay =
          !previous ||
          new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
        return { message, startsNewDay };
      }),
    [messages],
  );

  async function onSend(event: FormEvent) {
    event.preventDefault();
    if (!session || !conversationId) return;

    const body = draft.trim();
    if (!body) return;

    setSending(true);
    setError(null);
    try {
      const sent = await api.sendMessage(session, conversationId, body);
      appendMessage(sent);
      setDraft("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "메시지 전송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  }

  const partner = conversation?.partner ?? null;

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
          top: "8%",
          right: "-18%",
          width: "88%",
          height: "36%",
          background:
            "linear-gradient(108deg, transparent, rgba(255,107,95,.16) 34%, rgba(255,107,95,.08), transparent)",
          filter: "blur(34px)",
          transform: "rotate(9deg)",
        })}
        animate={{ x: [16, -16, 16], y: [0, 14, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />

      <section
        className={css({
          position: "relative",
          zIndex: 1,
          maxWidth: "1120px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "5",
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
          <div className={css({ position: "relative", zIndex: 1, minWidth: 0 })}>
            <p className={css({ color: "ink.950", fontSize: "sm", fontWeight: "black" })}>
              {partner ? `${partner.name}님과의 대화` : "HGT 채팅"}
            </p>
            <p
              className={css({
                color: "ink.500",
                fontSize: "xs",
                fontWeight: "bold",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              })}
            >
              {partner ? partnerSummary(partner) : "대화 정보를 불러오는 중입니다."}
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
            <GlassButton href="/conversations" variant="secondary">
              목록
            </GlassButton>
            <GlassButton href="/home" variant="secondary">
              홈
            </GlassButton>
          </div>
        </nav>

        {error && (
          <GlassPanel tone="quiet" className={css({ padding: "4" })}>
            <p className={css({ position: "relative", zIndex: 1, color: "ink.900", fontWeight: "bold" })}>
              {error}
            </p>
          </GlassPanel>
        )}

        {loading ? (
          <GlassPanel className={css({ minHeight: "320px", display: "grid", placeItems: "center" })}>
            <p className={css({ position: "relative", zIndex: 1, color: "ink.700", fontWeight: "bold" })}>
              대화를 불러오는 중입니다.
            </p>
          </GlassPanel>
        ) : partner && me && session ? (
          <div
            className={css({
              display: "grid",
              gridTemplateColumns: { base: "1fr", lg: "minmax(0, 1fr) 320px" },
              gap: "5",
              alignItems: "start",
            })}
          >
            <GlassPanel
              className={css({
                minHeight: { base: "calc(100dvh - 188px)", md: "680px" },
                display: "grid",
                gridTemplateRows: "auto minmax(0, 1fr) auto",
                gap: "4",
                padding: { base: "4", md: "5" },
              })}
            >
              <div
                className={css({
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "3",
                })}
              >
                <div
                  className={css({
                    display: "grid",
                    placeItems: "center",
                    width: "52px",
                    height: "52px",
                    flexShrink: 0,
                    borderRadius: "18px",
                    color: "primary.700",
                    fontSize: "sm",
                    fontWeight: "black",
                    background: "rgba(255,255,255,.52)",
                    border: "1px solid rgba(255,255,255,.72)",
                    boxShadow: "0 14px 26px rgba(255,107,95,.14)",
                  })}
                >
                  {partner.name.slice(0, 1)}
                </div>
                <div className={css({ minWidth: 0 })}>
                  <h1
                    className={css({
                      color: "ink.950",
                      fontSize: { base: "xl", md: "2xl" },
                      fontWeight: "black",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    })}
                  >
                    {partner.name}
                  </h1>
                  <p
                    className={css({
                      color: "ink.500",
                      fontSize: "sm",
                      fontWeight: "bold",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    })}
                  >
                    {partnerSummary(partner)}
                  </p>
                </div>
              </div>

              <div
                className={css({
                  position: "relative",
                  zIndex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "3",
                  paddingRight: { base: "0", md: "2" },
                })}
              >
                {groupedMessages.length ? (
                  groupedMessages.map(({ message, startsNewDay }) => {
                    const mine = message.senderId === me.id;
                    return (
                      <div key={message.id} className={css({ display: "contents" })}>
                        {startsNewDay && (
                          <div className={css({ display: "grid", placeItems: "center", marginY: "1" })}>
                            <span
                              className={css({
                                borderRadius: "capsule",
                                paddingX: "3",
                                paddingY: "1.5",
                                color: "ink.500",
                                fontSize: "xs",
                                fontWeight: "bold",
                                background: "rgba(255,255,255,.38)",
                                border: "1px solid rgba(255,255,255,.58)",
                              })}
                            >
                              {formatMessageDay(message.createdAt)}
                            </span>
                          </div>
                        )}
                        <motion.div
                          className={css({
                            display: "flex",
                            justifyContent: mine ? "flex-end" : "flex-start",
                          })}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18 }}
                        >
                          <div
                            className={css({
                              maxWidth: { base: "86%", md: "70%" },
                              border: "1px solid rgba(255,255,255,.66)",
                              borderRadius: mine ? "22px 22px 8px 22px" : "22px 22px 22px 8px",
                              paddingX: "4",
                              paddingY: "3",
                              color: mine ? "white" : "ink.950",
                              background: mine
                                ? "linear-gradient(135deg, rgba(184,62,58,.94), rgba(255,107,95,.9))"
                                : "rgba(255,255,255,.48)",
                              boxShadow: mine
                                ? "0 16px 30px rgba(255,107,95,.2)"
                                : "0 12px 24px rgba(10,17,24,.08)",
                              overflowWrap: "anywhere",
                            })}
                          >
                            <p className={css({ fontSize: "sm", lineHeight: "1.65", whiteSpace: "pre-wrap" })}>
                              {message.body}
                            </p>
                            <p
                              className={css({
                                marginTop: "1",
                                color: mine ? "rgba(255,255,255,.74)" : "ink.500",
                                fontSize: "xs",
                                fontWeight: "bold",
                                textAlign: "right",
                              })}
                            >
                              {formatChatTime(message.createdAt)}
                              {mine && message.readAt ? " · 읽음" : ""}
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })
                ) : (
                  <div className={css({ display: "grid", placeItems: "center", minHeight: "260px" })}>
                    <p className={css({ color: "ink.500", fontWeight: "bold" })}>
                      아직 메시지가 없습니다. 첫 인사를 건네보세요.
                    </p>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={onSend}
                className={css({
                  position: "relative",
                  zIndex: 1,
                  display: "grid",
                  gridTemplateColumns: { base: "1fr", sm: "minmax(0, 1fr) auto" },
                  gap: "2",
                  alignItems: "end",
                })}
              >
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  maxLength={2000}
                  rows={2}
                  placeholder="메시지를 입력하세요."
                  className={cx(
                    "glass-field",
                    css({
                      minHeight: "56px",
                      maxHeight: "148px",
                      borderRadius: "20px",
                      padding: "4",
                      color: "ink.950",
                      fontSize: "md",
                      resize: "vertical",
                      boxShadow:
                        "0 1px 0 rgba(255,255,255,.78) inset, 0 14px 30px rgba(10,17,24,.08)",
                    }),
                  )}
                />
                <GlassButton type="submit" disabled={sending || !draft.trim()}>
                  {sending ? "전송 중..." : "보내기"}
                </GlassButton>
              </form>
            </GlassPanel>

            <div className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
              <GlassPanel tone="quiet" className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
                <GlassBadge>대화 원칙</GlassBadge>
                <p className={css({ position: "relative", zIndex: 1, color: "ink.700", fontSize: "sm", lineHeight: "1.7" })}>
                  HGT의 대화는 한 사람에게 집중하는 매칭을 전제로 합니다. 불편한 상황이 생기면
                  바로 차단 또는 신고를 사용할 수 있습니다.
                </p>
              </GlassPanel>
              <SafetyActions session={session} partner={partner} />
            </div>
          </div>
        ) : (
          <GlassPanel tone="quiet" className={css({ minHeight: "260px", display: "grid", placeItems: "center" })}>
            <div className={css({ position: "relative", zIndex: 1, textAlign: "center" })}>
              <p className={css({ color: "ink.900", fontWeight: "bold" })}>대화를 찾을 수 없습니다.</p>
              <Link href="/conversations" className={css({ color: "primary.700", fontSize: "sm", fontWeight: "black" })}>
                목록으로 돌아가기
              </Link>
            </div>
          </GlassPanel>
        )}
      </section>
    </main>
  );
}
