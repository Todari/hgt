"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Conversation, MeProfile, MyMatchResponse } from "@hgt-client/contract";
import { css } from "_panda/css";
import { AppShell } from "@/components/shell/AppShell";
import { Ambient } from "@/components/ui/Ambient";
import { OfflineBanner } from "@/components/ui/status";
import { ActivationChecklist } from "@/components/home/ActivationChecklist";
import { GreetingHeader } from "@/components/home/GreetingHeader";
import { HomePushPanel } from "@/components/home/HomePushPanel";
import { MatchHeroCard } from "@/components/home/MatchHeroCard";
import { MatchWaitingCard } from "@/components/home/MatchWaitingCard";
import { PreviousMatchCard } from "@/components/home/PreviousMatchCard";
import { api, ApiError, connectRealtime } from "@/lib/api";
import { isNativePushAvailable } from "@/lib/push";
import { getSession } from "@/lib/session";

function TrustFooter() {
  return (
    <p
      className={css({
        color: "ink.300",
        fontSize: "11px",
        fontWeight: "bold",
        textAlign: "center",
        lineHeight: "1.7",
        paddingX: "4",
      })}
    >
      모든 상대는 홍익대 포털 인증을 거친 재학·휴학생이에요.
    </p>
  );
}

function StatePanel({ children }: { children: React.ReactNode }) {
  return (
    <section
      className={css({
        minHeight: "240px",
        display: "grid",
        placeItems: "center",
        borderRadius: "vessel",
        padding: "6",
        background: "surface.card",
        border: "1px solid",
        borderColor: "surface.hairline",
        boxShadow: "cardSoft",
        textAlign: "center",
      })}
    >
      {children}
    </section>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<string | null>(null);
  const [me, setMe] = useState<MeProfile | null>(null);
  const [match, setMatch] = useState<MyMatchResponse | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (activeSession: string) => {
    const [profile, matchData, conversationList] = await Promise.all([
      api.getMe(activeSession),
      api.getMyMatch(activeSession),
      api.getConversations(activeSession),
    ]);
    setMe(profile);
    setMatch(matchData);
    setConversations(conversationList);
  }, []);

  useEffect(() => {
    const activeSession = getSession();
    if (!activeSession) {
      router.replace("/signin");
      return;
    }
    setSession(activeSession);

    let alive = true;
    void (async () => {
      try {
        await loadData(activeSession);
      } catch (err) {
        if (alive) setError(err instanceof ApiError ? err.message : "불러오지 못했어요.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, loadData]);

  // Realtime: a new match arrives mid-session → refetch so the hero card
  // re-keys (by roundId) and replays its reveal. Reconnects also refetch in
  // case the match landed while the socket was down.
  useEffect(() => {
    if (!session) return;
    const conn = connectRealtime(
      session,
      (event) => {
        if (event.type === "match") void loadData(session).catch(() => undefined);
      },
      { onReconnect: () => void loadData(session).catch(() => undefined) },
    );
    return () => conn.close();
  }, [session, loadData]);

  const unreadDot = conversations.some((c) => c.unreadCount > 0);

  // current is null between Monday 00:00 and the 19:00 KST reveal — that's the
  // normal "finding your match" state, distinct from "never matched".
  const current = match?.current ?? null;
  const previous = match?.previous ?? null;
  const everMatched = current != null || previous != null;

  return (
    <>
      <Ambient />
      <div className={css({ position: "relative", zIndex: 1 })}>
        <AppShell unreadDot={unreadDot}>
          <div className={css({ display: "flex", flexDirection: "column", gap: "5" })}>
            {me && <GreetingHeader name={me.name} />}

            <OfflineBanner />

            {loading ? (
              <StatePanel>
                <p className={css({ color: "ink.500", fontSize: "sm", fontWeight: "bold" })}>
                  이번 주 인연을 불러오는 중이에요.
                </p>
              </StatePanel>
            ) : error ? (
              <StatePanel>
                <div className={css({ display: "flex", flexDirection: "column", gap: "3", alignItems: "center" })}>
                  <p className={css({ color: "ink.700", fontSize: "sm", fontWeight: "bold", lineHeight: "1.7" })}>
                    {error}
                  </p>
                  <button
                    type="button"
                    onClick={() => router.refresh()}
                    className={css({
                      minHeight: "44px",
                      paddingX: "5",
                      borderRadius: "capsule",
                      background: "primary.600",
                      color: "white",
                      fontSize: "sm",
                      fontWeight: "black",
                    })}
                  >
                    다시 시도
                  </button>
                </div>
              </StatePanel>
            ) : me && session ? (
              <>
                {/* STATE A — this week's match is in. Hero reveal. */}
                {current ? (
                  <MatchHeroCard key={current.roundId} match={current} />
                ) : everMatched ? (
                  /* STATE B — waiting for this week + recap of last week. */
                  <>
                    <MatchWaitingCard />
                    {previous && (
                      <div className={css({ display: "flex", flexDirection: "column", gap: "2" })}>
                        <p className={css({ color: "ink.500", fontSize: "xs", fontWeight: "black", paddingLeft: "1" })}>
                          지난주의 인연
                        </p>
                        <PreviousMatchCard match={previous} />
                      </div>
                    )}
                  </>
                ) : (
                  /* STATE C — never matched. Activation checklist. */
                  <ActivationChecklist session={session} me={me} onProfileChange={setMe} />
                )}

                {/* Native-only push opt-in — never on web. */}
                {isNativePushAvailable() && <HomePushPanel session={session} />}

                <TrustFooter />
              </>
            ) : null}
          </div>
        </AppShell>
      </div>
    </>
  );
}
