"use client";

import { useMemo, useRef, useState } from "react";
import {
  GraduationCap,
  Play,
  RotateCcw,
  Check,
  X,
  Repeat2,
} from "lucide-react";
import type { WordMapping, WordCategory } from "@/types";
import { CATEGORY_LABELS } from "@/types";
import { useDictionaryStore } from "@/stores/dictionary.store";
import { useTrainingStore } from "@/stores/training.store";
import { useHapticPlayer } from "@/hooks/useHapticPlayer";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Progress } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { PatternTimeline } from "@/components/haptics/PatternTimeline";
import { cn } from "@/lib/cn";

type Phase = "setup" | "question" | "feedback" | "results";

type RoundResult = {
  word: WordMapping;
  chosen: WordMapping;
  correct: boolean;
  timeMs: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TrainingPage() {
  const words = useDictionaryStore((s) => s.words);
  const addAnswer = useTrainingStore((s) => s.addAnswer);

  const enabledWords = useMemo(
    () => words.filter((w) => w.isEnabled && w.pattern.length > 0),
    [words]
  );

  const { play, activeStep, isPlaying } = useHapticPlayer();

  const [phase, setPhase] = useState<Phase>("setup");
  const [count, setCount] = useState(5);
  const [category, setCategory] = useState<WordCategory | "all">("all");
  const [sessionWords, setSessionWords] = useState<WordMapping[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [options, setOptions] = useState<WordMapping[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const questionStartRef = useRef(0);

  const pool = useMemo(
    () =>
      category === "all"
        ? enabledWords
        : enabledWords.filter((w) => w.category === category),
    [enabledWords, category]
  );

  const buildOptions = (correct: WordMapping, all: WordMapping[]) => {
    const sameCategory = all.filter(
      (w) => w.id !== correct.id && w.category === correct.category
    );
    const others = all.filter(
      (w) => w.id !== correct.id && w.category !== correct.category
    );
    const distractors = shuffle([...shuffle(sameCategory), ...shuffle(others)]).slice(0, 3);
    return shuffle([correct, ...distractors]);
  };

  const startSession = (wordSet?: WordMapping[]) => {
    const source = wordSet ?? shuffle(pool).slice(0, Math.min(count, pool.length));
    if (source.length < 2) return;
    setSessionWords(source);
    setResults([]);
    setRoundIndex(0);
    setOptions(buildOptions(source[0], enabledWords));
    setPhase("question");
    questionStartRef.current = performance.now();
    void play(source[0].pattern, source[0].repeatCount, source[0].channel);
  };

  const answer = (chosen: WordMapping) => {
    const word = sessionWords[roundIndex];
    const timeMs = Math.round(performance.now() - questionStartRef.current);
    const correct = chosen.id === word.id;
    const result: RoundResult = { word, chosen, correct, timeMs };
    setResults((r) => [...r, result]);
    setLastResult(result);
    addAnswer({
      playedWordId: word.id,
      chosenWordId: chosen.id,
      correct,
      timeMs,
      at: new Date().toISOString(),
    });
    setPhase("feedback");
  };

  const nextRound = () => {
    const next = roundIndex + 1;
    if (next >= sessionWords.length) {
      setPhase("results");
      return;
    }
    setRoundIndex(next);
    setOptions(buildOptions(sessionWords[next], enabledWords));
    setPhase("question");
    questionStartRef.current = performance.now();
    void play(sessionWords[next].pattern, sessionWords[next].repeatCount, sessionWords[next].channel);
  };

  // النتائج
  const correctCount = results.filter((r) => r.correct).length;
  const successRate = results.length
    ? Math.round((correctCount / results.length) * 100)
    : 0;
  const avgTime = results.length
    ? Math.round(results.reduce((s, r) => s + r.timeMs, 0) / results.length)
    : 0;
  const weakWords = results.filter((r) => !r.correct).map((r) => r.word);
  const bestWords = results
    .filter((r) => r.correct)
    .sort((a, b) => a.timeMs - b.timeMs)
    .slice(0, 3);
  const confusions = results
    .filter((r) => !r.correct)
    .map((r) => `خلطت بين «${r.word.phrase}» و«${r.chosen.phrase}»`);

  if (enabledWords.length < 2) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">وضع التدريب</h1>
        <EmptyState
          icon={GraduationCap}
          title="تحتاج كلمتين فعالتين على الأقل"
          description="أضف مزيدًا من الكلمات مع أنماط اهتزاز لبدء التدريب على لغتك."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">وضع التدريب</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          اشعر بالنمط، وخمّن الكلمة — هكذا تحفظ لغتك الاهتزازية.
        </p>
      </div>

      {phase === "setup" && (
        <Card>
          <CardTitle>إعداد الجلسة</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="عدد الكلمات"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {[3, 5, 8, 10, 15].map((n) => (
                <option key={n} value={n} disabled={n > pool.length}>
                  {n} كلمات {n > pool.length ? "(غير متاح)" : ""}
                </option>
              ))}
            </Select>
            <Select
              label="الفئة"
              value={category}
              onChange={(e) => setCategory(e.target.value as WordCategory | "all")}
            >
              <option value="all">كل الفئات ({enabledWords.length})</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                const n = enabledWords.filter((w) => w.category === key).length;
                return (
                  <option key={key} value={key} disabled={n < 2}>
                    {label} ({n})
                  </option>
                );
              })}
            </Select>
          </div>
          <Button size="lg" className="mt-4" onClick={() => startSession()} disabled={pool.length < 2}>
            <Play className="h-5 w-5" aria-hidden /> بدء التدريب
          </Button>
        </Card>
      )}

      {(phase === "question" || phase === "feedback") && (
        <>
          <div className="flex items-center gap-3">
            <Progress
              value={((roundIndex + (phase === "feedback" ? 1 : 0)) / sessionWords.length) * 100}
              className="flex-1"
              label="تقدم الجلسة"
            />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {roundIndex + 1} / {sessionWords.length}
            </span>
          </div>

          <Card className="text-center">
            <CardTitle>ما الكلمة التي شعرت بها؟</CardTitle>
            <div className="mx-auto max-w-md py-2">
              <PatternTimeline
                pattern={sessionWords[roundIndex].pattern}
                activeStep={phase === "question" ? activeStep : null}
                compact={phase === "question"}
              />
            </div>
            <Button
              variant="outline"
              onClick={() =>
                play(
                  sessionWords[roundIndex].pattern,
                  sessionWords[roundIndex].repeatCount,
                  sessionWords[roundIndex].channel
                )
              }
              disabled={isPlaying}
              aria-label="إعادة تشغيل النمط"
            >
              <Repeat2 className="h-4 w-4" aria-hidden /> إعادة التشغيل
            </Button>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {options.map((option) => {
                const isCorrect =
                  phase === "feedback" && option.id === sessionWords[roundIndex].id;
                const isWrongChoice =
                  phase === "feedback" &&
                  lastResult?.chosen.id === option.id &&
                  !lastResult.correct;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={phase === "feedback"}
                    onClick={() => answer(option)}
                    className={cn(
                      "focus-ring flex h-14 items-center justify-center gap-2 rounded-xl border text-base font-semibold transition-colors",
                      isCorrect
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : isWrongChoice
                          ? "border-red-400 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-900/30 dark:text-red-300"
                          : "border-slate-300 bg-white hover:border-primary-400 hover:bg-primary-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-primary-900/20"
                    )}
                  >
                    {isCorrect && <Check className="h-5 w-5" aria-hidden />}
                    {isWrongChoice && <X className="h-5 w-5" aria-hidden />}
                    {option.phrase}
                  </button>
                );
              })}
            </div>

            {phase === "feedback" && lastResult && (
              <div className="mt-4 space-y-3">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    lastResult.correct ? "text-emerald-600" : "text-red-600"
                  )}
                  role="status"
                >
                  {lastResult.correct
                    ? `إجابة صحيحة في ${(lastResult.timeMs / 1000).toFixed(1)} ثانية`
                    : `الإجابة الصحيحة: «${lastResult.word.phrase}»`}
                </p>
                <Button size="lg" onClick={nextRound}>
                  {roundIndex + 1 >= sessionWords.length ? "عرض النتائج" : "السؤال التالي"}
                </Button>
              </div>
            )}
          </Card>
        </>
      )}

      {phase === "results" && (
        <div className="space-y-4">
          <Card className="text-center">
            <CardTitle>نتيجة الجلسة</CardTitle>
            <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
              {correctCount} / {results.length}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-slate-500 dark:text-slate-400">نسبة النجاح</p>
                <p className="text-lg font-bold">{successRate}٪</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-slate-500 dark:text-slate-400">متوسط زمن الإجابة</p>
                <p className="text-lg font-bold">{(avgTime / 1000).toFixed(1)} ث</p>
              </div>
            </div>
          </Card>

          {bestWords.length > 0 && (
            <Card>
              <CardTitle>أفضل الكلمات</CardTitle>
              <ul className="space-y-1 text-sm">
                {bestWords.map((r) => (
                  <li key={r.word.id} className="flex items-center justify-between">
                    <span className="font-medium">{r.word.phrase}</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {(r.timeMs / 1000).toFixed(1)} ث
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {weakWords.length > 0 && (
            <Card>
              <CardTitle>كلمات تحتاج مراجعة</CardTitle>
              <ul className="mb-3 space-y-1 text-sm">
                {confusions.map((c, i) => (
                  <li key={i} className="text-slate-600 dark:text-slate-300">{c}</li>
                ))}
              </ul>
              <Button
                variant="secondary"
                onClick={() => startSession(shuffle(weakWords))}
                disabled={weakWords.length < 2}
              >
                <RotateCcw className="h-4 w-4" aria-hidden /> إعادة تدريب الكلمات الضعيفة
              </Button>
              {weakWords.length < 2 && (
                <p className="mt-2 text-xs text-slate-400">
                  تحتاج كلمتين ضعيفتين على الأقل لإعادة التدريب المخصص.
                </p>
              )}
            </Card>
          )}

          <div className="flex gap-2">
            <Button size="lg" onClick={() => startSession()}>
              <RotateCcw className="h-5 w-5" aria-hidden /> إعادة التدريب
            </Button>
            <Button variant="outline" size="lg" onClick={() => setPhase("setup")}>
              تغيير الإعدادات
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
