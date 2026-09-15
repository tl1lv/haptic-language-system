"use client";

import type { HapticStep } from "@/types";
import { cn } from "@/lib/cn";
import { totalDurationMs } from "@/lib/presets";

type Props = {
  pattern: HapticStep[];
  activeStep?: number | null;
  compact?: boolean;
  className?: string;
};

/**
 * عرض بصري للنمط: كتل ممتلئة للاهتزاز ومساحات فارغة للتوقف.
 * طول كل كتلة يتناسب مع مدتها، ولونها يعكس شدتها.
 */
export function PatternTimeline({ pattern, activeStep, compact, className }: Props) {
  const total = totalDurationMs(pattern);
  if (pattern.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-400 dark:border-slate-700",
          compact ? "h-6" : "h-12",
          className
        )}
      >
        لا يوجد نمط بعد
      </div>
    );
  }

  return (
    <div
      className={cn("w-full", className)}
      aria-label={`نمط اهتزاز من ${pattern.length} خطوة، المدة الكلية ${total} مللي ثانية`}
    >
      <div
        className={cn(
          "flex w-full items-stretch gap-0.5 overflow-hidden rounded-lg bg-slate-100 p-1 dark:bg-slate-800",
          compact ? "h-6" : "h-12"
        )}
      >
        {pattern.map((step, i) => {
          const widthPct = Math.max(3, (step.durationMs / total) * 100);
          const isActive = activeStep === i;
          return (
            <div
              key={step.id}
              style={{ width: `${widthPct}%` }}
              className={cn(
                "rounded-md transition-all duration-150",
                step.type === "vibrate"
                  ? isActive
                    ? "bg-primary-400 ring-2 ring-primary-600"
                    : "bg-primary-600 dark:bg-primary-500"
                  : isActive
                    ? "bg-slate-300 dark:bg-slate-600"
                    : "bg-transparent"
              )}
              title={
                step.type === "vibrate"
                  ? `اهتزاز ${step.durationMs} م.ث، شدة ${step.intensity}`
                  : `توقف ${step.durationMs} م.ث`
              }
            >
              {step.type === "vibrate" && !compact && (
                <div
                  className="h-full w-full rounded-md bg-white/0"
                  style={{ opacity: step.intensity / 100 }}
                />
              )}
            </div>
          );
        })}
      </div>
      {!compact && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          المدة الكلية: {total} مللي ثانية · {pattern.length} خطوة
        </p>
      )}
    </div>
  );
}
