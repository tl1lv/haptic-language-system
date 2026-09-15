"use client";

import { create } from "zustand";
import type { DeviceConnectionStatus, DeviceInfo } from "@/types";
import { deviceService } from "@/services/device.service";

type DeviceStore = {
  status: DeviceConnectionStatus;
  info: DeviceInfo | null;
  syncing: boolean;
  lastSyncCount: number | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendTest: () => Promise<void>;
  sync: (wordCount: number) => Promise<void>;
};

export const useDeviceStore = create<DeviceStore>()((set, get) => ({
  status: "disconnected",
  info: null,
  syncing: false,
  lastSyncCount: null,
  error: null,

  connect: async () => {
    if (get().status !== "disconnected") return;
    if (!deviceService.isSupported()) {
      set({
        error:
          "متصفحك لا يدعم الاتصال السلكي (Web Serial). افتح الموقع بكروم أو إيدج على الكمبيوتر ووصّل الجهاز بكابل USB-C.",
      });
      return;
    }
    set({ status: "connecting", error: null });
    try {
      const info = await deviceService.connect();
      set({ status: "connected", info });
    } catch (err) {
      const cancelled =
        err instanceof Error && /no port selected|cancelled|denied/i.test(err.message);
      set({
        status: "disconnected",
        error: cancelled
          ? null
          : "فشل الاتصال بالجهاز. تأكد من توصيل الكابل وأن أحدًا لا يستخدم المنفذ (مثل Arduino IDE) في الوقت نفسه.",
      });
    }
  },

  disconnect: async () => {
    await deviceService.disconnect();
    set({ status: "disconnected" });
  },

  sendTest: async () => {
    await deviceService.sendTestVibration();
  },

  sync: async (wordCount: number) => {
    set({ syncing: true });
    try {
      const result = await deviceService.syncDictionary(wordCount);
      set({ lastSyncCount: result.synced });
    } finally {
      set({ syncing: false });
    }
  },
}));
