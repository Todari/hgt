"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Keyword, Property } from "@hgt-client/contract";
import { css } from "_panda/css";
import { OfflineBanner } from "@/components/ui/status";
import {
  WizardChrome,
  WizardGhostButton,
  WizardPrimaryButton,
} from "@/components/onboarding/WizardChrome";
import { StepTerms } from "@/components/onboarding/StepTerms";
import { StepKeywords } from "@/components/onboarding/StepKeywords";
import { StepBasics, type BasicsState } from "@/components/onboarding/StepBasics";
import { clearDraft, loadDraft, saveDraft } from "@/components/onboarding/draft";
import { api, ApiError } from "@/lib/api";
import { getSession } from "@/lib/session";

const STEPS = [
  { label: "약관 동의" },
  { label: "나를 표현하는 키워드" },
  { label: "원하는 상대 키워드" },
  { label: "기본 정보" },
];

const STEP_TITLES: ReadonlyArray<{ title: string; subtitle: string }> = [
  {
    title: "약관에 동의해주세요",
    subtitle: "안전한 매칭을 위해 꼭 필요한 동의예요.",
  },
  {
    title: "나를 표현하는 키워드",
    subtitle: "고른 키워드로 생활 방식과 대화 성향이 잘 맞는 사람을 찾아요.",
  },
  {
    title: "원하는 상대 키워드",
    subtitle: "사진보다 함께 있을 때의 온도와 리듬을 기준으로 골라주세요.",
  },
  {
    title: "기본 정보",
    subtitle: "매칭에 도움이 되는 신호예요. 편한 만큼만 채워주세요.",
  },
];

const EMPTY_BASICS: BasicsState = {
  heightId: null,
  smokeId: null,
  religionId: null,
  mbtiId: null,
  army: null,
  description: "",
  minAge: "",
  maxAge: "",
  canCc: false,
};

export default function OnboardingPage() {
  const router = useRouter();

  const [session, setSession] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [gender, setGender] = useState(false); // true = 남 (from verified profile)
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  // edit mode = terms already agreed (server stamped termsAgreedAt)
  const [alreadyAgreed, setAlreadyAgreed] = useState(false);

  const [step, setStep] = useState(0);

  // consent
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [sensitiveAccepted, setSensitiveAccepted] = useState(false);

  // keywords
  const [self, setSelf] = useState<Set<string>>(new Set());
  const [ideal, setIdeal] = useState<Set<string>>(new Set());

  // basics
  const [basics, setBasics] = useState<BasicsState>(EMPTY_BASICS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const hydrated = useRef(false);

  /* ----------------------------- data load ----------------------------- */
  useEffect(() => {
    const current = getSession();
    if (!current) {
      router.replace("/signin");
      return;
    }
    setSession(current);

    void (async () => {
      try {
        const [keywordList, propertyList, profile] = await Promise.all([
          api.getKeywords(current),
          api.listProperties(current),
          api.getMe(current),
        ]);
        setKeywords(keywordList);
        setProperties(propertyList);
        setUserId(profile.id);
        setGender(profile.gender);

        const agreed = profile.termsAgreedAt != null;
        setAlreadyAgreed(agreed);

        // server profile is the base; a same-session draft overrides it
        const baseSelf = new Set(profile.selfKeywords.map((k) => k.id));
        const baseIdeal = new Set(profile.idealKeywords.map((k) => k.id));
        const baseBasics: BasicsState = {
          heightId: profile.heightId,
          smokeId: profile.smokeId,
          religionId: profile.religionId,
          mbtiId: profile.mbtiId,
          army: profile.army,
          description: profile.description ?? "",
          minAge: profile.targetMinAge != null ? String(profile.targetMinAge) : "",
          maxAge: profile.targetMaxAge != null ? String(profile.targetMaxAge) : "",
          canCc: profile.canCc,
        };

        const draft = loadDraft(profile.id);
        if (draft) {
          setTermsAccepted(agreed || draft.termsAccepted);
          setPrivacyAccepted(agreed || draft.privacyAccepted);
          setSensitiveAccepted(draft.sensitiveAccepted || profile.religionId != null);
          setSelf(new Set(draft.selfKeywordIds));
          setIdeal(new Set(draft.idealKeywordIds));
          setBasics({
            heightId: draft.heightId,
            smokeId: draft.smokeId,
            religionId: draft.religionId,
            mbtiId: draft.mbtiId,
            army: draft.army,
            description: draft.description,
            minAge: draft.minAge,
            maxAge: draft.maxAge,
            canCc: draft.canCc,
          });
          setStep(Math.min(Math.max(draft.step, agreed ? 0 : 0), STEPS.length - 1));
        } else {
          setTermsAccepted(agreed);
          setPrivacyAccepted(agreed);
          // religion already set implies prior sensitive consent
          setSensitiveAccepted(profile.religionId != null);
          setSelf(baseSelf);
          setIdeal(baseIdeal);
          setBasics(baseBasics);
          // edit mode lands on keywords; fresh mode starts at terms
          setStep(agreed ? 1 : 0);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "프로필을 불러오지 못했어요.");
      } finally {
        hydrated.current = true;
        setLoading(false);
      }
    })();
  }, [router]);

  /* --------------------------- draft persist --------------------------- */
  useEffect(() => {
    if (!hydrated.current || !userId) return;
    saveDraft({
      userId,
      step,
      termsAccepted,
      privacyAccepted,
      sensitiveAccepted,
      selfKeywordIds: [...self],
      idealKeywordIds: [...ideal],
      heightId: basics.heightId,
      smokeId: basics.smokeId,
      religionId: basics.religionId,
      mbtiId: basics.mbtiId,
      army: basics.army,
      description: basics.description,
      minAge: basics.minAge,
      maxAge: basics.maxAge,
      canCc: basics.canCc,
    });
  }, [
    userId,
    step,
    termsAccepted,
    privacyAccepted,
    sensitiveAccepted,
    self,
    ideal,
    basics,
  ]);

  /* ----------------------- history / back handling ---------------------- */
  // Internal step state is the source of truth; we mirror it into history so
  // the hardware/browser back button steps back through the wizard instead of
  // leaving the flow. A history entry is pushed on every forward move.
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPop = (e: PopStateEvent) => {
      const target = (e.state as { hgtStep?: number } | null)?.hgtStep;
      if (typeof target === "number") {
        setStep(Math.min(Math.max(target, 0), STEPS.length - 1));
      } else if (stepRef.current > 0) {
        // No state (e.g. arrived from elsewhere): step back internally.
        setStep((s) => Math.max(0, s - 1));
      }
    };
    // seed the current entry so the first back has somewhere to land
    window.history.replaceState({ hgtStep: stepRef.current }, "");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goToStep = useCallback((next: number, viaHistory: boolean) => {
    setStep(next);
    if (viaHistory && typeof window !== "undefined") {
      window.history.pushState({ hgtStep: next }, "");
    }
  }, []);

  /* ------------------------------ validation --------------------------- */
  const termsOk = termsAccepted && privacyAccepted;
  const selfOk = self.size >= 1;
  const idealOk = ideal.size >= 1;

  const ageError = useMemo(() => {
    const min = basics.minAge ? Number(basics.minAge) : null;
    const max = basics.maxAge ? Number(basics.maxAge) : null;
    const inRange = (n: number | null) => n == null || (n >= 18 && n <= 99);
    if (!inRange(min) || !inRange(max)) return "나이는 18세부터 99세 사이로 입력해주세요.";
    if (min != null && max != null && min > max)
      return "최소 나이는 최대 나이보다 클 수 없어요.";
    return null;
  }, [basics.minAge, basics.maxAge]);

  const basicsOk = ageError == null;

  const stepValid = [termsOk, selfOk, idealOk, basicsOk][step] ?? false;

  // Which steps the user may jump to via the dots. Edit mode = all four (terms
  // shown as completed). Fresh mode = up to the furthest validated step.
  const reachable = useCallback(
    (index: number) => {
      if (alreadyAgreed) return true;
      if (index <= step) return true;
      // can only move forward one step at a time, gated by current validity
      return index === step + 1 && Boolean(stepValid);
    },
    [alreadyAgreed, step, stepValid],
  );

  /* -------------------------------- save ------------------------------- */
  const onComplete = useCallback(async () => {
    if (!session) return;
    if (!termsOk) {
      goToStep(0, true);
      setError("필수 약관에 모두 동의해주세요.");
      return;
    }
    if (!selfOk || !idealOk) {
      setError("키워드를 각각 1개 이상 선택해주세요.");
      return;
    }
    if (ageError) {
      setError(ageError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.updateProfile(session, {
        selfKeywordIds: [...self],
        idealKeywordIds: [...ideal],
        description: basics.description.trim() || null,
        army: basics.army,
        canCc: basics.canCc,
        targetMinAge: basics.minAge ? Number(basics.minAge) : null,
        targetMaxAge: basics.maxAge ? Number(basics.maxAge) : null,
        heightId: basics.heightId,
        smokeId: basics.smokeId,
        // drop religion if the sensitive consent was withdrawn
        religionId: sensitiveAccepted ? basics.religionId : null,
        mbtiId: basics.mbtiId,
        // record 민감정보(종교) consent server-side (개인정보보호법 제23조) so the
        // server can store religionId; without this the server rejects religion.
        agreedToSensitive: sensitiveAccepted ? true : undefined,
        // stamp terms only on first agreement; server auto-sets explore=true then
        agreedToTerms: alreadyAgreed ? undefined : true,
      });
      clearDraft();
      if (alreadyAgreed) {
        router.replace("/home");
      } else {
        // first-time: surface the auto-join notice briefly, then go home
        setSavedNotice(true);
        window.setTimeout(() => router.replace("/home"), 1600);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장에 실패했어요.");
      setSaving(false);
    }
  }, [
    session,
    termsOk,
    selfOk,
    idealOk,
    ageError,
    self,
    ideal,
    basics,
    sensitiveAccepted,
    alreadyAgreed,
    router,
    goToStep,
  ]);

  /* ------------------------------- render ------------------------------ */
  if (loading) {
    return (
      <main
        className={css({
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "6",
        })}
      >
        <p className={css({ color: "ink.500", fontSize: "sm", fontWeight: "bold" })}>
          프로필을 불러오는 중이에요.
        </p>
      </main>
    );
  }

  if (savedNotice) {
    return (
      <main
        className={css({
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "6",
          textAlign: "center",
        })}
      >
        <div className={css({ maxWidth: "300px", display: "flex", flexDirection: "column", gap: "3" })}>
          <span
            className={css({
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              marginX: "auto",
              borderRadius: "capsule",
              background: "linear-gradient(135deg, #ff7a6b, #d0463c)",
              boxShadow: "0 12px 28px rgba(255,107,95,.3)",
            })}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <h1 className={css({ color: "ink.950", fontSize: "xl", fontWeight: "black" })}>
            프로필이 저장됐어요
          </h1>
          <p className={css({ color: "ink.500", fontSize: "sm", lineHeight: "1.6" })}>
            매칭 풀에 자동으로 참여됐어요. 설정에서 끌 수 있어요.
          </p>
        </div>
      </main>
    );
  }

  const meta = STEP_TITLES[step] ?? { title: "", subtitle: "" };
  const onBack = step > 0 && reachable(step - 1) ? () => goToStep(step - 1, true) : null;
  const isLastStep = step === STEPS.length - 1;
  const ctaLabel = isLastStep
    ? saving
      ? "저장 중…"
      : alreadyAgreed
        ? "저장"
        : "완료"
    : "다음";

  return (
    <WizardChrome
      steps={STEPS}
      current={step}
      title={meta.title}
      subtitle={meta.subtitle}
      reachable={reachable}
      onJump={(i) => goToStep(i, true)}
      onBack={onBack}
      footer={
        <>
          {step > 0 && (
            <WizardGhostButton onClick={() => onBack?.()}>이전</WizardGhostButton>
          )}
          <WizardPrimaryButton
            disabled={!stepValid || saving}
            onClick={() => (isLastStep ? void onComplete() : goToStep(step + 1, true))}
          >
            {ctaLabel}
          </WizardPrimaryButton>
        </>
      }
    >
      <div className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
        <OfflineBanner />

        {step === 0 && (
          <StepTerms
            termsAccepted={termsAccepted}
            privacyAccepted={privacyAccepted}
            sensitiveAccepted={sensitiveAccepted}
            alreadyAgreed={alreadyAgreed}
            onTerms={setTermsAccepted}
            onPrivacy={setPrivacyAccepted}
            onSensitive={setSensitiveAccepted}
          />
        )}

        {step === 1 && (
          <StepKeywords
            keywords={keywords}
            selected={self}
            onToggle={(id) => {
              setSelf((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            }}
          />
        )}

        {step === 2 && (
          <StepKeywords
            keywords={keywords}
            selected={ideal}
            onToggle={(id) => {
              setIdeal((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            }}
          />
        )}

        {step === 3 && (
          <StepBasics
            properties={properties}
            state={basics}
            sensitiveAccepted={sensitiveAccepted}
            gender={gender}
            onChange={(key, value) => setBasics((prev) => ({ ...prev, [key]: value }))}
          />
        )}

        {error && (
          <p
            className={css({
              color: "primary.700",
              fontSize: "sm",
              fontWeight: "bold",
              lineHeight: "1.55",
            })}
          >
            {error}
          </p>
        )}
        {step === 3 && ageError && !error && (
          <p
            className={css({
              color: "primary.700",
              fontSize: "sm",
              fontWeight: "bold",
              lineHeight: "1.55",
            })}
          >
            {ageError}
          </p>
        )}
      </div>
    </WizardChrome>
  );
}
