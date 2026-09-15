"use client";

import type { HapticChannel, HapticStep } from "@/types";
import { CHANNEL_LABELS } from "@/types";
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

const CHANNEL_COLOR: Record<HapticChannel, string> = {
  both: "bg-primary-600 dark:bg-primary-500",
  top: "bg-sky-500 dark:bg-sky-400",
  bottom: "bg-fuchsia-500 dark:bg-fuchsia-400",
};

const CHANNEL_COLOR_ACTIVE: Record<HapticChannel, string> = {
  both: "bg-primary-400 ring-2 ring-primary-600",
  top: "bg-sky-300 ring-2 ring-sky-600",
  bottom: "bg-fuchsia-300 ring-2 ring-fuchsia-600",
};

/**
 * عرض بصري للنمط: كتل ممتلئة للاهتزاز ومساحات فارغة للتوقف.
 * طول كل كتلة يتناسب مع مدتها، ولونها يعكس شدتها.
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
          const channel = step.channel ?? defaultChannel;
          return (
            <div
              key={step.id}
              style={{ width: `${widthPct}%` }}
              className={cn(
                "rounded-md transition-all duration-150",
                step.type === "vibrate"
                  ? isActive
                    ? CHANNEL_COLOR_ACTIVE[channel]
                    : CHANNEL_COLOR[channel]
                  : isActive
                    ? "bg-slate-300 dark:bg-slate-600"
                    : "bg-transparent"
              )}
              title={
                step.type === "vibrate"
                  ? `اهتزاز ${step.durationMs} م.ث، شدة ${step.intensity}، ${CHANNEL_LABELS[channel]}`
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
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            المدة الكلية: {total} مللي ثانية · {pattern.length} خطوة
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            {(Object.keys(CHANNEL_COLOR) as HapticChannel[]).map((c) => (
              <span key={c} className="flex items-center gap-1">
                <span className={cn("h-2.5 w-2.5 rounded-sm", CHANNEL_COLOR[c])} aria-hidden />
                {CHANNEL_LABELS[c]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
