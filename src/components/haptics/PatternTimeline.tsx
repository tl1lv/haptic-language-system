"use client";

import { motion } from "framer-motion";
import type { HapticChannel, HapticStep } from "@/types";
import { cn } from "@/lib/cn";
import { totalDurationMs } from "@/lib/presets";

type Props = {
  pattern: HapticStep[];
  activeStep?: number | null;
  compact?: boolean;
  className?: string;
  /** محرك الكلمة الافتراضي — يُستخدم للخطوات التي لم تُخصَّص لها قناة. */
  defaultChannel?: HapticChannel;
};

/**
 * عرض بصري للنمط على شكل مسارين: المحرك العلوي فوق، والسفلي تحت —
 * بالضبط كما يظهر السوار فعليًا على المعصم. خطوة بقناة "both" تُرسَم
 * في المسارين معًا، فيسهل رؤية متى يتنقّل النمط بين المحركين (تصميم
 * "اهتزازة علوية طويلة ثم سفلية" يظهر بوضوح كخطوتين في مسارين مختلفين).
 */
export function PatternTimeline({
  pattern,
  activeStep,
  compact,
  className,
  defaultChannel = "both",
}: Props) {
  const total = totalDurationMs(pattern);
  if (pattern.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-xs text-slate-400 dark:border-slate-700",
          compact ? "h-14" : "h-28",
          className
        )}
      >
        لا يوجد نمط بعد — أضف خطوة اهتزاز للبدء
      </div>
    );
  }

  let cursor = 0;
  const blocks = pattern.map((step) => {
    const start = cursor;
    cursor += step.durationMs;
    const channel = step.channel ?? defaultChannel;
    return { step, start, channel };
  });

  const laneHeight = compact ? 16 : 34;
  const gap = compact ? 3 : 6;

  const laneBlocks = (lane: "top" | "bottom") =>
    blocks.filter(
      (b) =>
        b.step.type === "vibrate" && (b.channel === lane || b.channel === "both")
    );

  return (
    <div
      className={cn("w-full", className)}
      aria-label={`نمط اهتزاز من ${pattern.length} خطوة، المدة الكلية ${total} مللي ثانية`}
    >
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 p-2 dark:from-slate-900 dark:to-slate-800/60"
        style={{ height: laneHeight * 2 + gap + 16 }}
      >
        {(["top", "bottom"] as const).map((lane, laneIdx) => (
          <div
            key={lane}
            className="absolute inset-x-2 rounded-xl bg-white/60 dark:bg-slate-950/40"
            style={{
              top: laneIdx * (laneHeight + gap) + 8,
              height: laneHeight,
            }}
          >
            {laneBlocks(lane).map(({ step, start }) => {
              const widthPct = Math.max(2, (step.durationMs / total) * 100);
              const leftPct = (start / total) * 100;
              const isActive = activeStep !== null && activeStep !== undefined &&
                pattern[activeStep]?.id === step.id;
              const isTop = lane === "top";
              return (
                <motion.div
                  key={step.id}
                  layout
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{
                    scaleX: 1,
                    opacity: Math.max(0.35, step.intensity / 100),
                  }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: "absolute",
                    insetInlineStart: `${leftPct}%`,
                    width: `${widthPct}%`,
                    transformOrigin: "left center",
                  }}
                  className={cn(
                    "h-full rounded-lg shadow-sm",
                    isTop
                      ? "bg-gradient-to-b from-sky-400 to-sky-600"
                      : "bg-gradient-to-b from-fuchsia-400 to-fuchsia-600",
                    isActive && "ring-2 ring-offset-1 ring-amber-400 dark:ring-offset-slate-900"
                  )}
                  title={`${isTop ? "علوي" : "سفلي"} · ${step.durationMs} م.ث · شدة ${step.intensity}`}
                />
              );
            })}
          </div>
        ))}
        {!compact && (
          <>
            <span className="absolute right-3 top-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
              علوي
            </span>
            <span className="absolute bottom-1 right-3 text-[10px] font-semibold text-fuchsia-600 dark:text-fuchsia-400">
              سفلي
            </span>
          </>
        )}
      </div>
      {!compact && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          المدة الكلية: {total.toLocaleString("ar")} مللي ثانية · {pattern.length} خطوة
        </p>
      )}
    </div>
  );
}
