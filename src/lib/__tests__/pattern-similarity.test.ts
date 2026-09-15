import { describe, it, expect } from "vitest";
import { patternSimilarity, findSimilarPatterns } from "../pattern-similarity";
import type { HapticStep, WordMapping } from "@/types";

function steps(...list: Array<[string, number, number]>): HapticStep[] {
  return list.map(([type, durationMs, intensity], i) => ({
    id: `s-${i}`,
    type: type as "vibrate" | "pause",
    durationMs,
    intensity,
  }));
}

describe("patternSimilarity - مقارنة تشابه نمطين", () => {
  it("النمط المطابق تمامًا = 100", () => {
    const a = steps(["vibrate", 100, 70], ["pause", 100, 0], ["vibrate", 100, 70]);
    const b = steps(["vibrate", 100, 70], ["pause", 100, 0], ["vibrate", 100, 70]);
    expect(patternSimilarity(a, b)).toBe(100);
  });

  it("النمطان المختلفان تمامًا يعطيان نسبة منخفضة", () => {
    const a = steps(["vibrate", 100, 70]);
    const b = steps(
      ["vibrate", 500, 100],
      ["pause", 200, 0],
      ["vibrate", 500, 100],
      ["pause", 200, 0],
      ["vibrate", 500, 100]
    );
    expect(patternSimilarity(a, b)).toBeLessThan(40);
  });

  it("النمطان المتقاربان يعطيان نسبة مرتفعة", () => {
    const a = steps(["vibrate", 100, 70], ["pause", 100, 0], ["vibrate", 100, 70]);
    const b = steps(["vibrate", 120, 65], ["pause", 110, 0], ["vibrate", 110, 75]);
    expect(patternSimilarity(a, b)).toBeGreaterThan(80);
  });

  it("النمط الفارغ مقابل نمط موجود = 0", () => {
    expect(patternSimilarity([], steps(["vibrate", 100, 70]))).toBe(0);
  });

  it("findSimilarPatterns يستثني الكلمة نفسها ويرتب تنازليًا", () => {
    const pattern = steps(["vibrate", 100, 70]);
    const mk = (id: string, p: HapticStep[]): WordMapping => ({
      id,
      phrase: id,
      aliases: [],
      category: "custom",
      priority: "normal",
      pattern: p,
      repeatCount: 1,
      cooldownSeconds: 5,
      matchInSentence: true,
      channel: "both",
      isEnabled: true,
      detectionCount: 0,
      createdAt: "",
      updatedAt: "",
    });
    const mappings = [
      mk("self", pattern),
      mk("close", steps(["vibrate", 110, 72])),
      mk("far", steps(["vibrate", 900, 10], ["pause", 500, 0], ["vibrate", 900, 10])),
    ];
    const similar = findSimilarPatterns(pattern, mappings, "self", 75);
    expect(similar.find((s) => s.mapping.id === "self")).toBeUndefined();
    expect(similar[0]?.mapping.id).toBe("close");
    expect(similar.find((s) => s.mapping.id === "far")).toBeUndefined();
  });
});
