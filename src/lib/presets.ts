import type { HapticChannel, HapticStep } from "@/types";
import { uid } from "./id";

export function vibrate(
  durationMs: number,
  intensity = 70,
  channel?: HapticChannel
): HapticStep {
  return { id: uid(), type: "vibrate", durationMs, intensity, channel };
}

export function pause(durationMs: number): HapticStep {
  return { id: uid(), type: "pause", durationMs, intensity: 0 };
}

export type PatternPreset = {
  key: string;
  label: string;
  build: () => HapticStep[];
};

export const PATTERN_PRESETS: PatternPreset[] = [
  {
    key: "single-short",
    label: "نبضة قصيرة",
    build: () => [vibrate(120, 70)],
  },
  {
    key: "double",
    label: "نبضتان",
    build: () => [vibrate(150, 70), pause(150), vibrate(150, 70)],
  },
  {
    key: "triple",
    label: "ثلاث نبضات",
    build: () => [
      vibrate(120, 70),
      pause(120),
      vibrate(120, 70),
      pause(120),
      vibrate(120, 70),
    ],
  },
  {
    key: "short-long",
    label: "قصير ثم طويل",
    build: () => [vibrate(120, 60), pause(150), vibrate(450, 85)],
  },
  {
    key: "emergency",
    label: "تنبيه طارئ",
    build: () => [
      vibrate(500, 100),
      pause(180),
      vibrate(500, 100),
      pause(180),
      vibrate(500, 100),
    ],
  },
  {
    key: "ramp",
    label: "نمط متدرج",
    build: () => [
      vibrate(120, 30),
      pause(100),
      vibrate(180, 55),
      pause(100),
      vibrate(260, 80),
      pause(100),
      vibrate(340, 100),
    ],
  },
];

export function totalDurationMs(pattern: HapticStep[]): number {
  return pattern.reduce((sum, s) => sum + s.durationMs, 0);
}
