"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Conversation, MatchResult, MeProfile, User } from "@hgt-client/contract";
import { css, cx } from "_panda/css";
import {
  GlassBadge,
  GlassButton,
  GlassMetric,
  GlassPanel,
  GlassTextarea,
  GlassTextField,
  GlassToggle,
} from "@/components/ui/glass";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { OfflineBanner, SafetyGuideBanner } from "@/components/ui/status";
import {
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  TERMS_VERSION,
} from "@/content/legal";
import { api, ApiError } from "@/lib/api";
import { clearSession, getSession } from "@/lib/session";

function uniquePartners(conversations: Conversation[], match: MatchResult | null): User[] {
  const map = new Map<string, User>();
  for (const conversation of conversations) {
    map.set(conversation.partner.id, conversation.partner);
  }
  if (match) map.set(match.partner.id, match.partner);
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

function MatchingPausePanel({
  session,
  explore,
  onExploreChange,
}: {
  session: string;
  explore: boolean;
  onExploreChange: (value: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function onRestChange(resting: boolean) {
    const nextExplore = !resting;
    setBusy(true);
    setNotice(null);
    try {
      const profile = await api.updateProfile(session, { explore: nextExplore });
      onExploreChange(profile.explore);
      setNotice(nextExplore ? "이번 주 매칭 참여가 켜졌습니다." : "이번 주 매칭을 쉬도록 설정했습니다.");
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "매칭 참여 설정을 바꾸지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassPanel tone="quiet" className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
      <GlassBadge>Matching Control</GlassBadge>
      <div className={css({ position: "relative", zIndex: 1 })}>
        <h2 className={css({ color: "ink.950", fontSize: "2xl", fontWeight: "black" })}>
          매칭 참여 설정
        </h2>
        <p className={css({ marginTop: "2", color: "ink.700", fontSize: "sm", lineHeight: "1.7" })}>
          지금 진지하게 만날 준비가 아니라면 이번 주 매칭을 쉬어갈 수 있습니다.
        </p>
      </div>
      <GlassToggle
        checked={!explore}
        onChange={onRestChange}
        label="이번 주 쉬기"
        description="켜두면 다음 매칭 라운드에서 잠시 제외됩니다."
      />
      <div className={css({ position: "relative", zIndex: 1, display: "flex", flexWrap: "wrap", gap: "2" })}>
        <GlassButton href="/onboarding" variant="secondary">
          키워드·속성·자기소개 수정
        </GlassButton>
      </div>
      {busy && (
        <p className={css({ position: "relative", zIndex: 1, color: "ink.500", fontSize: "sm", fontWeight: "bold" })}>
          설정을 저장하는 중입니다.
        </p>
      )}
      {notice && (
        <p className={css({ position: "relative", zIndex: 1, color: "ink.900", fontSize: "sm", fontWeight: "bold" })}>
          {notice}
        </p>
      )}
    </GlassPanel>
  );
}

function LegalSettingsPanel({ termsAgreedAt }: { termsAgreedAt: string | null }) {
  const [openDocument, setOpenDocument] = useState<"terms" | "privacy" | null>(null);

  return (
    <GlassPanel tone="quiet" className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
      <GlassBadge>Legal</GlassBadge>
      <div className={css({ position: "relative", zIndex: 1 })}>
        <h2 className={css({ color: "ink.950", fontSize: "2xl", fontWeight: "black" })}>
          약관 및 개인정보
        </h2>
        <p className={css({ marginTop: "2", color: "ink.700", fontSize: "sm", lineHeight: "1.7" })}>
          약관 버전 {TERMS_VERSION} · {termsAgreedAt ? "동의 완료" : "동의가 필요합니다."}
        </p>
      </div>
      <div className={css({ position: "relative", zIndex: 1, display: "flex", flexWrap: "wrap", gap: "2" })}>
        <GlassButton
          type="button"
          variant="secondary"
          onClick={() => setOpenDocument(openDocument === "terms" ? null : "terms")}
        >
          이용약관 보기
        </GlassButton>
        <GlassButton
          type="button"
          variant="secondary"
          onClick={() => setOpenDocument(openDocument === "privacy" ? null : "privacy")}
        >
          개인정보처리방침 보기
        </GlassButton>
        {!termsAgreedAt && (
          <GlassButton href="/onboarding">
            동의하러 가기
          </GlassButton>
        )}
      </div>
      {openDocument && (
        <div
          className={css({
            position: "relative",
            zIndex: 1,
            border: "1px solid rgba(255,255,255,.58)",
            borderRadius: "20px",
            padding: "4",
            background: "rgba(255,255,255,.34)",
          })}
        >
          <LegalDocument markdown={openDocument === "terms" ? TERMS_OF_SERVICE : PRIVACY_POLICY} />
        </div>
      )}
    </GlassPanel>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<string | null>(null);
  const [me, setMe] = useState<MeProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [explore, setExplore] = useState(true);
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
        const [profile, conversationList, currentMatch] = await Promise.all([
          api.getMe(currentSession),
          api.getConversations(currentSession),
          api.getMyMatch(currentSession),
        ]);
        if (!active) return;
        setMe(profile);
        setConversations(conversationList);
        setMatch(currentMatch);
        setExplore(profile.explore);
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

  const partners = uniquePartners(conversations, match);

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
          filter: "blur(15px)",
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
          <div className={css({ position: "relative", zIndex: 1, flexShrink: 0 })}>
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
              display: "grid",
              gridTemplateColumns: { base: "repeat(3, 1fr)", sm: "repeat(3, auto)" },
              gap: "2",
              width: { base: "100%", sm: "auto" },
            })}
          >
            <GlassButton href="/home" variant="secondary" className={css({ paddingX: "4", fontSize: "sm", width: "100%" })}>
              홈
            </GlassButton>
            <GlassButton href="/onboarding" variant="secondary" className={css({ paddingX: "4", fontSize: "sm", width: "100%" })}>
              프로필 수정
            </GlassButton>
            <GlassButton href="/conversations" variant="secondary" className={css({ paddingX: "4", fontSize: "sm", width: "100%" })}>
              대화
            </GlassButton>
          </div>
        </nav>

        <OfflineBanner />

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
                    {me.description && (
                      <div
                        className={css({
                          marginTop: "4",
                          border: "1px solid rgba(255,255,255,.58)",
                          borderRadius: "18px",
                          padding: "4",
                          background: "rgba(255,255,255,.32)",
                          boxShadow: "0 10px 22px rgba(10,17,24,.07)",
                        })}
                      >
                        <p className={css({ color: "ink.900", fontSize: "sm", lineHeight: "1.7", fontWeight: "bold" })}>
                          {me.description}
                        </p>
                      </div>
                    )}
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
                  <GlassMetric value={explore ? "참여 중" : "쉬는 중"} label="매칭 상태" />
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

            <SafetyGuideBanner />

            <section
              className={css({
                display: "grid",
                gridTemplateColumns: { base: "1fr", lg: "1fr 1fr" },
                gap: "5",
                alignItems: "start",
              })}
            >
              <MatchingPausePanel
                session={session}
                explore={explore}
                onExploreChange={(value) => {
                  setExplore(value);
                  setMe((current) => (current ? { ...current, explore: value } : current));
                }}
              />
              <LegalSettingsPanel termsAgreedAt={me.termsAgreedAt} />
            </section>

            <DeleteAccountPanel session={session} />
          </>
        ) : null}
      </section>
    </main>
  );
}
