import { normalizeArabicText } from "./arabic-normalizer";
import type { WordMapping } from "@/types";

export type MatchResult = {
  mapping: WordMapping;
  matchedVariant: string;
  index: number;
};

type Variant = {
  mapping: WordMapping;
  variant: string;
  norm: string;
};

/**
 * البحث عن الكلمات والعبارات والمرادفات داخل النص.
 * العبارات الأطول تُفحص قبل الكلمات الأقصر لتجنب التطابق الخاطئ.
 */
export function findMatches(
  text: string,
  mappings: WordMapping[]
): MatchResult[] {
  const normalizedText = normalizeArabicText(text);
  if (!normalizedText) return [];

  const variants: Variant[] = [];
  for (const mapping of mappings) {
    if (!mapping.isEnabled) continue;
    const all = [mapping.phrase, ...(mapping.aliases ?? [])];
    for (const variant of all) {
      const norm = normalizeArabicText(variant);
      if (norm) variants.push({ mapping, variant, norm });
    }
  }

  // الأطول أولًا: عدد الكلمات ثم عدد الأحرف
  variants.sort(
    (a, b) =>
      b.norm.split(" ").length - a.norm.split(" ").length ||
      b.norm.length - a.norm.length
  );

  const taken = new Array<boolean>(normalizedText.length).fill(false);
  const results: MatchResult[] = [];
  const matchedIds = new Set<string>();

  for (const v of variants) {
    if (matchedIds.has(v.mapping.id)) continue;

    if (!v.mapping.matchInSentence) {
      // تعمل فقط عند تطابق الجملة كاملة
      if (normalizedText === v.norm && !taken.some(Boolean)) {
        results.push({ mapping: v.mapping, matchedVariant: v.variant, index: 0 });
        matchedIds.add(v.mapping.id);
        taken.fill(true);
      }
      continue;
    }

    let from = 0;
    while (from <= normalizedText.length - v.norm.length) {
      const idx = normalizedText.indexOf(v.norm, from);
      if (idx === -1) break;
      const end = idx + v.norm.length;
      const startOk = idx === 0 || normalizedText[idx - 1] === " ";
      const endOk =
        end === normalizedText.length || normalizedText[end] === " ";
      const overlaps = taken.slice(idx, end).some(Boolean);

      if (startOk && endOk && !overlaps) {
        for (let i = idx; i < end; i++) taken[i] = true;
        results.push({ mapping: v.mapping, matchedVariant: v.variant, index: idx });
        matchedIds.add(v.mapping.id);
        break;
      }
      from = idx + 1;
    }
  }

  results.sort((a, b) => a.index - b.index);
  return results;
}
