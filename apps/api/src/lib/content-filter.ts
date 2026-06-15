/**
 * Chat content filter: Korean profanity / sexual-harassment wordlist plus
 * personal-info patterns (phone numbers, 주민등록번호). Matching is done on a
 * "compact" copy of the text — lowercased with whitespace and common filler
 * punctuation stripped — so trivial evasion like "씨 발" or "씨.발" is caught.
 *
 * Deliberately conservative: an entry should be unambiguous enough that a
 * normal conversation never trips it (e.g. "존나" is excluded as everyday
 * slang). False negatives are handled by user reports, not by widening this
 * list with risky entries.
 */

// Starter set (~30 entries) — OPS OWNS CURATION of this list. Extend/trim
// freely; entries are matched as substrings against the compacted message,
// so multi-word phrases must be written without spaces.
const BLOCKED_WORDS: readonly string[] = [
  // 욕설
  "씨발",
  "시발",
  "씨팔",
  "씨바",
  "ㅆㅂ",
  "병신",
  "븅신",
  "지랄",
  "좆",
  "개새끼",
  "개색기",
  "새끼야",
  "미친놈",
  "미친년",
  "또라이",
  "걸레",
  "창녀",
  "니애미",
  "애미뒤진",
  "한남충",
  "김치녀",
  // 성희롱
  "강간",
  "섹스",
  "섹파",
  "원나잇",
  "조건만남",
  "야동",
  "자위",
  "가슴만지",
  "벗은사진",
  "속옷사진",
  "야한사진",
  "성관계",
];

// Personal info — tested against the compacted (separator-free) text so
// "010-1234-5678", "010 1234 5678" and "01012345678" all reduce to one form.
const PHONE_RE = /01[016789]\d{7,8}/; // Korean mobile numbers
const INTL_PHONE_RE = /\+?82(0?1[016789])\d{7,8}/; // +82 international form
const RRN_RE = /\d{6}[1-4]\d{6}/; // 주민등록번호 (YYMMDD-#######)

/** Strip whitespace and common evasion separators, lowercase the rest. */
function compact(text: string): string {
  return text.toLowerCase().replace(/[\s.,_\-*~^|/\\]/g, "");
}

/** True if the message contains profanity/harassment or personal info. */
export function containsBlockedContent(text: string): boolean {
  const c = compact(text);
  if (BLOCKED_WORDS.some((w) => c.includes(w))) return true;
  return PHONE_RE.test(c) || INTL_PHONE_RE.test(c) || RRN_RE.test(c);
}
