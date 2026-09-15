"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mic,
  MicOff,
  Send,
  Trash2,
  Keyboard,
  Radio,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge, PriorityBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import type { useListening } from "@/hooks/useListening";

type Listening = ReturnType<typeof useListening>;

function SoundWave({ active }: { active: boolean }) {
  return (
    <div className="flex h-10 items-center justify-center gap-1" aria-hidden>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <motion.span
          key={i}
          className={cn(
            "w-1.5 rounded-full",
            active ? "bg-primary-500" : "bg-slate-300 dark:bg-slate-700"
          )}
          animate={
            active
              ? { height: [8, 22 + (i % 3) * 8, 8] }
              : { height: 8 }
          }
          transition={
            active
              ? { repeat: Infinity, duration: 0.9, delay: i * 0.1 }
              : { duration: 0.2 }
          }
        />
      ))}
    </div>
  );
}

export function ListeningPanel({
  listening,
  full = false,
}: {
  listening: Listening;
  full?: boolean;
}) {
  const {
    mode,
    setMode,
    isListening,
    transcript,
    interim,
    recentMatches,
    queueState,
    lastResponseMs,
    lastConfidence,
    error,
    startMicrophone,
    stopListening,
    simulate,
    clearTranscript,
    speechSupported,
  } = listening;

  const [simText, setSimText] = useState("");

  const submitSimulation = () => {
    const matched = simulate(simText);
    setSimText("");
    return matched;
  };

  return (
    <div className="space-y-4">
      {/* اختيار الوضع */}
      <div className="flex gap-2" role="tablist" aria-label="وضع الاستماع">
        <Button
          variant={mode === "microphone" ? "primary" : "outline"}
          size="sm"
          onClick={() => setMode("microphone")}
          role="tab"
          aria-selected={mode === "microphone"}
        >
          <Mic className="h-4 w-4" aria-hidden /> وضع الميكروفون
        </Button>
        <Button
          variant={mode === "simulation" ? "primary" : "outline"}
          size="sm"
          onClick={() => setMode("simulation")}
          role="tab"
          aria-selected={mode === "simulation"}
        >
          <Keyboard className="h-4 w-4" aria-hidden /> وضع المحاكاة النصية
        </Button>
      </div>

      {mode === "microphone" ? (
        <Card className="text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                isListening ? "animate-pulse bg-red-500" : "bg-slate-300 dark:bg-slate-600"
              )}
              aria-hidden
            />
            <span className="text-sm font-medium">
              {isListening ? "الميكروفون يعمل — جارٍ الاستماع" : "الميكروفون متوقف"}
            </span>
          </div>

          <SoundWave active={isListening} />

          <div className="mt-4 flex justify-center">
            {isListening ? (
              <Button size="lg" variant="danger" onClick={stopListening} aria-label="إيقاف الاستماع">
                <MicOff className="h-5 w-5" aria-hidden /> إيقاف الاستماع
              </Button>
            ) : (
              <Button size="lg" onClick={startMicrophone} aria-label="بدء الاستماع">
                <Mic className="h-5 w-5" aria-hidden /> بدء الاستماع
              </Button>
            )}
          </div>

          {!speechSupported && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
              التعرف الصوتي غير مدعوم في هذا المتصفح — استخدم وضع المحاكاة
              النصية لاختبار النظام.
            </p>
          )}
          {error && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </Card>
      ) : (
        <Card>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-primary-500" aria-hidden />
            المحاكاة النصية
          </CardTitle>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            اكتب جملة كما لو سمعها الميكروفون، مثل: «يا عادل انتبه توجد سيارة خلفك»
          </p>
          <div className="flex gap-2">
            <input
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSimulation()}
              placeholder="اكتب الجملة هنا..."
              className="focus-ring h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              aria-label="جملة المحاكاة"
            />
            <Button onClick={submitSimulation} disabled={!simText.trim()} aria-label="تحليل الجملة">
              <Send className="h-4 w-4" aria-hidden /> تحليل
            </Button>
          </div>
        </Card>
      )}

      {/* النص الحي */}
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <CardTitle className="mb-0 flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary-500" aria-hidden />
            النص المكتشف
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={clearTranscript} disabled={!transcript && !interim} aria-label="حذف النص الحالي">
            <Trash2 className="h-4 w-4" aria-hidden /> مسح
          </Button>
        </div>
        {transcript || interim ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {transcript}
            {interim && (
              <span className="text-slate-400 dark:text-slate-500"> {interim}…</span>
            )}
          </p>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            لا يوجد نص بعد — ابدأ الاستماع أو جرّب المحاكاة.
          </p>
        )}
      </Card>

      {/* الكلمات المطابقة + القائمة */}
      <div className={cn("grid gap-4", full && "sm:grid-cols-2")}>
        <Card>
          <CardTitle>الكلمات المكتشفة</CardTitle>
          {recentMatches.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              لم تُكتشف كلمات بعد.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentMatches.slice(0, full ? 8 : 4).map((m, i) => (
                <li
                  key={`${m.mapping.id}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60"
                >
                  <span className="text-sm font-medium">{m.mapping.phrase}</span>
                  <div className="flex items-center gap-2">
                    {m.matchedVariant !== m.mapping.phrase && (
                      <Badge>مرادف: {m.matchedVariant}</Badge>
                    )}
                    <PriorityBadge priority={m.mapping.priority} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4 text-primary-500" aria-hidden />
            قائمة انتظار الاهتزازات
          </CardTitle>
          <div className="space-y-2 text-sm">
            {queueState.playing && (
              <div className="flex items-center justify-between rounded-lg bg-primary-50 px-3 py-2 dark:bg-primary-900/20">
                <span className="font-medium text-primary-700 dark:text-primary-300">
                  يُشغَّل الآن: {queueState.playing.label}
                </span>
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary-500" aria-hidden />
              </div>
            )}
            {queueState.queue.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                <span>{item.label}</span>
                <PriorityBadge priority={item.priority} />
              </div>
            ))}
            {!queueState.playing && queueState.queue.length === 0 && (
              <p className="text-slate-400 dark:text-slate-500">القائمة فارغة.</p>
            )}
            <div className="border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {queueState.lastPlayed && <p>آخر اهتزاز: {queueState.lastPlayed.label}</p>}
              {lastResponseMs !== null && <p>زمن الاستجابة: {lastResponseMs} م.ث</p>}
              {lastConfidence !== null && (
                <p>مستوى الثقة: {Math.round(lastConfidence * 100)}٪</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
