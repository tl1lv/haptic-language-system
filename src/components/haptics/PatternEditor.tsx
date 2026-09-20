"use client";

import { useMemo, useState } from "react";
import { Reorder, useDragControls, AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Play,
  Square,
  Copy,
  Eraser,
  AlertTriangle,
  Vibrate,
  PauseCircle,
  GripVertical,
  ArrowUpCircle,
  ArrowDownCircle,
  CircleDot,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { HapticChannel, HapticStep, WordMapping } from "@/types";
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

const CHANNEL_ORDER: HapticChannel[] = ["top", "both", "bottom"];

const CHANNEL_META: Record<
  HapticChannel,
  { label: string; icon: typeof ArrowUpCircle; ring: string; dot: string }
> = {
  top: { label: "علوي", icon: ArrowUpCircle, ring: "ring-sky-400", dot: "bg-sky-500" },
  both: { label: "الاثنان", icon: CircleDot, ring: "ring-primary-400", dot: "bg-primary-500" },
  bottom: { label: "سفلي", icon: ArrowDownCircle, ring: "ring-fuchsia-400", dot: "bg-fuchsia-500" },
};

export function PatternEditor({
  value,
  onChange,
  existingWords = [],
  excludeWordId,
  defaultChannel = "both",
}: Props) {
  const { play, stop, activeStep, isPlaying, isSupported } = useHapticPlayer();
  const [previewStepId, setPreviewStepId] = useState<string | null>(null);

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

  /** إعادة ترتيب احتياطية بالأزرار — نفس نتيجة السحب، لكن تعمل بلا فأرة
   * وبلوحة المفاتيح، ولا تعتمد على دقة إيماءة السحب. */
  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const duplicateStep = (id: string) => {
    const idx = value.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const copy = { ...value[idx], id: uid() };
    onChange([...value.slice(0, idx + 1), copy, ...value.slice(idx + 1)]);
  };

  const duplicatePattern = () => {
    if (!value.length) return;
    const copy = value.map((s) => ({ ...s, id: uid() }));
    onChange([...value, pause(250), ...copy]);
  };

  const previewSingleStep = (step: HapticStep) => {
    if (step.type !== "vibrate") return;
    setPreviewStepId(step.id);
    void play([step], 1, defaultChannel).finally(() => setPreviewStepId(null));
  };

  return (
    <div className="space-y-5">
      {/* أزرار الإضافة السريعة — بطاقات ملوّنة كبيرة، أسهل للمس */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <QuickAddCard
          label="نبضة قصيرة"
          hint="120 م.ث"
          gradient="from-sky-400 to-sky-600"
          onClick={() => onChange([...value, vibrate(120)])}
        />
        <QuickAddCard
          label="نبضة متوسطة"
          hint="250 م.ث"
          gradient="from-primary-400 to-primary-600"
          onClick={() => onChange([...value, vibrate(250)])}
        />
        <QuickAddCard
          label="نبضة طويلة"
          hint="500 م.ث"
          gradient="from-fuchsia-400 to-fuchsia-600"
          onClick={() => onChange([...value, vibrate(500)])}
        />
        <QuickAddCard
          label="توقف"
          hint="200 م.ث"
          gradient="from-slate-400 to-slate-600"
          icon={PauseCircle}
          onClick={() => onChange([...value, pause(200)])}
        />
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
              className="focus-ring rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-transform hover:scale-105 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* الخط الزمني بمسارين */}
      <PatternTimeline pattern={value} activeStep={activeStep} defaultChannel={defaultChannel} />

      {/* قائمة الخطوات — سحب وإفلات حقيقي لإعادة الترتيب */}
      {value.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-sm text-slate-400 dark:border-slate-700">
          لم تُضِف أي خطوة بعد. استخدم البطاقات أعلاه، أو اختر نمطًا جاهزًا.
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={value}
          onReorder={onChange}
          className="space-y-2"
        >
          <AnimatePresence initial={false}>
            {value.map((step, index) => (
              <StepCard
                key={step.id}
                step={step}
                index={index}
                isFirst={index === 0}
                isLast={index === value.length - 1}
                isActive={activeStep === index}
                isPreviewing={previewStepId === step.id}
                defaultChannel={defaultChannel}
                onUpdate={(partial) => updateStep(step.id, partial)}
                onRemove={() => removeStep(step.id)}
                onDuplicate={() => duplicateStep(step.id)}
                onPreview={() => previewSingleStep(step)}
                onMoveUp={() => moveStep(index, -1)}
                onMoveDown={() => moveStep(index, 1)}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={duplicatePattern} disabled={!value.length} aria-label="تكرار النمط">
          <Copy className="h-4 w-4" aria-hidden /> تكرار النمط كاملًا
        </Button>
        <Button variant="outline" size="sm" onClick={() => onChange([])} disabled={!value.length} aria-label="مسح النمط">
          <Eraser className="h-4 w-4" aria-hidden /> مسح الكل
        </Button>
      </div>

      {/* تشغيل وتجربة */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-gradient-to-l from-primary-50 to-white p-3 dark:from-primary-950/40 dark:to-slate-900">
        {isPlaying ? (
          <Button variant="outline" onClick={stop} aria-label="إيقاف التجربة">
            <Square className="h-4 w-4" aria-hidden /> إيقاف
          </Button>
        ) : (
          <Button
            onClick={() => play(value, 1, defaultChannel)}
            disabled={!value.length}
            aria-label="تجربة النمط كاملًا"
            className="shadow-md shadow-primary-500/20"
          >
            <Play className="h-4 w-4" aria-hidden /> تجربة النمط كاملًا
          </Button>
        )}
        {!isSupported && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            الاهتزاز غير مدعوم على هذا الجهاز — ستظهر محاكاة بصرية على الخط الزمني بدل الاهتزاز الفعلي.
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

// ─────────────────────────── بطاقة إضافة سريعة ───────────────────────────

function QuickAddCard({
  label,
  hint,
  gradient,
  icon: Icon = Vibrate,
  onClick,
}: {
  label: string;
  hint: string;
  gradient: string;
  icon?: typeof Vibrate;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl bg-gradient-to-br p-3 text-white shadow-sm",
        gradient
      )}
    >
      <span className="flex items-center gap-1.5 text-xs font-medium opacity-90">
        <Plus className="h-3.5 w-3.5" aria-hidden /> إضافة
      </span>
      <span className="flex items-center gap-2 text-sm font-bold">
        <Icon className="h-5 w-5" aria-hidden />
        {label}
      </span>
      <span className="text-[11px] opacity-80">{hint}</span>
    </motion.button>
  );
}

// ─────────────────────────── بطاقة خطوة واحدة (قابلة للسحب) ───────────────────────────

function StepCard({
  step,
  index,
  isFirst,
  isLast,
  isActive,
  isPreviewing,
  defaultChannel,
  onUpdate,
  onRemove,
  onDuplicate,
  onPreview,
  onMoveUp,
  onMoveDown,
}: {
  step: HapticStep;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isActive: boolean;
  isPreviewing: boolean;
  defaultChannel: HapticChannel;
  onUpdate: (partial: Partial<HapticStep>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onPreview: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const controls = useDragControls();
  const channel = step.channel ?? defaultChannel;
  const meta = CHANNEL_META[channel];

  return (
    <Reorder.Item
      value={step}
      id={step.id}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      whileDrag={{ scale: 1.02, boxShadow: "0 12px 28px -8px rgba(0,0,0,0.25)", zIndex: 10 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "relative flex flex-wrap items-center gap-3 rounded-2xl border-2 bg-white p-3 dark:bg-slate-900",
        isActive || isPreviewing
          ? "border-primary-400 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20"
          : "border-slate-100 dark:border-slate-800"
      )}
    >
      {/* مقبض السحب، مع زرَي أعلى/أسفل احتياطيَّين لمن يفضّل النقر على السحب
          أو يستخدم لوحة المفاتيح */}
      <div className="flex shrink-0 flex-col items-center">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className="flex h-5 w-9 items-center justify-center rounded-t-lg text-slate-300 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-20 dark:text-slate-600 dark:hover:bg-slate-800"
          aria-label={`تحريك الخطوة ${index + 1} للأعلى`}
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          className="flex h-8 w-9 cursor-grab items-center justify-center text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing dark:text-slate-600 dark:hover:bg-slate-800"
          aria-label={`سحب الخطوة ${index + 1} لإعادة الترتيب`}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className="flex h-5 w-9 items-center justify-center rounded-b-lg text-slate-300 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-20 dark:text-slate-600 dark:hover:bg-slate-800"
          aria-label={`تحريك الخطوة ${index + 1} للأسفل`}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
          step.type === "vibrate" ? meta.dot : "bg-slate-300 dark:bg-slate-700"
        )}
        aria-hidden
      >
        {step.type === "vibrate" ? <Vibrate className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
      </span>

      <span className="w-6 text-center text-xs font-bold text-slate-400">{index + 1}</span>

      <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
        المدة
        <input
          type="number"
          min={30}
          max={3000}
          step={10}
          value={step.durationMs}
          onChange={(e) =>
            onUpdate({
              durationMs: Math.max(30, Math.min(3000, Number(e.target.value) || 30)),
            })
          }
          className="focus-ring h-9 w-20 rounded-lg border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          aria-label={`مدة الخطوة ${index + 1} بالمللي ثانية`}
        />
        م.ث
      </label>

      {step.type === "vibrate" && (
        <label className="flex flex-1 basis-32 items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          الشدة
          <input
            type="range"
            min={1}
            max={100}
            value={step.intensity}
            onChange={(e) => onUpdate({ intensity: Number(e.target.value) })}
            className="h-2 flex-1 accent-primary-600"
            aria-label={`شدة الخطوة ${index + 1}`}
          />
          <span className="w-8 text-center font-medium">{step.intensity}</span>
        </label>
      )}

      {/* اختيار المحرك — أزرار مرئية بدل قائمة منسدلة */}
      {step.type === "vibrate" && (
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {CHANNEL_ORDER.map((c) => {
            const m = CHANNEL_META[c];
            const Icon = m.icon;
            const selected = channel === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onUpdate({ channel: c })}
                title={m.label}
                aria-label={`المحرك: ${m.label}`}
                aria-pressed={selected}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                  selected
                    ? cn("text-white shadow-sm", m.dot)
                    : "text-slate-400 hover:bg-white hover:text-slate-600 dark:hover:bg-slate-700"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      )}

      <div className="ms-auto flex items-center gap-1">
        {step.type === "vibrate" && (
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9", isPreviewing && "animate-pulse text-primary-600")}
            onClick={onPreview}
            aria-label={`تجربة الخطوة ${index + 1} وحدها`}
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onDuplicate} aria-label={`نسخ الخطوة ${index + 1}`}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={onRemove}
          aria-label={`حذف الخطوة ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Reorder.Item>
  );
}
