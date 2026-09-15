"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Play,
  Square,
  Copy,
  Eraser,
  AlertTriangle,
  Vibrate,
  PauseCircle,
} from "lucide-react";
import type { HapticChannel, HapticStep, WordMapping } from "@/types";
import { CHANNEL_LABELS } from "@/types";
import { vibrate, pause, PATTERN_PRESETS } from "@/lib/presets";
import { uid } from "@/lib/id";
import { findSimilarPatterns } from "@/lib/pattern-similarity";
import { useHapticPlayer } from "@/hooks/useHapticPlayer";
import { Button } from "@/components/ui/Button";
import { PatternTimeline } from "./PatternTimeline";
import { cn } from "@/lib/cn";

type Props = {
  value: HapticStep[];
  onChange: (pattern: HapticStep[]) => void;
  existingWords?: WordMapping[];
  excludeWordId?: string;
  /** المحرك الافتراضي (من إعدادات الكلمة) المستخدم لأي خطوة لم تُخصَّص
   * لها قناة صراحة، ولإنشاء الخطوات الجديدة. */
  defaultChannel?: HapticChannel;
};

const CHANNEL_ORDER: HapticChannel[] = ["both", "top", "bottom"];

export function PatternEditor({
  value,
  onChange,
  existingWords = [],
  excludeWordId,
  defaultChannel = "both",
}: Props) {
  const { play, stop, activeStep, isPlaying, isSupported } = useHapticPlayer();

  const similar = useMemo(
    () =>
      value.length > 0
        ? findSimilarPatterns(value, existingWords, excludeWordId)
        : [],
    [value, existingWords, excludeWordId]
  );

  const updateStep = (id: string, partial: Partial<HapticStep>) => {
    onChange(value.map((s) => (s.id === id ? { ...s, ...partial } : s)));
  };

  const removeStep = (id: string) => {
    onChange(value.filter((s) => s.id !== id));
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const duplicatePattern = () => {
    if (!value.length) return;
    const copy = value.map((s) => ({ ...s, id: uid() }));
    onChange([...value, pause(250), ...copy]);
  };

  return (
    <div className="space-y-4">
      {/* أزرار سريعة */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => onChange([...value, vibrate(120, 70)])}>
          <Plus className="h-4 w-4" aria-hidden /> نبضة قصيرة
        </Button>
        <Button variant="outline" size="sm" onClick={() => onChange([...value, vibrate(250, 70)])}>
          <Plus className="h-4 w-4" aria-hidden /> نبضة متوسطة
        </Button>
        <Button variant="outline" size="sm" onClick={() => onChange([...value, vibrate(500, 85)])}>
          <Plus className="h-4 w-4" aria-hidden /> نبضة طويلة
        </Button>
        <Button variant="outline" size="sm" onClick={() => onChange([...value, pause(200)])}>
          <PauseCircle className="h-4 w-4" aria-hidden /> توقف
        </Button>
        <Button variant="outline" size="sm" onClick={duplicatePattern} disabled={!value.length} aria-label="تكرار النمط">
          <Copy className="h-4 w-4" aria-hidden /> تكرار النمط
        </Button>
        <Button variant="outline" size="sm" onClick={() => onChange([])} disabled={!value.length} aria-label="مسح النمط">
          <Eraser className="h-4 w-4" aria-hidden /> مسح
        </Button>
      </div>

      {/* أنماط جاهزة */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          أنماط جاهزة للبدء منها:
        </p>
        <div className="flex flex-wrap gap-2">
          {PATTERN_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => onChange(preset.build())}
              className="focus-ring rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* الخط الزمني */}
      <PatternTimeline pattern={value} activeStep={activeStep} defaultChannel={defaultChannel} />

      {/* قائمة الخطوات */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {value.map((step, index) => (
            <motion.div
              key={step.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-xl border p-3",
                activeStep === index
                  ? "border-primary-400 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  step.type === "vibrate"
                    ? "bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                )}
                aria-hidden
              >
                {step.type === "vibrate" ? (
                  <Vibrate className="h-4 w-4" />
                ) : (
                  <PauseCircle className="h-4 w-4" />
                )}
              </span>

              <span className="w-14 text-sm font-medium">
                {step.type === "vibrate" ? "اهتزاز" : "توقف"}
              </span>

              <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                المدة
                <input
                  type="number"
                  min={30}
                  max={3000}
                  step={10}
                  value={step.durationMs}
                  onChange={(e) =>
                    updateStep(step.id, {
                      durationMs: Math.max(30, Math.min(3000, Number(e.target.value) || 30)),
                    })
                  }
                  className="focus-ring h-9 w-20 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  aria-label={`مدة الخطوة ${index + 1} بالمللي ثانية`}
                />
                م.ث
              </label>

              {step.type === "vibrate" && (
                <label className="flex flex-1 basis-40 items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  الشدة
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={step.intensity}
                    onChange={(e) =>
                      updateStep(step.id, { intensity: Number(e.target.value) })
                    }
                    className="h-2 flex-1 accent-primary-600"
                    aria-label={`شدة الخطوة ${index + 1}`}
                  />
                  <span className="w-8 text-center font-medium">{step.intensity}</span>
                </label>
              )}

              {step.type === "vibrate" && (
                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  المحرك
                  <select
                    value={step.channel ?? defaultChannel}
                    onChange={(e) =>
                      updateStep(step.id, { channel: e.target.value as HapticChannel })
                    }
                    className="focus-ring h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    aria-label={`المحرك المستهدف للخطوة ${index + 1}`}
                  >
                    {CHANNEL_ORDER.map((c) => (
                      <option key={c} value={c}>
                        {CHANNEL_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="ms-auto flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => moveStep(index, -1)} disabled={index === 0} aria-label="تحريك لأعلى">
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => moveStep(index, 1)} disabled={index === value.length - 1} aria-label="تحريك لأسفل">
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => removeStep(step.id)} aria-label="حذف الخطوة">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* تشغيل وتجربة */}
      <div className="flex flex-wrap items-center gap-2">
        {isPlaying ? (
          <Button variant="outline" onClick={stop} aria-label="إيقاف التجربة">
            <Square className="h-4 w-4" aria-hidden /> إيقاف
          </Button>
        ) : (
          <Button onClick={() => play(value, 1, defaultChannel)} disabled={!value.length} aria-label="تجربة النمط">
            <Play className="h-4 w-4" aria-hidden /> تشغيل وتجربة
          </Button>
        )}
        {!isSupported && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            الاهتزاز غير مدعوم على هذا الجهاز — ستسمع محاكاة صوتية للنمط مع المحاكاة البصرية على الخط الزمني.
          </p>
        )}
      </div>

      {/* تحذير التشابه */}
      {similar.length > 0 && (
        <div
          className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">
              هذا النمط مشابه لنمط كلمة «{similar[0].mapping.phrase}» بنسبة {similar[0].score}٪،
              وقد يصعب التمييز بينهما.
            </p>
            {similar.length > 1 && (
              <p className="mt-1 text-xs">
                أنماط مشابهة أخرى:{" "}
                {similar.slice(1, 4).map((s) => `«${s.mapping.phrase}» (${s.score}٪)`).join("، ")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
