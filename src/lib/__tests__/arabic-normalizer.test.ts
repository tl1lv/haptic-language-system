import { describe, it, expect } from "vitest";
import { normalizeArabicText } from "../arabic-normalizer";

describe("normalizeArabicText - تنظيف النص العربي", () => {
  it("يوحد أشكال الألف", () => {
    expect(normalizeArabicText("أحمد")).toBe("احمد");
    expect(normalizeArabicText("إبراهيم")).toBe("ابراهيم");
    expect(normalizeArabicText("آمنة")).toBe("امنه".replace("ه", "ة"));
  });

  it("يحول ى إلى ي", () => {
    expect(normalizeArabicText("مستشفى")).toBe("مستشفي");
  });

  it("يزيل التشكيل", () => {
    expect(normalizeArabicText("اِنْتَبِهْ")).toBe("انتبه");
  });

  it("يزيل التطويل", () => {
    expect(normalizeArabicText("خطـــــر")).toBe("خطر");
  });

  it("يزيل علامات الترقيم", () => {
    expect(normalizeArabicText("انتبه، يوجد خطر!")).toBe("انتبه يوجد خطر");
    expect(normalizeArabicText("هل سمعت؟")).toBe("هل سمعت");
  });

  it("يوحد المسافات المتكررة", () => {
    expect(normalizeArabicText("  سيارة    خلفك  ")).toBe("سيارة خلفك");
  });

  it("يتعامل مع النص الفارغ", () => {
    expect(normalizeArabicText("")).toBe("");
    expect(normalizeArabicText("   ")).toBe("");
  });
});
