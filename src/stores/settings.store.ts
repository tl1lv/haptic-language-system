"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AppSettings } from "@/types";

const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: 1,
  userName: "",
  language: "ar",
  dialect: "ar-SA",
  theme: "light",
  micAllowed: true,
  saveTranscripts: true,
  defaultCooldownSeconds: 8,
  maxWordsPerSentence: 3,
  playbackOrder: "priority",
  defaultIntensity: 100,
  phoneVibration: true,
  soundSimulation: true,
  onboardingComplete: false,
};

type SettingsStore = AppSettings & {
  update: (partial: Partial<AppSettings>) => void;
  reset: () => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (partial) => set(partial),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: "hls-settings",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
