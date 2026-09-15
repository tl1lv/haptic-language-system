"use client";

import Link from "next/link";
import { Play, Pencil, Trash2, Power, Square } from "lucide-react";
import type { WordMapping } from "@/types";
import { CATEGORY_LABELS, CHANNEL_LABELS } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge, PriorityBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PatternTimeline } from "@/components/haptics/PatternTimeline";
import { useHapticPlayer } from "@/hooks/useHapticPlayer";
import { cn } from "@/lib/cn";

export function WordCard({
  word,
  onToggle,
  onDelete,
}: {
  word: WordMapping;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { play, stop, activeStep, isPlaying } = useHapticPlayer();

  return (
    <Card className={cn(!word.isEnabled && "opacity-60")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold">{word.phrase}</h3>
            <PriorityBadge priority={word.priority} />
            <Badge>{CATEGORY_LABELS[word.category]}</Badge>
            <Badge variant="primary">{CHANNEL_LABELS[word.channel]}</Badge>
            {!word.isEnabled && <Badge variant="warning">معطلة</Badge>}
          </div>
          {word.aliases.length > 0 && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              المرادفات: {word.aliases.join("، ")}
            </p>
          )}
          {word.description && (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {word.description}
            </p>
          )}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          اكتُشفت {word.detectionCount} مرة
        </p>
      </div>

      <div className="mt-3">
        <PatternTimeline
          pattern={word.pattern}
          activeStep={activeStep}
          compact
          defaultChannel={word.channel}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {isPlaying ? (
          <Button variant="outline" size="sm" onClick={stop} aria-label={`إيقاف تجربة نمط ${word.phrase}`}>
            <Square className="h-4 w-4" aria-hidden /> إيقاف
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => play(word.pattern, word.repeatCount, word.channel)} aria-label={`تجربة نمط ${word.phrase}`}>
            <Play className="h-4 w-4" aria-hidden /> تجربة
          </Button>
        )}
        <Link href={`/dictionary/new?id=${word.id}`}>
          <Button variant="ghost" size="sm" aria-label={`تعديل ${word.phrase}`}>
            <Pencil className="h-4 w-4" aria-hidden /> تعديل
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={onToggle} aria-label={word.isEnabled ? `تعطيل ${word.phrase}` : `تفعيل ${word.phrase}`}>
          <Power className="h-4 w-4" aria-hidden />
          {word.isEnabled ? "تعطيل" : "تفعيل"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={onDelete}
          aria-label={`حذف ${word.phrase}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden /> حذف
        </Button>
      </div>
    </Card>
  );
}
