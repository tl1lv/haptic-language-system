import type { HapticStep, WordMapping } from "@/types";

/**
 * حساب نسبة التشابه بين نمطين (0 - 100).
 * تعتمد على: عدد الخطوات، نوع كل خطوة، المدة، والشدة.
 */
export function patternSimilarity(a: HapticStep[], b: HapticStep[]): number {
  if (a.length === 0 && b.length === 0) return 100;
  if (a.length === 0 || b.length === 0) return 0;

  const n = Math.max(a.length, b.length);
  let total = 0;

  for (let i = 0; i < n; i++) {
    const sa = a[i];
    const sb = b[i];
    if (!sa || !sb) continue; // خطوة ناقصة = صفر تشابه لهذه الخطوة

    let score = 0;
    if (sa.type === sb.type) score += 0.5;

    const maxDur = Math.max(sa.durationMs, sb.durationMs, 1);
    const durCloseness = 1 - Math.abs(sa.durationMs - sb.durationMs) / maxDur;
    score += 0.3 * Math.max(0, durCloseness);

    if (sa.type === "vibrate" && sb.type === "vibrate") {
      const intCloseness = 1 - Math.abs(sa.intensity - sb.intensity) / 100;
      score += 0.2 * Math.max(0, intCloseness);
    } else if (sa.type === "pause" && sb.type === "pause") {
      score += 0.2;
    }

    total += score;
  }

  return Math.round((total / n) * 100);
}

export type SimilarPattern = {
  mapping: WordMapping;
  score: number;
};

export const SIMILARITY_WARNING_THRESHOLD = 75;

/**
 * إيجاد الأنماط المحفوظة المشابهة لنمط معيّن.
 */
export function findSimilarPatterns(
  pattern: HapticStep[],
  mappings: WordMapping[],
  excludeId?: string,
  threshold: number = SIMILARITY_WARNING_THRESHOLD
): SimilarPattern[] {
  const results: SimilarPattern[] = [];
  for (const mapping of mappings) {
    if (excludeId && mapping.id === excludeId) continue;
    if (!mapping.pattern.length) continue;
    const score = patternSimilarity(pattern, mapping.pattern);
    if (score >= threshold) results.push({ mapping, score });
  }
  results.sort((a, b) => b.score - a.score);
  return results;
}
