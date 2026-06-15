"use client";

import { useState } from "react";
import Link from "next/link";
import type { MeProfile } from "@hgt-client/contract";
import { css, cx } from "_panda/css";
import { GlassToggle } from "@/components/ui/glass";
import { api, ApiError } from "@/lib/api";

function CheckMark({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={cx(
        css({
          display: "grid",
          placeItems: "center",
          width: "28px",
          height: "28px",
          flexShrink: 0,
          borderRadius: "50%",
          fontWeight: "black",
        }),
        done
          ? css({ background: "primary.600", color: "white" })
          : css({ background: "primary.50", border: "1px solid", borderColor: "primary.100", color: "primary.300" }),
      )}
    >
      {done ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="m5 12 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <span className={css({ width: "8px", height: "8px", borderRadius: "50%", background: "currentColor" })} />
      )}
    </span>
  );
}

const rowBase = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  width: "100%",
  textAlign: "left",
  borderRadius: "16px",
  padding: "3",
  minHeight: "60px",
  background: "primary.50",
  border: "1px solid",
  borderColor: "primary.100",
});

function ChecklistRow({
  done,
  title,
  hint,
  href,
}: {
  done: boolean;
  title: string;
  hint: string;
  href?: string;
}) {
  const body = (
    <>
      <CheckMark done={done} />
      <span className={css({ display: "flex", flexDirection: "column", gap: "0.5", minWidth: 0, flex: 1 })}>
        <span className={css({ color: "ink.950", fontSize: "sm", fontWeight: "black" })}>{title}</span>
        <span className={css({ color: "ink.500", fontSize: "xs", lineHeight: "1.5" })}>{hint}</span>
      </span>
      {!done && href && (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className={css({ flexShrink: 0, color: "primary.600" })}>
          <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </>
  );

  if (href && !done) {
    return (
      <Link href={href} className={cx(rowBase, css({ transition: "transform 160ms ease", _active: { transform: "scale(0.99)" } }))}>
        {body}
      </Link>
    );
  }

  return <div className={rowBase}>{body}</div>;
}

/**
 * First-run activation: shown when the user has never been matched. Reflects
 * live profile state (terms / self keywords / ideal keywords / explore) and
 * routes each unfinished step to /onboarding. The explore step is an inline
 * toggle — flipping it persists via api.updateProfile and updates the cached
 * profile so the row resolves immediately.
 */
export function ActivationChecklist({
  session,
  me,
  onProfileChange,
}: {
  session: string;
  me: MeProfile;
  onProfileChange: (next: MeProfile) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const termsDone = me.termsAgreedAt != null;
  const selfDone = me.selfKeywords.length > 0;
  const idealDone = me.idealKeywords.length > 0;
  const exploreDone = me.explore;
  const total = 4;
  const completed = [termsDone, selfDone, idealDone, exploreDone].filter(Boolean).length;

  async function onToggleExplore(next: boolean) {
    setBusy(true);
    setError(null);
    try {
      const profile = await api.updateProfile(session, { explore: next });
      onProfileChange({ ...me, ...profile });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "설정을 바꾸지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className={css({
        borderRadius: "vessel",
        padding: "5",
        background: "surface.card",
        border: "1px solid",
        borderColor: "surface.hairline",
        boxShadow: "cardSoft",
        display: "flex",
        flexDirection: "column",
        gap: "4",
      })}
    >
      <div className={css({ display: "flex", flexDirection: "column", gap: "1" })}>
        <h2 className={css({ color: "ink.950", fontSize: "20px", fontWeight: "black", lineHeight: "1.3" })}>
          매칭을 시작할 준비를 해요
        </h2>
        <p className={css({ color: "ink.500", fontSize: "sm", lineHeight: "1.7" })}>
          매주 월요일 저녁 7시, 단 한 사람을 소개해요. 아래 네 가지를 마치면 다음 라운드에 참여돼요.
        </p>
      </div>

      <div className={css({ display: "flex", alignItems: "center", gap: "2" })}>
        <div className={css({ flex: 1, height: "8px", borderRadius: "capsule", background: "primary.50", overflow: "hidden" })}>
          <div
            className={css({ height: "100%", borderRadius: "capsule", background: "primary.600", transition: "width 240ms ease" })}
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
        <span className={css({ color: "primary.700", fontSize: "xs", fontWeight: "black" })}>
          {completed}/{total}
        </span>
      </div>

      <div className={css({ display: "flex", flexDirection: "column", gap: "2" })}>
        <ChecklistRow
          done={termsDone}
          title="약관 동의"
          hint={termsDone ? "동의 완료" : "이용약관·개인정보처리방침에 동의해요"}
          href="/onboarding"
        />
        <ChecklistRow
          done={selfDone}
          title="나를 표현하는 키워드"
          hint={selfDone ? `${me.selfKeywords.length}개 선택함` : "나를 설명하는 키워드를 골라요"}
          href="/onboarding"
        />
        <ChecklistRow
          done={idealDone}
          title="원하는 상대 키워드"
          hint={idealDone ? `${me.idealKeywords.length}개 선택함` : "만나고 싶은 사람의 기준을 골라요"}
          href="/onboarding"
        />

        {/* explore = inline toggle (no /onboarding round-trip). The switch
            itself conveys done/todo state, so no leading CheckMark here. */}
        <div className={css({ borderRadius: "16px", overflow: "hidden" })}>
          <GlassToggle
            checked={exploreDone}
            onChange={onToggleExplore}
            label="매칭 참여 켜기"
            description={exploreDone ? "이번 주 매칭에 참여 중이에요" : "켜면 다음 라운드부터 소개를 받아요"}
          />
        </div>
      </div>

      {busy && (
        <p className={css({ color: "ink.500", fontSize: "xs", fontWeight: "bold" })}>저장하는 중...</p>
      )}
      {error && (
        <p className={css({ color: "primary.700", fontSize: "xs", fontWeight: "bold" })}>{error}</p>
      )}
    </section>
  );
}
