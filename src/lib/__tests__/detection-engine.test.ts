import { describe, it, expect } from "vitest";
import { planPlayback } from "../detection-engine";
import type { MatchResult } from "../phrase-matcher";
import type { Priority, WordMapping } from "@/types";

let counter = 0;
function makeMatch(
  phrase: string,
  priority: Priority,
  index: number,
  cooldownSeconds = 5
): MatchResult {
  counter++;
  const mapping: WordMapping = {
    id: `w-${counter}`,
    phrase,
    aliases: [],
    category: "custom",
    priority,
    pattern: [{ id: "s1", type: "vibrate", durationMs: 100, intensity: 70 }],
    repeatCount: 1,
    cooldownSeconds,
    matchInSentence: true,
    channel: "both",
    isEnabled: true,
    detectionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return { mapping, matchedVariant: phrase, index };
}

const baseOpts = {
  maxPerSentence: 3,
  order: "priority" as const,
  defaultCooldownSeconds: 5,
};

describe("planPlayback - ترتيب الأحداث", () => {
  it("يرتب الكلمات حسب الأولوية: الطوارئ أولًا", () => {
    const matches = [
      makeMatch("تعال", "normal", 0),
      makeMatch("خطر", "emergency", 10),
      makeMatch("انتبه", "high", 5),
    ];
    const planned = planPlayback(matches, {
      ...baseOpts,
      cooldownMap: new Map(),
    });
    expect(planned.map((p) => p.mapping.phrase)).toEqual([
      "خطر",
      "انتبه",
      "تعال",
    ]);
  });

  it("لا يشغّل أكثر من الحد الأقصى من جملة واحدة", () => {
    const matches = [
      makeMatch("ا", "normal", 0),
      makeMatch("ب", "normal", 1),
      makeMatch("ج", "normal", 2),
      makeMatch("د", "normal", 3),
    ];
    const planned = planPlayback(matches, {
      ...baseOpts,
      cooldownMap: new Map(),
    });
    expect(planned).toHaveLength(3);
  });

  it("يمنع تكرار الكلمة خلال مدة Cooldown", () => {
    const cooldownMap = new Map<string, number>();
    const match = makeMatch("انتبه", "high", 0, 10);
    const first = planPlayback([match], {
      ...baseOpts,
      cooldownMap,
      now: 1000,
    });
    expect(first).toHaveLength(1);

    const second = planPlayback([match], {
      ...baseOpts,
      cooldownMap,
      now: 5000, // بعد 4 ثوانٍ فقط من أصل 10
    });
    expect(second).toHaveLength(0);

    const third = planPlayback([match], {
      ...baseOpts,
      cooldownMap,
      now: 12000, // بعد انتهاء المدة
    });
    expect(third).toHaveLength(1);
  });

  it("مع ترتيب الظهور تبقى الطوارئ أولًا", () => {
    const matches = [
      makeMatch("تعال", "normal", 0),
      makeMatch("خطر", "emergency", 20),
      makeMatch("يمين", "normal", 10),
    ];
    const planned = planPlayback(matches, {
      ...baseOpts,
      order: "appearance",
      cooldownMap: new Map(),
    });
    expect(planned.map((p) => p.mapping.phrase)).toEqual([
      "خطر",
      "تعال",
      "يمين",
    ]);
  });
});
