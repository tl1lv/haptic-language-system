"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type TrainingAnswer = {
  playedWordId: string;
  chosenWordId: string;
  correct: boolean;
  timeMs: number;
  at: string;
};

export type WordTrainingStats = {
  correct: number;
  wrong: number;
  totalTimeMs: number;
};

type TrainingStore = {
  answers: TrainingAnswer[];
  stats: Record<string, WordTrainingStats>;
  addAnswer: (answer: TrainingAnswer) => void;
  reset: () => void;
};

export const useTrainingStore = create<TrainingStore>()(
  persist(
    (set) => ({
      answers: [],
      stats: {},
      addAnswer: (answer) =>
        set((s) => {
          const prev = s.stats[answer.playedWordId] ?? {
            correct: 0,
            wrong: 0,
            totalTimeMs: 0,
          };
          return {
            answers: [answer, ...s.answers].slice(0, 1000),
            stats: {
              ...s.stats,
              [answer.playedWordId]: {
                correct: prev.correct + (answer.correct ? 1 : 0),
                wrong: prev.wrong + (answer.correct ? 0 : 1),
                totalTimeMs: prev.totalTimeMs + answer.timeMs,
              },
            },
          };
        }),
      reset: () => set({ answers: [], stats: {} }),
    }),
    {
      name: "hls-training",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
