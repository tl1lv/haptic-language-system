"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settings.store";
import { useDictionaryStore } from "@/stores/dictionary.store";

/**
 * تهيئة التطبيق: تطبيق الوضع الداكن/الفاتح وزرع البيانات التجريبية.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);
  const seedIfEmpty = useDictionaryStore((s) => s.seedIfEmpty);

  useEffect(() => {
    seedIfEmpty();
  }, [seedIfEmpty]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return <>{children}</>;
}
