"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, BookOpen } from "lucide-react";
import { useDictionaryStore } from "@/stores/dictionary.store";
import { WordCard } from "@/components/dictionary/WordCard";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { normalizeArabicText } from "@/lib/arabic-normalizer";
import { CATEGORY_LABELS, PRIORITY_LABELS } from "@/types";
import type { Priority, WordCategory } from "@/types";

type SortKey = "newest" | "mostDetected";

export default function DictionaryPage() {
  const words = useDictionaryStore((s) => s.words);
  const toggleEnabled = useDictionaryStore((s) => s.toggleEnabled);
  const deleteWord = useDictionaryStore((s) => s.deleteWord);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<WordCategory | "all">("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = normalizeArabicText(search);
    let list = words.filter((w) => {
      if (category !== "all" && w.category !== category) return false;
      if (priority !== "all" && w.priority !== priority) return false;
      if (q) {
        const haystack = normalizeArabicText(
          [w.phrase, ...w.aliases, w.description ?? ""].join(" ")
        );
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) =>
      sort === "newest"
        ? b.createdAt.localeCompare(a.createdAt)
        : b.detectionCount - a.detectionCount
    );
    return list;
  }, [words, search, category, priority, sort]);

  const enabledCount = words.filter((w) => w.isEnabled).length;
  const wordToDelete = words.find((w) => w.id === deleteId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">قاموس الكلمات والعبارات</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {words.length} كلمة، منها {enabledCount} فعالة.
          </p>
        </div>
        <Link href="/dictionary/new">
          <Button aria-label="إضافة كلمة جديدة">
            <Plus className="h-4 w-4" aria-hidden /> إضافة كلمة
          </Button>
        </Link>
      </div>

      {/* البحث والتصفية */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن كلمة أو مرادف..."
            className="focus-ring h-11 w-full rounded-xl border border-slate-300 bg-white ps-9 pe-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            aria-label="البحث في القاموس"
          />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value as WordCategory | "all")} aria-label="التصفية حسب الفئة">
          <option value="all">كل الفئات</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority | "all")} aria-label="التصفية حسب الأولوية">
            <option value="all">كل الأولويات</option>
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="الترتيب">
            <option value="newest">الأحدث</option>
            <option value="mostDetected">الأكثر اكتشافًا</option>
          </Select>
        </div>
      </div>

      {/* القائمة */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={words.length === 0 ? "قاموسك فارغ" : "لا توجد نتائج مطابقة"}
          description={
            words.length === 0
              ? "أضف أول كلمة وصمّم نمط اهتزازها لتبدأ لغتك الاهتزازية."
              : "جرّب تعديل البحث أو الفلاتر."
          }
          action={
            words.length === 0 ? (
              <Link href="/dictionary/new">
                <Button>
                  <Plus className="h-4 w-4" aria-hidden /> إضافة كلمة
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((word) => (
            <WordCard
              key={word.id}
              word={word}
              onToggle={() => toggleEnabled(word.id)}
              onDelete={() => setDeleteId(word.id)}
            />
          ))}
        </div>
      )}

      {/* تأكيد الحذف */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="حذف الكلمة">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          هل أنت متأكد من حذف «{wordToDelete?.phrase}»؟ سيُحذف نمط الاهتزاز
          المرتبط بها ولا يمكن التراجع.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>
            إلغاء
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (deleteId) deleteWord(deleteId);
              setDeleteId(null);
            }}
          >
            حذف نهائيًا
          </Button>
        </div>
      </Modal>
    </div>
  );
}
