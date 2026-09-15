"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DetectionLog } from "@/types";

const MAX_LOGS = 500;

type LogsStore = {
  logs: DetectionLog[];
  addLog: (log: DetectionLog) => void;
  clearLogs: () => void;
};

export const useLogsStore = create<LogsStore>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (log) =>
        set((s) => ({ logs: [log, ...s.logs].slice(0, MAX_LOGS) })),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: "hls-logs",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
