/**
 * sessionStorage draft for the onboarding wizard — selections survive an
 * accidental back/refresh within the same browser session. Keyed to the user
 * id so a different account never inherits someone else's draft. Cleared on
 * successful save.
 */

const DRAFT_KEY = "hgt_onboarding_draft_v1";

export type OnboardingDraft = {
  userId: string;
  step: number;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  sensitiveAccepted: boolean;
  selfKeywordIds: string[];
  idealKeywordIds: string[];
  heightId: string | null;
  smokeId: string | null;
  religionId: string | null;
  mbtiId: string | null;
  army: boolean | null;
  description: string;
  minAge: string;
  maxAge: string;
  canCc: boolean;
};

export function loadDraft(userId: string): OnboardingDraft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingDraft;
    if (parsed.userId !== userId) return null;
    return parsed;
  } catch {
    return null; // corrupt JSON / storage unavailable → behave as no draft
  }
}

export function saveDraft(draft: OnboardingDraft): void {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* storage full or unavailable — drafts are best-effort */
  }
}

export function clearDraft(): void {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
