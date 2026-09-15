import type { MatchResult } from "./phrase-matcher";
import { PRIORITY_RANK, type PlaybackOrder } from "@/types";

export type PlanOptions = {
  maxPerSentence: number;
  order: PlaybackOrder;
  defaultCooldownSeconds: number;
  now?: number;
  cooldownMap?: Map<string, number>;
};

// خريطة آخر تشغيل لكل كلمة (على مستوى الجلسة)
const globalCooldownMap = new Map<string, number>();

export function resetCooldowns(): void {
  globalCooldownMap.clear();
}

/**
 * ترتيب وتصفية الكلمات المكتشفة قبل التشغيل:
 * - كلمات الطوارئ أولًا، ثم العالية، ثم حسب ترتيب الظهور.
 * - منع التكرار خلال مدة Cooldown.
 * - حد أقصى للأنماط من الجملة الواحدة.
 */
export function planPlayback(
  matches: MatchResult[],
  opts: PlanOptions
): MatchResult[] {
  const now = opts.now ?? Date.now();
  const cooldowns = opts.cooldownMap ?? globalCooldownMap;

  const sorted = [...matches];
  if (opts.order === "priority") {
    sorted.sort(
      (a, b) =>
        PRIORITY_RANK[a.mapping.priority] - PRIORITY_RANK[b.mapping.priority] ||
        a.index - b.index
    );
  } else {
    // حتى مع ترتيب الظهور، الطوارئ تتقدم دائمًا
    sorted.sort(
      (a, b) =>
        (a.mapping.priority === "emergency" ? 0 : 1) -
          (b.mapping.priority === "emergency" ? 0 : 1) || a.index - b.index
    );
  }

  const planned: MatchResult[] = [];
  for (const match of sorted) {
    if (planned.length >= opts.maxPerSentence) break;
    const cooldownMs =
      (match.mapping.cooldownSeconds ?? opts.defaultCooldownSeconds) * 1000;
    const last = cooldowns.get(match.mapping.id);
    if (last !== undefined && now - last < cooldownMs) continue;
    cooldowns.set(match.mapping.id, now);
    planned.push(match);
  }

  return planned;
}
