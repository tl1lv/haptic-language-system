"use client";

import { useMemo, useState } from "react";
import { History, Trash2, Search, ShieldCheck } from "lucide-react";
import { useLogsStore } from "@/stores/logs.store";
import { useSettingsStore } from "@/stores/settings.store";
import { Card } from "@/components/ui/Card";
import { Badge, PriorityBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useDictionaryStore } from "@/stores/dictionary.store";
import { normalizeArabicText } from "@/lib/arabic-normalizer";
import { PRIORITY_LABELS } from "@/types";
import type { Priority } from "@/types";

type DateFilter = "all" | "today" | "week";

export default function LogsPage() {
  const logs = useLogsStore((s) => s.logs);
  const clearLogs = useLogsStore((s) => s.clearLogs);
  const words = useDictionaryStore((s) => s.words);
  const saveTranscripts = useSettingsStore((s) => s.saveTranscripts);
  const updateSettings = useSettingsStore((s) => s.update);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [wordFilter, setWordFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "microphone" | "simulation">("all");
  const [confirmClear, setConfirmClear] = useState(false);

  const wordById = useMemo(
    () => new Map(words.map((w) => [w.id, w])),
    [words]
  );

  const filtered = useMemo(() => {
    const q = normalizeArabicText(search);
    const now = Date.now();
    return logs.filter((log) => {
      const word = wordById.get(log.wordMappingId);
      if (priorityFilter !== "all" && word?.priority !== priorityFilter) return false;
      if (wordFilter !== "all" && log.wordMappingId !== wordFilter) return false;
      if (sourceFilter !== "all" && log.source !== sourceFilter) return false;
      if (dateFilter !== "all") {
        const t = new Date(log.detectedAt).getTime();
        const limit = dateFilter === "today" ? 24 * 3600e3 : 7 * 24 * 3600e3;
        if (dateFilter === "today") {
          if (log.detectedAt.slice(0, 10) !== new Date().toISOString().slice(0, 10)) return false;
        } else if (now - t > limit) return false;
      }
      if (q) {
        const haystack = normalizeArabicText(
          `${log.originalText} ${log.matchedPhrase}`
        );
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [logs, search, dateFilter, priorityFilter, wordFilter, sourceFilter, wordById]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">سجل الأحداث</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {logs.length} حدث مسجل.
          </p>
        </div>
        <Button
          variant="danger"
          onClick={() => setConfirmClear(true)}
          disabled={logs.length === 0}
          aria-label="حذف السجل"
        >
          <Trash2 className="h-4 w-4" aria-hidden /> حذف السجل
        </Button>
      </div>

      <Card className="p-4">
        <Switch
          checked={saveTranscripts}
          onChange={(v) => updateSettings({ saveTranscripts: v })}
          label="حفظ النصوص المكتشفة"
          description="عند التعطيل، تُسجَّل الأحداث دون حفظ نص الجملة الكاملة حفاظًا على الخصوصية."
        />
      </Card>

      {/* الفلاتر */}
      <div className="grid gap-3 sm:grid-cols-5">
        <div className="relative sm:col-span-2">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في النصوص والكلمات..."
            className="focus-ring h-11 w-full rounded-xl border border-slate-300 bg-white ps-9 pe-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            aria-label="البحث في السجل"
          />
        </div>
        <Select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)} aria-label="التصفية حسب التاريخ">
          <option value="all">كل الفترات</option>
          <option value="today">اليوم</option>
          <option value="week">آخر أسبوع</option>
        </Select>
        <Select value={wordFilter} onChange={(e) => setWordFilter(e.target.value)} aria-label="التصفية حسب الكلمة">
          <option value="all">كل الكلمات</option>
          {words.map((w) => (
            <option key={w.id} value={w.id}>{w.phrase}</option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as Priority | "all")} aria-label="التصفية حسب الأولوية">
            <option value="all">كل الأولويات</option>
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Select>
          <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as "all" | "microphone" | "simulation")} aria-label="التصفية حسب المصدر">
            <option value="all">كل المصادر</option>
            <option value="microphone">ميكروفون</option>
            <option value="simulation">محاكاة</option>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title={logs.length === 0 ? "لا توجد أحداث بعد" : "لا توجد نتائج مطابقة"}
          description={
            logs.length === 0
              ? "ستظهر هنا الكلمات المكتشفة وأنماط الاهتزاز المشغلة."
              : "جرّب تعديل الفلاتر."
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => {
            const word = wordById.get(log.wordMappingId);
            return (
              <Card key={log.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{log.matchedPhrase}</span>
                    {word && <PriorityBadge priority={word.priority} />}
                    <Badge>{log.source === "simulation" ? "محاكاة" : "ميكروفون"}</Badge>
                    {log.vibrationPlayed ? (
                      <Badge variant="success">تم الاهتزاز</Badge>
                    ) : (
                      <Badge variant="danger">لم يُشغَّل</Badge>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(log.detectedAt).toLocaleString("ar", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                {log.originalText && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    «{log.originalText}»
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>الثقة: {Math.round(log.confidence * 100)}٪</span>
                  <span>زمن الاستجابة: {log.responseTimeMs} م.ث</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!saveTranscripts && (
        <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          حفظ النصوص معطل — تُسجَّل الكلمات المطابقة فقط.
        </p>
      )}

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="حذف السجل">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          سيُحذف كامل سجل الأحداث ({logs.length} حدث) ولا يمكن التراجع. هل تريد
          المتابعة؟
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmClear(false)}>إلغاء</Button>
          <Button
            variant="danger"
            onClick={() => {
              clearLogs();
              setConfirmClear(false);
            }}
          >
            حذف الكل
          </Button>
        </div>
      </Modal>
    </div>
  );
}
