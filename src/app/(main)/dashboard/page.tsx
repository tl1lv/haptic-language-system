"use client";

import Link from "next/link";
import {
  BookOpen,
  Plus,
  GraduationCap,
  Watch,
  Timer,
  Activity,
  History,
  Vibrate,
} from "lucide-react";
import { useListening } from "@/hooks/useListening";
import { ListeningPanel } from "@/components/listening/ListeningPanel";
import { useDictionaryStore } from "@/stores/dictionary.store";
import { useLogsStore } from "@/stores/logs.store";
import { useDeviceStore } from "@/stores/device.store";
import { useSettingsStore } from "@/stores/settings.store";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge, PriorityBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PRIORITY_LABELS } from "@/types";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="truncate text-lg font-bold">{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const listening = useListening();
  const words = useDictionaryStore((s) => s.words);
  const logs = useLogsStore((s) => s.logs);
  const deviceStatus = useDeviceStore((s) => s.status);
  const userName = useSettingsStore((s) => s.userName);

  const enabledWords = words.filter((w) => w.isEnabled);
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter((l) => l.detectedAt.startsWith(today));
  const avgResponse =
    logs.length > 0
      ? Math.round(logs.reduce((sum, l) => sum + l.responseTimeMs, 0) / logs.length)
      : null;
  const lastLog = logs[0];
  const lastWord = lastLog
    ? words.find((w) => w.id === lastLog.wordMappingId)
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {userName ? `مرحبًا ${userName}` : "لوحة التحكم"}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            نظرة عامة على لغتك الاهتزازية ونشاط الاستماع.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dictionary/new">
            <Button aria-label="إضافة كلمة جديدة">
              <Plus className="h-4 w-4" aria-hidden /> كلمة جديدة
            </Button>
          </Link>
          <Link href="/training">
            <Button variant="secondary" aria-label="الدخول إلى وضع التدريب">
              <GraduationCap className="h-4 w-4" aria-hidden /> وضع التدريب
            </Button>
          </Link>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="كلمات القاموس"
          value={String(words.length)}
          sub={`${enabledWords.length} فعالة`}
        />
        <StatCard
          icon={Activity}
          label="اكتشافات اليوم"
          value={String(todayLogs.length)}
        />
        <StatCard
          icon={Timer}
          label="متوسط الاستجابة"
          value={avgResponse !== null ? `${avgResponse} م.ث` : "—"}
        />
        <StatCard
          icon={Watch}
          label="الجهاز القابل للارتداء"
          value={
            deviceStatus === "connected"
              ? "متصل"
              : deviceStatus === "connecting"
                ? "يتصل..."
                : "غير متصل"
          }
        />
      </div>

      {/* آخر اكتشاف */}
      {lastLog && lastWord && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600 dark:bg-secondary-700/20 dark:text-secondary-300">
              <Vibrate className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                آخر كلمة مكتشفة · آخر نمط تم تشغيله
              </p>
              <p className="font-bold">{lastWord.phrase}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={lastWord.priority} />
            <Badge>
              {new Date(lastLog.detectedAt).toLocaleTimeString("ar", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Badge>
          </div>
        </Card>
      )}

      {/* الاستماع */}
      <ListeningPanel listening={listening} />

      {/* آخر الأحداث */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <CardTitle className="mb-0 flex items-center gap-2">
            <History className="h-4 w-4 text-primary-500" aria-hidden />
            آخر الأحداث
          </CardTitle>
          <Link
            href="/logs"
            className="focus-ring rounded-lg px-2 py-1 text-sm text-primary-600 hover:underline dark:text-primary-400"
          >
            عرض السجل الكامل
          </Link>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            لا توجد أحداث بعد — ابدأ الاستماع أو جرّب المحاكاة النصية.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.slice(0, 5).map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{log.matchedPhrase}</p>
                  <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                    {log.originalText || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Badge>{log.source === "simulation" ? "محاكاة" : "ميكروفون"}</Badge>
                  {new Date(log.detectedAt).toLocaleTimeString("ar", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="sr-only">
        الأولويات المتاحة: {Object.values(PRIORITY_LABELS).join("، ")}
      </p>
    </div>
  );
}
