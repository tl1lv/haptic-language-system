"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Vibrate,
  ArrowLeft,
  ArrowRight,
  Check,
  Play,
  PartyPopper,
} from "lucide-react";
import type { HapticStep, Priority, WordCategory } from "@/types";
import { CATEGORY_LABELS, PRIORITY_LABELS } from "@/types";
import { uid } from "@/lib/id";
import { useSettingsStore } from "@/stores/settings.store";
import { useDictionaryStore } from "@/stores/dictionary.store";
import { useHapticPlayer } from "@/hooks/useHapticPlayer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Progress } from "@/components/ui/Progress";
import { PatternEditor } from "@/components/haptics/PatternEditor";
import { PatternTimeline } from "@/components/haptics/PatternTimeline";
import { vibrate, pause } from "@/lib/presets";

const STEPS = [
  "الاسم",
  "اللغة",
  "اختبار الاهتزاز",
  "أول كلمة",
  "تصميم النمط",
  "التجربة",
  "الانتهاء",
];

const DIALECTS = [
  { value: "ar-SA", label: "العربية (السعودية)" },
  { value: "ar-OM", label: "العربية (عُمان)" },
  { value: "ar-AE", label: "العربية (الإمارات)" },
  { value: "ar-EG", label: "العربية (مصر)" },
  { value: "ar-JO", label: "العربية (الأردن)" },
  { value: "ar-MA", label: "العربية (المغرب)" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const settings = useSettingsStore();
  const words = useDictionaryStore((s) => s.words);
  const addWord = useDictionaryStore((s) => s.addWord);
  const { play, activeStep, isPlaying, isSupported } = useHapticPlayer();

  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.userName);
  const [dialect, setDialect] = useState(settings.dialect);
  const [vibrationTested, setVibrationTested] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [category, setCategory] = useState<WordCategory>("custom");
  const [priority, setPriority] = useState<Priority>("normal");
  const [pattern, setPattern] = useState<HapticStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  const progress = ((step + 1) / STEPS.length) * 100;

  const next = () => {
    setError(null);
    if (step === 0 && !name.trim()) {
      setError("أدخل اسمك للمتابعة.");
      return;
    }
    if (step === 3 && !phrase.trim()) {
      setError("أدخل الكلمة أو العبارة الأولى.");
      return;
    }
    if (step === 4 && pattern.filter((s) => s.type === "vibrate").length === 0) {
      setError("أضف خطوة اهتزاز واحدة على الأقل قبل المتابعة.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const finish = () => {
    settings.update({
      userName: name.trim(),
      dialect,
      onboardingComplete: true,
    });
    if (phrase.trim() && pattern.length > 0) {
      const now = new Date().toISOString();
      addWord({
        id: uid(),
        phrase: phrase.trim(),
        aliases: [],
        description: "أول كلمة أُنشئت أثناء الإعداد",
        category,
        priority,
        pattern,
        repeatCount: 1,
        cooldownSeconds: settings.defaultCooldownSeconds,
        matchInSentence: true,
        channel: "both",
        isEnabled: true,
        detectionCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
    router.push("/dashboard");
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {/* التقدم */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">
            الخطوة {step + 1} من {STEPS.length}: {STEPS[step]}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {Math.round(progress)}٪
          </span>
        </div>
        <Progress value={progress} label="تقدم الإعداد" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            {step === 0 && (
              <div className="space-y-4">
                <h1 className="text-xl font-bold">أهلًا بك! ما اسمك؟</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  سنستخدم اسمك لاحقًا لتنبيهك عندما يناديك أحد.
                </p>
                <Input
                  label="الاسم"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: عادل"
                  autoFocus
                />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h1 className="text-xl font-bold">اللغة واللهجة</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  تُستخدم اللهجة لضبط التعرف الصوتي على كلامك المحيط.
                </p>
                <Select
                  label="اللهجة"
                  value={dialect}
                  onChange={(e) => setDialect(e.target.value)}
                >
                  {DIALECTS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 text-center">
                <h1 className="text-xl font-bold">اختبار اهتزاز الهاتف</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  اضغط الزر وتأكد أنك تشعر بالاهتزاز. إن لم يكن جهازك يدعم
                  الاهتزاز، ستظهر محاكاة بصرية بدلًا منه.
                </p>
                <div className="py-2">
                  <PatternTimeline
                    pattern={[vibrate(300, 80), pause(200), vibrate(300, 80)]}
                    activeStep={activeStep}
                  />
                </div>
                <Button
                  size="lg"
                  onClick={async () => {
                    setVibrationTested(true);
                    await play([vibrate(300, 80), pause(200), vibrate(300, 80)]);
                  }}
                  disabled={isPlaying}
                  aria-label="تشغيل اهتزاز تجريبي"
                >
                  <Vibrate className="h-5 w-5" aria-hidden /> جرّب الاهتزاز
                </Button>
                {!isSupported && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    الاهتزاز غير مدعوم في هذا المتصفح — سيعتمد النظام على
                    المحاكاة البصرية.
                  </p>
                )}
                {vibrationTested && (
                  <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-emerald-600">
                    <Check className="h-4 w-4" aria-hidden /> تم الاختبار
                  </p>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h1 className="text-xl font-bold">أضف أول كلمة</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  اختر كلمة مهمة تريد الشعور بها عند سماعها — اسمك مثلًا، أو
                  كلمة «انتبه».
                </p>
                <Input
                  label="الكلمة أو العبارة"
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  placeholder={name ? `مثال: ${name}` : "مثال: انتبه"}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="الفئة"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as WordCategory)}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="الأولوية"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                  >
                    {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h1 className="text-xl font-bold">
                  صمّم نمط اهتزاز «{phrase || "كلمتك"}»
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  ركّب النمط من نبضات وتوقفات، أو ابدأ من نمط جاهز.
                </p>
                <PatternEditor
                  value={pattern}
                  onChange={setPattern}
                  existingWords={words}
                />
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4 text-center">
                <h1 className="text-xl font-bold">جرّب لغتك الجديدة</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  هذا ما ستشعر به عند سماع «{phrase}». جرّبه أكثر من مرة حتى
                  تحفظ إيقاعه.
                </p>
                <PatternTimeline pattern={pattern} activeStep={activeStep} />
                <Button size="lg" onClick={() => play(pattern)} disabled={isPlaying || !pattern.length}>
                  <Play className="h-5 w-5" aria-hidden /> تشغيل النمط
                </Button>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <PartyPopper className="h-8 w-8" aria-hidden />
                </span>
                <h1 className="text-xl font-bold">كل شيء جاهز يا {name || "صديقي"}!</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  أُضيفت كلمتك الأولى مع مجموعة كلمات تجريبية جاهزة. يمكنك الآن
                  بدء الاستماع أو إدارة قاموسك من لوحة التحكم.
                </p>
                <Button size="lg" onClick={finish}>
                  الانتقال إلى لوحة التحكم
                  <ArrowLeft className="h-5 w-5" aria-hidden />
                </Button>
              </div>
            )}

            {error && (
              <p className="mt-4 text-sm font-medium text-red-600" role="alert">
                {error}
              </p>
            )}

            {step < 6 && (
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <Button variant="ghost" onClick={back} disabled={step === 0}>
                  <ArrowRight className="h-4 w-4" aria-hidden /> السابق
                </Button>
                <Button onClick={next}>
                  التالي <ArrowLeft className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
