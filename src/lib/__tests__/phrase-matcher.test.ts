import { describe, it, expect } from "vitest";
import { findMatches } from "../phrase-matcher";
import type { WordMapping } from "@/types";

let counter = 0;
function makeWord(partial: Partial<WordMapping> & { phrase: string }): WordMapping {
  counter++;
  return {
    id: `w-${counter}`,
    aliases: [],
    category: "custom",
    priority: "normal",
    pattern: [{ id: "s1", type: "vibrate", durationMs: 100, intensity: 70 }],
    repeatCount: 1,
    cooldownSeconds: 5,
    matchInSentence: true,
    channel: "both",
    isEnabled: true,
    detectionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

describe("findMatches - اكتشاف الكلمات", () => {
  it("يكتشف كلمة داخل جملة", () => {
    const words = [makeWord({ phrase: "انتبه" })];
    const matches = findMatches("يا صديقي انتبه من فضلك", words);
    expect(matches).toHaveLength(1);
    expect(matches[0].mapping.phrase).toBe("انتبه");
  });

  it("يكتشف المرادفات", () => {
    const words = [makeWord({ phrase: "انتبه", aliases: ["احذر", "دير بالك"] })];
    const matches = findMatches("احذر من السيارة", words);
    expect(matches).toHaveLength(1);
    expect(matches[0].matchedVariant).toBe("احذر");
  });

  it("يقدّم العبارة الأطول على الكلمة الأقصر", () => {
    const words = [
      makeWord({ phrase: "سيارة" }),
      makeWord({ phrase: "سيارة خلفك" }),
    ];
    const matches = findMatches("انتبه توجد سيارة خلفك الآن", words);
    expect(matches).toHaveLength(1);
    expect(matches[0].mapping.phrase).toBe("سيارة خلفك");
  });

  it("يطابق بعد تطبيع النص (همزات وتشكيل)", () => {
    const words = [makeWord({ phrase: "انتبه" })];
    const matches = findMatches("اِنْتَبِهْ!", words);
    expect(matches).toHaveLength(1);
  });

  it("لا يطابق جزءًا من كلمة أطول", () => {
    const words = [makeWord({ phrase: "خطر" })];
    const matches = findMatches("هذا الخطران قادمان", words);
    expect(matches).toHaveLength(0);
  });

  it("يتجاهل الكلمات المعطلة", () => {
    const words = [makeWord({ phrase: "خطر", isEnabled: false })];
    expect(findMatches("يوجد خطر", words)).toHaveLength(0);
  });

  it("يحترم خيار عدم الاكتشاف داخل جملة", () => {
    const words = [makeWord({ phrase: "تعال", matchInSentence: false })];
    expect(findMatches("تعال هنا بسرعة", words)).toHaveLength(0);
    expect(findMatches("تعال", words)).toHaveLength(1);
  });

  it("يكتشف عدة كلمات في جملة واحدة ويرتبها حسب الظهور", () => {
    const words = [
      makeWord({ phrase: "عادل" }),
      makeWord({ phrase: "انتبه" }),
      makeWord({ phrase: "سيارة خلفك" }),
    ];
    const matches = findMatches("يا عادل انتبه توجد سيارة خلفك", words);
    expect(matches.map((m) => m.mapping.phrase)).toEqual([
      "عادل",
      "انتبه",
      "سيارة خلفك",
    ]);
  });
});
