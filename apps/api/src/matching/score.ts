/**
 * Keyword-based compatibility scoring (no AI).
 *
 * The score function is intentionally small and pure so it can be swapped for an
 * embedding-based one later without touching the engine or the assignment step.
 */

export type ScoredKeyword = { value: string; category: string };

export type Candidate = {
  id: string;
  name: string;
  gender: boolean; // true = 남
  age: number;
  major: string;
  canCc: boolean;
  targetMinAge: number | null;
  targetMaxAge: number | null;
  self: ScoredKeyword[];
  ideal: ScoredKeyword[];
};

/** How well `self` satisfies someone's `ideal`: exact keyword = 1.0, same category = 0.3. */
export function directionalScore(ideal: ScoredKeyword[], self: ScoredKeyword[]): number {
  if (ideal.length === 0 || self.length === 0) return 0;
  const selfValues = new Set(self.map((k) => k.value));
  const selfCategories = new Set(self.map((k) => k.category));
  let score = 0;
  for (const k of ideal) {
    if (selfValues.has(k.value)) score += 1.0;
    else if (selfCategories.has(k.category)) score += 0.3;
  }
  return score;
}

function ageBonus(age: number, min: number | null, max: number | null): number {
  if (min == null && max == null) return 0; // no preference set → neutral
  if (min != null && age < min) return 0;
  if (max != null && age > max) return 0;
  return 0.5;
}

/**
 * Symmetric pair score. Returns 0 (= "do not match") when a hard constraint
 * forbids the pair: a past match, or a same-major pair where either disallows CC.
 */
export function pairScore(a: Candidate, b: Candidate, opts: { pastMatch: boolean }): number {
  if (opts.pastMatch) return 0;
  if ((!a.canCc || !b.canCc) && a.major === b.major) return 0;

  const keywordScore = directionalScore(a.ideal, b.self) + directionalScore(b.ideal, a.self);
  if (keywordScore <= 0) return 0; // no common ground → not a match

  return keywordScore + ageBonus(b.age, a.targetMinAge, a.targetMaxAge) + ageBonus(a.age, b.targetMinAge, b.targetMaxAge);
}
