"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { WordMapping } from "@/types";
import { buildSeedWords } from "@/data/seed-words";

type DictionaryStore = {
  words: WordMapping[];
  seeded: boolean;
  seedIfEmpty: () => void;
  addWord: (word: WordMapping) => void;
  updateWord: (id: string, partial: Partial<WordMapping>) => void;
  deleteWord: (id: string) => void;
  toggleEnabled: (id: string) => void;
  incrementDetection: (id: string) => void;
  importWords: (words: WordMapping[]) => void;
};

export const useDictionaryStore = create<DictionaryStore>()(
  persist(
    (set, get) => ({
      words: [],
      seeded: false,
      seedIfEmpty: () => {
        const { words, seeded } = get();
        if (!seeded && words.length === 0) {
          set({ words: buildSeedWords(), seeded: true });
        } else if (!seeded) {
          set({ seeded: true });
        }
      },
      addWord: (word) => set((s) => ({ words: [word, ...s.words] })),
      updateWord: (id, partial) =>
        set((s) => ({
          words: s.words.map((w) =>
            w.id === id
              ? { ...w, ...partial, updatedAt: new Date().toISOString() }
              : w
          ),
        })),
      deleteWord: (id) =>
        set((s) => ({ words: s.words.filter((w) => w.id !== id) })),
      toggleEnabled: (id) =>
        set((s) => ({
          words: s.words.map((w) =>
            w.id === id ? { ...w, isEnabled: !w.isEnabled } : w
          ),
        })),
      incrementDetection: (id) =>
        set((s) => ({
          words: s.words.map((w) =>
            w.id === id ? { ...w, detectionCount: w.detectionCount + 1 } : w
          ),
        })),
      importWords: (words) => set({ words, seeded: true }),
    }),
    {
      name: "hls-dictionary",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
