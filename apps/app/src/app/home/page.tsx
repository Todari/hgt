"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Conversation, MatchResult, MeProfile } from "@hgt-client/contract";
import { css, cx } from "_panda/css";
import {
  GlassBadge,
  GlassButton,
  GlassChip,
  GlassMetric,
  GlassPanel,
} from "@/components/ui/glass";
import { OfflineBanner, SafetyGuideBanner } from "@/components/ui/status";
import { api, ApiError } from "@/lib/api";
import { initPush } from "@/lib/push";
import { clearSession, getSession } from "@/lib/session";

function daysUntilNextMonday(): number {
  const today = new Date();
  const day = today.getDay();
  return day === 1 ? 0 : (8 - day) % 7;
}

function formatNextMatchLabel(days: number): string {
  return days === 0 ? "D-day" : `D-${days}`;
}

function formatSharedKeywords(keywords: string[]): string {
  if (keywords.length === 0) return "";
  return `둘 다 ${keywords.slice(0, 3).join("·")} 좋아해요`;
}

function DashboardShell({ children }: { children: React.ReactNode }) {
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
          filter: "blur(15px)",
          transform: "rotate(9deg)",
        })}
        animate={{ x: [16, -16, 16], y: [0, 14, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
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
        {children}
      </div>
    </main>
  );
}

function KeywordGroup({
  label,
  keywords,
}: {
  label: string;
  keywords: MeProfile["selfKeywords"];
}) {
  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "2" })}>
      <p className={css({ color: "ink.500", fontSize: "xs", fontWeight: "black" })}>{label}</p>
      <div className={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>
        {keywords.length ? (
          keywords.map((keyword) => (
            <GlassChip key={keyword.id} selected>
              {keyword.value}
            </GlassChip>
          ))
        ) : (
          <p className={css({ color: "ink.500", fontSize: "sm" })}>아직 선택하지 않았습니다.</p>
        )}
      </div>
    </div>
  );
}

function PushOptInPanel({ session }: { session: string }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function onEnable() {
    setBusy(true);
    setNotice(null);
    try {
      await initPush(session);
      setNotice("알림 설정을 확인했습니다. 매칭과 메시지 알림을 받을 수 있습니다.");
    } catch {
      setNotice("알림 권한을 설정하지 못했습니다. 기기 설정을 확인해주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassPanel
      tone="quiet"
      className={css({
        display: "grid",
        gridTemplateColumns: { base: "1fr", md: "1fr auto" },
        gap: "4",
        alignItems: "center",
        padding: "4",
      })}
    >
      <div className={css({ position: "relative", zIndex: 1 })}>
        <GlassBadge>Push</GlassBadge>
        <p className={css({ marginTop: "3", color: "ink.900", fontWeight: "bold", lineHeight: "1.7" })}>
          매칭 오면 알려드릴까요? 새 매칭과 메시지를 놓치지 않도록 알림을 켤 수 있습니다.
        </p>
        {notice && (
          <p className={css({ marginTop: "2", color: "ink.500", fontSize: "sm", fontWeight: "bold" })}>
            {notice}
          </p>
        )}
      </div>
      <GlassButton type="button" onClick={onEnable} disabled={busy}>
        {busy ? "확인 중..." : "알림 켜기"}
      </GlassButton>
    </GlassPanel>
  );
}

export default function HomeDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<string | null>(null);
  const [me, setMe] = useState<MeProfile | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/signin");
      return;
    }

    setSession(session);
    void (async () => {
      try {
        const [profile, currentMatch, conversationList] = await Promise.all([
          api.getMe(session),
          api.getMyMatch(session),
          api.getConversations(session),
        ]);
        setMe(profile);
        setMatch(currentMatch);
        setConversations(conversationList);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function logout() {
    clearSession();
    router.push("/");
  }

  if (loading) {
    return (
      <DashboardShell>
        <GlassPanel className={css({ minHeight: "280px", display: "grid", placeItems: "center" })}>
          <p className={css({ position: "relative", zIndex: 1, color: "ink.700", fontWeight: "bold" })}>
            매칭 정보를 불러오는 중입니다.
          </p>
        </GlassPanel>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <GlassPanel tone="quiet" className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
          <GlassBadge>오류</GlassBadge>
          <p className={css({ position: "relative", zIndex: 1, color: "ink.900", fontWeight: "bold" })}>
            {error}
          </p>
          <GlassButton href="/signin">다시 인증하기</GlassButton>
        </GlassPanel>
      </DashboardShell>
    );
  }

  if (!me) return null;

  const noKeywords = me.selfKeywords.length === 0 && me.idealKeywords.length === 0;
  const matchConversation = match
    ? conversations.find((conversation) => conversation.partner.id === match.partner.id)
    : null;
  const nextMatchDays = daysUntilNextMonday();
  const nextMatchLabel = formatNextMatchLabel(nextMatchDays);
  const sharedReason = match ? formatSharedKeywords(match.sharedKeywords) : "";

  return (
    <DashboardShell>
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
          <p className={css({ color: "ink.950", fontSize: "sm", fontWeight: "black" })}>HGT</p>
          <p className={css({ color: "ink.500", fontSize: "xs", fontWeight: "bold" })}>
            한 사람에게 집중하는 AI 매칭
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
          <GlassButton href="/onboarding" variant="secondary">
            프로필 수정
          </GlassButton>
          <GlassButton href="/settings" variant="secondary">
            설정
          </GlassButton>
          <GlassButton type="button" variant="secondary" onClick={logout}>
            로그아웃
          </GlassButton>
        </div>
      </nav>

      <OfflineBanner />

      {me.termsAgreedAt == null && (
        <GlassPanel
          tone="strong"
          className={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", md: "1fr auto" },
            gap: "4",
            alignItems: "center",
          })}
        >
          <div className={css({ position: "relative", zIndex: 1 })}>
            <h2 className={css({ color: "ink.950", fontSize: "xl", fontWeight: "black" })}>
              약관 동의가 필요합니다.
            </h2>
            <p className={css({ marginTop: "1", color: "ink.700", lineHeight: "1.7" })}>
              매칭과 채팅을 계속 사용하려면 이용약관과 개인정보처리방침에 동의해주세요.
            </p>
          </div>
          <GlassButton href="/onboarding">동의하러 가기</GlassButton>
        </GlassPanel>
      )}

      <header
        className={css({
          display: "grid",
          gridTemplateColumns: { base: "1fr", lg: ".95fr 1.05fr" },
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
            minHeight: "360px",
          })}
        >
          <div className="liquid-sheen" aria-hidden />
          <div className={css({ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "4" })}>
            <GlassBadge>인증된 캠퍼스 프로필</GlassBadge>
            <div>
              <h1
                className={css({
                  color: "ink.950",
                  fontSize: { base: "3xl", md: "5xl" },
                  lineHeight: "1.06",
                  fontWeight: "black",
                })}
              >
                {me.name}님, 이번 주 매칭을 확인해보세요.
              </h1>
              <p
                className={css({
                  marginTop: "3",
                  color: "ink.700",
                  fontSize: { base: "md", md: "lg" },
                  lineHeight: "1.7",
                  maxWidth: "560px",
                })}
              >
                HGT는 많은 선택지를 보여주기보다, 인증된 상대 한 사람을 진지하게 볼 수
                있게 설계합니다.
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
            <GlassMetric value={nextMatchLabel} label="다음 매칭" />
          </div>
        </GlassPanel>

        <GlassPanel
          tone="quiet"
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "4",
            minHeight: "360px",
          })}
        >
          <div className={css({ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", gap: "4" })}>
            <div>
              <p className={css({ color: "ink.500", fontSize: "sm", fontWeight: "bold" })}>
                이번 주 한 사람
              </p>
              <h2 className={css({ marginTop: "1", color: "ink.950", fontSize: "3xl", fontWeight: "black" })}>
                {match ? match.partner.name : "준비 중"}
              </h2>
            </div>
            <div
              className={css({
                display: "grid",
                placeItems: "center",
                width: "68px",
                height: "68px",
                flexShrink: 0,
                borderRadius: "50%",
                color: "primary.700",
                fontSize: "xs",
                fontWeight: "black",
                background: "rgba(255,255,255,.52)",
                border: "1px solid rgba(255,255,255,.72)",
                boxShadow: "0 16px 30px rgba(255,107,95,.16)",
              })}
            >
              AI
            </div>
          </div>

          {match ? (
            <div className={css({ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "4" })}>
              <p className={css({ color: "ink.700", lineHeight: "1.7" })}>
                {match.partner.major} · {match.partner.age}세 ·{" "}
                {match.partner.gender ? "남" : "여"}
              </p>
              <div className={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>
                <GlassChip selected>매칭 점수 {match.score}</GlassChip>
                <GlassChip selected>{match.weekStart} 주차</GlassChip>
              </div>
              {sharedReason && (
                <div
                  className={css({
                    border: "1px solid rgba(255,255,255,.58)",
                    borderRadius: "18px",
                    padding: "4",
                    background: "rgba(255,255,255,.32)",
                    boxShadow: "0 10px 22px rgba(10,17,24,.07)",
                  })}
                >
                  <p className={css({ color: "ink.900", fontSize: "sm", lineHeight: "1.7", fontWeight: "black" })}>
                    {sharedReason}
                  </p>
                </div>
              )}
              {match.partner.description && (
                <div
                  className={css({
                    border: "1px solid rgba(255,255,255,.58)",
                    borderRadius: "18px",
                    padding: "4",
                    background: "rgba(255,255,255,.32)",
                    boxShadow: "0 10px 22px rgba(10,17,24,.07)",
                  })}
                >
                  <p className={css({ color: "ink.900", fontSize: "sm", lineHeight: "1.7", fontWeight: "bold" })}>
                    {match.partner.description}
                  </p>
                </div>
              )}
              <div
                className={css({
                  border: "1px solid rgba(255,255,255,.58)",
                  borderRadius: "18px",
                  padding: "4",
                  background: "rgba(255,255,255,.32)",
                  boxShadow: "0 10px 22px rgba(10,17,24,.07)",
                })}
              >
                <p className={css({ color: "ink.900", fontSize: "sm", lineHeight: "1.7", fontWeight: "bold" })}>
                  사진이나 소개글보다, 서로의 프로필 키워드와 매칭 참여 설정을 기준으로
                  추천된 상대입니다.
                </p>
              </div>
              <div className={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>
                <GlassButton href={matchConversation ? `/conversations/${matchConversation.id}` : "/conversations"}>
                  채팅방으로 이동
                </GlassButton>
                <GlassButton href="/conversations" variant="secondary">
                  대화 목록
                </GlassButton>
              </div>
            </div>
          ) : (
            <div className={css({ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "4" })}>
              <GlassChip selected>다음 매칭까지 {nextMatchLabel}</GlassChip>
              <p className={css({ color: "ink.700", lineHeight: "1.7", fontWeight: "bold" })}>
                아직 이번 주 매칭이 없습니다. 다음 월요일에 프로필 신호를 다시 살펴보고,
                한 사람에게 집중할 수 있는 매칭을 준비합니다.
              </p>
              <GlassButton href="/onboarding" variant="secondary">
                프로필 보강하기
              </GlassButton>
            </div>
          )}
        </GlassPanel>
      </header>

      {session && <PushOptInPanel session={session} />}

      <SafetyGuideBanner />

      {noKeywords && (
        <GlassPanel
          tone="strong"
          className={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", md: "1fr auto" },
            gap: "4",
            alignItems: "center",
          })}
        >
          <div className={css({ position: "relative", zIndex: 1 })}>
            <h2 className={css({ color: "ink.950", fontSize: "xl", fontWeight: "black" })}>
              AI가 볼 수 있는 궁합 신호가 아직 없습니다.
            </h2>
            <p className={css({ marginTop: "1", color: "ink.700", lineHeight: "1.7" })}>
              나를 설명하는 키워드와 만나고 싶은 사람의 기준을 선택하면 매칭이 시작됩니다.
            </p>
          </div>
          <GlassButton href="/onboarding">프로필 설정하기</GlassButton>
        </GlassPanel>
      )}

      <section
        className={css({
          display: "grid",
          gridTemplateColumns: { base: "1fr", lg: "1fr 1fr" },
          gap: "5",
        })}
      >
        <GlassPanel tone="quiet" className={css({ display: "flex", flexDirection: "column", gap: "5" })}>
          <GlassBadge>내 매칭 신호</GlassBadge>
          <KeywordGroup label="나를 설명하는 키워드" keywords={me.selfKeywords} />
          <KeywordGroup label="기대하는 상대 키워드" keywords={me.idealKeywords} />
        </GlassPanel>

        <GlassPanel tone="quiet" className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
          <GlassBadge>매칭 설정</GlassBadge>
          <div className={css({ position: "relative", zIndex: 1, display: "grid", gap: "3" })}>
            <GlassMetric value={me.explore ? "참여 중" : "쉬는 중"} label="이번 주 매칭" />
            <GlassMetric value={me.canCc ? "허용" : "제외"} label="같은 과 매칭" />
            <GlassMetric
              value={
                me.targetMinAge || me.targetMaxAge
                  ? `${me.targetMinAge ?? "?"}-${me.targetMaxAge ?? "?"}세`
                  : "열림"
              }
              label="선호 나이"
            />
          </div>
        </GlassPanel>
      </section>
    </DashboardShell>
  );
}
