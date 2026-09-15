/**
 * طبقة تخزين بسيطة فوق localStorage مع حماية من بيئة الخادم.
 * يمكن لاحقًا استبدالها بـ Supabase دون تغيير الواجهات.
 */
export const storageService = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // تجاهل أخطاء التخزين (مساحة ممتلئة مثلًا)
    }
  },

  remove(key: string): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // تجاهل
    }
  },

  clearAppData(prefix = "hls-"): void {
    if (typeof window === "undefined") return;
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  },
};
