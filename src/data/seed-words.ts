import type { WordMapping } from "@/types";
import { vibrate, pause } from "@/lib/presets";
import { uid } from "@/lib/id";

function makeWord(
  input: Omit<
    WordMapping,
    "id" | "detectionCount" | "createdAt" | "updatedAt"
  >
): WordMapping {
  const now = new Date().toISOString();
  return {
    ...input,
    id: uid(),
    detectionCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildSeedWords(): WordMapping[] {
  return [
    makeWord({
      phrase: "عادل",
      aliases: [],
      description: "اسم المستخدم — ثلاث نبضات قصيرة",
      category: "names",
      priority: "high",
      pattern: [
        vibrate(110, 75),
        pause(110),
        vibrate(110, 75),
        pause(110),
        vibrate(110, 75),
      ],
      repeatCount: 1,
      cooldownSeconds: 8,
      matchInSentence: true,
      channel: "top",
      isEnabled: true,
    }),
    makeWord({
      phrase: "انتبه",
      aliases: ["احذر", "دير بالك"],
      description: "تنبيه عام — قصير، قصير، طويل",
      category: "danger",
      priority: "high",
      pattern: [
        vibrate(120, 70),
        pause(130),
        vibrate(120, 70),
        pause(130),
        vibrate(450, 90),
      ],
      repeatCount: 1,
      cooldownSeconds: 6,
      matchInSentence: true,
      channel: "both",
      isEnabled: true,
    }),
    makeWord({
      phrase: "خطر",
      aliases: [],
      description: "إنذار خطر — طويل، توقف، طويل، توقف، طويل",
      category: "danger",
      priority: "emergency",
      pattern: [
        vibrate(500, 100),
        pause(200),
        vibrate(500, 100),
        pause(200),
        vibrate(500, 100),
      ],
      repeatCount: 1,
      cooldownSeconds: 4,
      matchInSentence: true,
      channel: "both",
      isEnabled: true,
    }),
    makeWord({
      phrase: "سيارة",
      aliases: ["مركبة"],
      description: "اقتراب سيارة — أربع نبضات سريعة",
      category: "environment",
      priority: "high",
      pattern: [
        vibrate(90, 85),
        pause(80),
        vibrate(90, 85),
        pause(80),
        vibrate(90, 85),
        pause(80),
        vibrate(90, 85),
      ],
      repeatCount: 1,
      cooldownSeconds: 6,
      matchInSentence: true,
      channel: "bottom",
      isEnabled: true,
    }),
    makeWord({
      phrase: "تعال",
      aliases: [],
      description: "طلب الحضور — نبضتان متوسطتان",
      category: "daily",
      priority: "normal",
      pattern: [vibrate(250, 65), pause(180), vibrate(250, 65)],
      repeatCount: 1,
      cooldownSeconds: 10,
      matchInSentence: true,
      channel: "both",
      isEnabled: true,
    }),
    makeWord({
      phrase: "يمين",
      aliases: [],
      description: "اتجاه يمين — قصير ثم طويل",
      category: "directions",
      priority: "normal",
      pattern: [vibrate(120, 60), pause(150), vibrate(420, 80)],
      repeatCount: 1,
      cooldownSeconds: 5,
      matchInSentence: true,
      channel: "top",
      isEnabled: true,
    }),
    makeWord({
      phrase: "يسار",
      aliases: [],
      description: "اتجاه يسار — طويل ثم قصير",
      category: "directions",
      priority: "normal",
      pattern: [vibrate(420, 80), pause(150), vibrate(120, 60)],
      repeatCount: 1,
      cooldownSeconds: 5,
      matchInSentence: true,
      channel: "bottom",
      isEnabled: true,
    }),
  ];
}
