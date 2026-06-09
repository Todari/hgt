"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Conversation, MeProfile, User } from "@hgt-client/contract";
import { css, cx } from "_panda/css";
import {
  GlassBadge,
  GlassButton,
  GlassMetric,
  GlassPanel,
  GlassTextarea,
  GlassTextField,
} from "@/components/ui/glass";
import { api, ApiError } from "@/lib/api";
import { clearSession, getSession } from "@/lib/session";

function uniquePartners(conversations: Conversation[]): User[] {
  const map = new Map<string, User>();
  for (const conversation of conversations) {
    map.set(conversation.partner.id, conversation.partner);
  }
  return [...map.values()];
}

function PartnerSafetyRow({
  session,
  partner,
}: {
  session: string;
  partner: User;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"block" | "report" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onBlock() {
    const confirmed = window.confirm(
      `${partner.name}님을 차단하시겠어요? 차단 후 이 상대와의 매칭과 대화가 제한됩니다.`,
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
      setReportOpen(false);
      setNotice("신고가 접수되었습니다.");
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "신고에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className={css({
        position: "relative",
        zIndex: 1,
        border: "1px solid rgba(255,255,255,.58)",
        borderRadius: "20px",
        padding: "4",
        background: "rgba(255,255,255,.34)",
        boxShadow: "0 12px 26px rgba(10,17,24,.07)",
        display: "flex",
        flexDirection: "column",
        gap: "3",
      })}
    >
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: { base: "1fr", md: "minmax(0, 1fr) auto" },
          gap: "3",
          alignItems: "center",
        })}
      >
        <div className={css({ minWidth: 0 })}>
          <h3
            className={css({
              color: "ink.950",
              fontSize: "lg",
              fontWeight: "black",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            })}
          >
            {partner.name}
          </h3>
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
            {partner.major} · {partner.age}세 · {partner.gender ? "남" : "여"}
          </p>
        </div>
        <div className={css({ display: "flex", flexWrap: "wrap", justifyContent: { md: "flex-end" }, gap: "2" })}>
          <GlassButton type="button" variant="secondary" onClick={() => setReportOpen((value) => !value)} disabled={busy != null}>
            신고
          </GlassButton>
          <GlassButton type="button" variant="secondary" onClick={onBlock} disabled={busy != null}>
            {busy === "block" ? "차단 중..." : "차단"}
          </GlassButton>
        </div>
      </div>

      {reportOpen && (
        <div className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
          <GlassTextarea
            label="신고 사유"
            placeholder="불편했던 상황을 적어주세요."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={1000}
          />
          <GlassButton type="button" onClick={onReport} disabled={busy != null}>
            {busy === "report" ? "신고 중..." : "신고 접수"}
          </GlassButton>
        </div>
      )}

      {notice && (
        <p className={css({ color: "ink.900", fontSize: "sm", fontWeight: "bold" })}>
          {notice}
        </p>
      )}
    </div>
  );
}

function DeleteAccountPanel({ session }: { session: string }) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const canDelete = confirmText.trim() === "회원탈퇴";

  async function onDelete() {
    if (!canDelete) {
      setNotice("회원탈퇴를 입력해야 탈퇴할 수 있습니다.");
      return;
    }

    const confirmed = window.confirm(
      "정말 회원탈퇴를 진행하시겠어요? 계정, 매칭, 대화 기록은 되돌릴 수 없습니다.",
    );
    if (!confirmed) return;

    setBusy(true);
    setNotice(null);
    try {
      await api.deleteAccount(session);
      clearSession();
      router.replace("/");
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "회원탈퇴에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassPanel tone="quiet" className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
      <GlassBadge>되돌릴 수 없는 작업</GlassBadge>
      <div className={css({ position: "relative", zIndex: 1 })}>
        <h2 className={css({ color: "ink.950", fontSize: "2xl", fontWeight: "black" })}>
          회원탈퇴
        </h2>
        <p className={css({ marginTop: "2", color: "ink.700", fontSize: "sm", lineHeight: "1.7" })}>
          탈퇴하면 계정, 매칭, 대화 기록이 삭제되며 복구할 수 없습니다. 계속하려면 아래에
          회원탈퇴를 입력해주세요.
        </p>
      </div>
      <GlassTextField
        label="확인 문구"
        placeholder="회원탈퇴"
        value={confirmText}
        onChange={(event) => setConfirmText(event.target.value)}
      />
      <div className={css({ position: "relative", zIndex: 1 })}>
        <GlassButton type="button" onClick={onDelete} disabled={!canDelete || busy}>
          {busy ? "탈퇴 처리 중..." : "회원탈퇴 진행"}
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

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<string | null>(null);
  const [me, setMe] = useState<MeProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const [profile, conversationList] = await Promise.all([
          api.getMe(currentSession),
          api.getConversations(currentSession),
        ]);
        if (!active) return;
        setMe(profile);
        setConversations(conversationList);
      } catch (err) {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "설정을 불러오지 못했습니다.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);

  const partners = uniquePartners(conversations);

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
          top: "6%",
          right: "-18%",
          width: "88%",
          height: "36%",
          background:
            "linear-gradient(108deg, transparent, rgba(255,107,95,.15) 34%, rgba(255,107,95,.08), transparent)",
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
              HGT 설정
            </p>
            <p className={css({ color: "ink.500", fontSize: "xs", fontWeight: "bold" })}>
              프로필과 안전 설정 관리
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
            <GlassButton href="/onboarding" variant="secondary">
              프로필 수정
            </GlassButton>
            <GlassButton href="/conversations" variant="secondary">
              대화
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
          <GlassPanel className={css({ minHeight: "280px", display: "grid", placeItems: "center" })}>
            <p className={css({ position: "relative", zIndex: 1, color: "ink.700", fontWeight: "bold" })}>
              설정을 불러오는 중입니다.
            </p>
          </GlassPanel>
        ) : me && session ? (
          <>
            <header
              className={css({
                display: "grid",
                gridTemplateColumns: { base: "1fr", lg: ".92fr 1.08fr" },
                gap: "5",
                alignItems: "stretch",
              })}
            >
              <GlassPanel
                className={css({
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "6",
                  minHeight: "320px",
                })}
              >
                <div className="liquid-sheen" aria-hidden />
                <div className={css({ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "4" })}>
                  <GlassBadge>Verified Profile</GlassBadge>
                  <div>
                    <h1
                      className={css({
                        color: "ink.950",
                        fontSize: { base: "3xl", md: "5xl" },
                        lineHeight: "1.06",
                        fontWeight: "black",
                      })}
                    >
                      {me.name}님의 계정 설정
                    </h1>
                    <p className={css({ marginTop: "3", color: "ink.700", fontSize: { base: "md", md: "lg" }, lineHeight: "1.7" })}>
                      프로필은 인증 기반으로 유지하고, 불편한 상대와는 즉시 거리를 둘 수 있습니다.
                    </p>
                  </div>
                </div>
                <div
                  className={css({
                    position: "relative",
                    zIndex: 1,
                    display: "grid",
                    gridTemplateColumns: { base: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                    gap: "3",
                  })}
                >
                  <GlassMetric value={me.major} label="학과" />
                  <GlassMetric value={`${me.age}세`} label="나이" />
                  <GlassMetric value={me.academicStatus ?? "인증됨"} label="학적 상태" />
                </div>
              </GlassPanel>

              <GlassPanel tone="quiet" className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
                <GlassBadge>Safety</GlassBadge>
                <div className={css({ position: "relative", zIndex: 1 })}>
                  <h2 className={css({ color: "ink.950", fontSize: "2xl", fontWeight: "black" })}>
                    상대 차단 및 신고
                  </h2>
                  <p className={css({ marginTop: "2", color: "ink.700", fontSize: "sm", lineHeight: "1.7" })}>
                    대화를 나눈 상대를 기준으로 안전 조치를 실행할 수 있습니다. 신고 내용은 운영 검토에 사용됩니다.
                  </p>
                </div>
                <div className={css({ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "3" })}>
                  {partners.length ? (
                    partners.map((partner) => (
                      <PartnerSafetyRow key={partner.id} session={session} partner={partner} />
                    ))
                  ) : (
                    <p className={css({ color: "ink.500", fontSize: "sm", lineHeight: "1.7" })}>
                      아직 안전 조치를 적용할 대화 상대가 없습니다.
                    </p>
                  )}
                </div>
              </GlassPanel>
            </header>

            <DeleteAccountPanel session={session} />
          </>
        ) : null}
      </section>
    </main>
  );
}
