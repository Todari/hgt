"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BlockedUser, MeProfile } from "@hgt-client/contract";
import { css } from "_panda/css";
import { AppShell } from "@/components/shell/AppShell";
import { Ambient } from "@/components/ui/Ambient";
import { OfflineBanner } from "@/components/ui/status";
import { LegalDocument } from "@/components/legal/LegalDocument";
import {
  SettingsButtonRow,
  SettingsInfoRow,
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from "@/components/settings/SettingsList";
import { PRIVACY_POLICY, TERMS_OF_SERVICE, TERMS_VERSION } from "@/content/legal";
import { api, ApiError } from "@/lib/api";
import {
  disablePush,
  enablePush,
  getStoredPushToken,
  isNativePushAvailable,
} from "@/lib/push";
import { clearSession, getSession } from "@/lib/session";

/** Inline feedback line shared by the toggle/account sections. */
function Notice({ tone, children }: { tone: "info" | "error"; children: string }) {
  return (
    <p
      role={tone === "error" ? "alert" : undefined}
      className={css({
        paddingX: "4",
        color: tone === "error" ? "primary.700" : "ink.500",
        fontSize: "xs",
        fontWeight: "bold",
        lineHeight: "1.6",
      })}
    >
      {children}
    </p>
  );
}

function MatchingSection({
  session,
  me,
  onChange,
}: {
  session: string;
  me: MeProfile;
  onChange: (patch: Partial<MeProfile>) => void;
}) {
  const [busy, setBusy] = useState<"explore" | "canCc" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function update(field: "explore" | "canCc", value: boolean) {
    setBusy(field);
    setNotice(null);
    try {
      const next = await api.updateProfile(session, { [field]: value });
      onChange({ explore: next.explore, canCc: next.canCc });
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "설정을 바꾸지 못했어요.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <SettingsSection
      title="매칭"
      footer="매칭 참여를 끄면 다음 라운드에서 잠시 제외돼요. 언제든 다시 켤 수 있어요."
    >
      <SettingsToggleRow
        label="매칭 참여"
        description="매주 월요일 저녁, 새로운 상대와 연결돼요."
        checked={me.explore}
        onChange={(value) => void update("explore", value)}
        disabled={busy != null}
      />
      <SettingsToggleRow
        label="같은 과 매칭 허용"
        description="같은 학과 상대와도 매칭될 수 있어요."
        checked={me.canCc}
        onChange={(value) => void update("canCc", value)}
        disabled={busy != null}
      />
      {notice && <Notice tone="error">{notice}</Notice>}
    </SettingsSection>
  );
}

function NotificationSection({ session }: { session: string }) {
  const [enabled, setEnabled] = useState(() => getStoredPushToken() != null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function onToggle(next: boolean) {
    setBusy(true);
    setNotice(null);
    try {
      if (next) {
        const ok = await enablePush(session);
        setEnabled(ok);
        setNotice(
          ok
            ? "알림을 켰어요. 새 매칭과 메시지를 알려드릴게요."
            : "알림을 켜지 못했어요. 기기 설정에서 알림 권한을 확인해주세요.",
        );
      } else {
        await disablePush();
        setEnabled(false);
        setNotice("알림을 껐어요.");
      }
    } catch {
      setNotice("알림 설정을 바꾸지 못했어요. 기기 설정을 확인해주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsSection
      title="알림"
      footer="새 매칭과 메시지가 도착하면 기기 알림으로 알려드려요."
    >
      <SettingsToggleRow
        label="푸시 알림"
        description={busy ? "확인하는 중이에요." : "매칭·메시지 알림 받기"}
        checked={enabled}
        onChange={(value) => void onToggle(value)}
        disabled={busy}
      />
      {notice && <Notice tone="info">{notice}</Notice>}
    </SettingsSection>
  );
}

function BlockedSection({ session }: { session: string }) {
  const [blocked, setBlocked] = useState<BlockedUser[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const rows = await api.getBlocks(session);
        if (active) setBlocked(rows);
      } catch {
        if (active) setBlocked([]); // treat a load failure as "none" — non-critical
      }
    })();
    return () => {
      active = false;
    };
  }, [session]);

  // Hide the whole section until we know there's something to manage.
  if (!blocked || blocked.length === 0) return null;

  async function unblock(userId: string) {
    setBusyId(userId);
    setNotice(null);
    try {
      await api.unblockUser(session, userId);
      setBlocked((curr) => (curr ? curr.filter((b) => b.userId !== userId) : curr));
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "차단을 해제하지 못했어요.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SettingsSection title="차단한 사용자" footer="차단을 해제하면 다시 매칭·대화가 가능해져요.">
      {blocked.map((b) => (
        <SettingsButtonRow
          key={b.userId}
          label={b.name}
          onClick={() => void unblock(b.userId)}
          disabled={busyId != null}
          trailing={
            <span className={css({ color: busyId === b.userId ? "ink.500" : "primary.700", fontSize: "sm", fontWeight: "bold" })}>
              {busyId === b.userId ? "해제 중..." : "차단 해제"}
            </span>
          }
        />
      ))}
      {notice && <Notice tone="error">{notice}</Notice>}
    </SettingsSection>
  );
}

function LegalSection({ termsAgreedAt }: { termsAgreedAt: string | null }) {
  const [open, setOpen] = useState<"terms" | "privacy" | null>(null);

  return (
    <SettingsSection
      title="약관"
      footer={`약관 버전 ${TERMS_VERSION} · ${termsAgreedAt ? "동의 완료" : "동의 필요"}`}
    >
      <SettingsButtonRow
        label="이용약관"
        onClick={() => setOpen((value) => (value === "terms" ? null : "terms"))}
      />
      <SettingsButtonRow
        label="개인정보처리방침"
        onClick={() => setOpen((value) => (value === "privacy" ? null : "privacy"))}
      />
      {open && (
        <div className={css({ padding: "4", background: "rgba(10,17,24,.02)" })}>
          <LegalDocument markdown={open === "terms" ? TERMS_OF_SERVICE : PRIVACY_POLICY} />
        </div>
      )}
    </SettingsSection>
  );
}

function AccountSection({ session }: { session: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"logout" | "delete" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function clearAndLeave() {
    // Best-effort device-token cleanup so the backend stops pushing here.
    await disablePush();
    clearSession();
    router.replace("/signin");
  }

  async function onLogout() {
    setBusy("logout");
    setNotice(null);
    try {
      try {
        await api.logout(session, getStoredPushToken() ?? undefined);
      } catch {
        /* session may already be dead — proceed with local logout */
      }
      await clearAndLeave();
    } finally {
      setBusy(null);
    }
  }

  async function onDelete() {
    // Two-step: an explicit confirm dialog, then a type-to-confirm prompt.
    const confirmed = window.confirm(
      "회원 탈퇴하면 계정·매칭·대화 기록이 모두 삭제되고 되돌릴 수 없어요. 계속하시겠어요?",
    );
    if (!confirmed) return;

    const typed = window.prompt('탈퇴를 진행하려면 "탈퇴"라고 입력해주세요.');
    if (typed?.trim() !== "탈퇴") {
      if (typed != null) setNotice("입력이 일치하지 않아 탈퇴를 취소했어요.");
      return;
    }

    setBusy("delete");
    setNotice(null);
    try {
      await api.deleteAccount(session);
      await clearAndLeave();
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "회원 탈퇴에 실패했어요.");
      setBusy(null);
    }
  }

  return (
    <SettingsSection title="계정">
      <SettingsButtonRow
        label="로그아웃"
        onClick={() => void onLogout()}
        disabled={busy != null}
        trailing={
          busy === "logout" ? (
            <span className={css({ color: "ink.500", fontSize: "sm" })}>처리 중...</span>
          ) : undefined
        }
      />
      <SettingsButtonRow
        label="회원 탈퇴"
        description="계정과 모든 기록을 영구 삭제해요."
        danger
        onClick={() => void onDelete()}
        disabled={busy != null}
        trailing={
          busy === "delete" ? (
            <span className={css({ color: "primary.700", fontSize: "sm" })}>처리 중...</span>
          ) : undefined
        }
      />
      {notice && <Notice tone="error">{notice}</Notice>}
    </SettingsSection>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<string | null>(null);
  const [me, setMe] = useState<MeProfile | null>(null);
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
        const profile = await api.getMe(currentSession);
        if (!active) return;
        setMe(profile);
      } catch (err) {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "설정을 불러오지 못했어요.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <>
      <Ambient />
      <AppShell>
        <div
          className={css({
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "5",
          })}
        >
          <header className={css({ minHeight: "44px", paddingX: "1", paddingTop: "2" })}>
            <h1 className={css({ color: "ink.950", fontSize: "2xl", fontWeight: "black" })}>설정</h1>
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
              })}
            >
              <p className={css({ color: "primary.900", fontSize: "sm", fontWeight: "bold", lineHeight: "1.6" })}>
                {error}
              </p>
            </div>
          )}

          {loading ? (
            <p className={css({ paddingX: "1", color: "ink.500", fontSize: "sm", fontWeight: "bold" })}>
              설정을 불러오는 중이에요.
            </p>
          ) : me && session ? (
            <div className={css({ display: "flex", flexDirection: "column", gap: "5" })}>
              <SettingsSection title="프로필">
                <SettingsInfoRow
                  label={me.name}
                  description={`${me.major} · ${me.age}세`}
                />
                <SettingsLinkRow
                  href="/onboarding"
                  label="프로필 수정"
                  description="키워드·자기소개·선호 조건을 바꿔요."
                />
              </SettingsSection>

              <MatchingSection
                session={session}
                me={me}
                onChange={(patch) => setMe((current) => (current ? { ...current, ...patch } : current))}
              />

              {isNativePushAvailable() && <NotificationSection session={session} />}

              <SettingsSection title="안전">
                <SettingsLinkRow
                  href="/safety"
                  label="안전 가이드"
                  description="안전하게 만나기 위한 기본 수칙을 확인해요."
                />
              </SettingsSection>

              <BlockedSection session={session} />

              <LegalSection termsAgreedAt={me.termsAgreedAt} />

              <AccountSection session={session} />
            </div>
          ) : null}
        </div>
      </AppShell>
    </>
  );
}
