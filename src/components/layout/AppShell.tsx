"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mic,
  BookOpen,
  Vibrate,
  GraduationCap,
  History,
  Watch,
  Settings,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useSettingsStore } from "@/stores/settings.store";
import { useMounted } from "@/hooks/useMounted";

const NAV_ITEMS = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/listening", label: "الاستماع", icon: Mic },
  { href: "/dictionary", label: "القاموس", icon: BookOpen },
  { href: "/designer", label: "مصمم الاهتزاز", icon: Vibrate },
  { href: "/training", label: "التدريب", icon: GraduationCap },
  { href: "/logs", label: "سجل الأحداث", icon: History },
  { href: "/devices", label: "الأجهزة", icon: Watch },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

const MOBILE_NAV = NAV_ITEMS.filter((item) =>
  ["/dashboard", "/listening", "/dictionary", "/devices", "/settings"].includes(
    item.href
  )
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mounted = useMounted();
  const theme = useSettingsStore((s) => s.theme);
  const update = useSettingsStore((s) => s.update);

  return (
    <div className="flex min-h-screen">
      {/* الشريط الجانبي - سطح المكتب */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <Link href="/" className="focus-ring mb-6 flex items-center gap-2.5 rounded-xl p-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Vibrate className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold">اللغة الاهتزازية</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Haptic Language System
            </p>
          </div>
        </Link>

        <nav className="flex-1 space-y-1" aria-label="التنقل الرئيسي">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className="h-5 w-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => update({ theme: theme === "dark" ? "light" : "dark" })}
          className="focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="تبديل الوضع الداكن"
        >
          {mounted && theme === "dark" ? (
            <Sun className="h-5 w-5" aria-hidden />
          ) : (
            <Moon className="h-5 w-5" aria-hidden />
          )}
          {mounted && theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
        </button>
      </aside>

      {/* المحتوى */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* شريط علوي - جوال */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 lg:hidden">
          <Link href="/" className="focus-ring flex items-center gap-2 rounded-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Vibrate className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-sm font-bold">اللغة الاهتزازية</span>
          </Link>
          <button
            type="button"
            onClick={() => update({ theme: theme === "dark" ? "light" : "dark" })}
            className="focus-ring rounded-lg p-2 text-slate-600 dark:text-slate-300"
            aria-label="تبديل الوضع الداكن"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-5 w-5" aria-hidden />
            ) : (
              <Moon className="h-5 w-5" aria-hidden />
            )}
          </button>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-8">
          {children}
        </main>

        {/* شريط سفلي - جوال */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden"
          aria-label="التنقل السفلي"
        >
          {MOBILE_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "focus-ring flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  active
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-slate-500 dark:text-slate-400"
                )}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className="h-5 w-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
