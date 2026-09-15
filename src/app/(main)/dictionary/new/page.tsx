"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, ArrowRight, Loader2 } from "lucide-react";
import type { HapticChannel, HapticStep, Priority, WordCategory } from "@/types";
import { CATEGORY_LABELS, CHANNEL_LABELS, PRIORITY_LABELS } from "@/types";
import { uid } from "@/lib/id";
import { useDictionaryStore } from "@/stores/dictionary.store";
import { useSettingsStore } from "@/stores/settings.store";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { PatternEditor } from "@/components/haptics/PatternEditor";

function WordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const words = useDictionaryStore((s) => s.words);
  const addWord = useDictionaryStore((s) => s.addWord);
  const updateWord = useDictionaryStore((s) => s.updateWord);
  const defaultCooldown = useSettingsStore((s) => s.defaultCooldownSeconds);

  const editing = useMemo(
    () => words.find((w) => w.id === editId),
    [words, editId]
  );

  const [phrase, setPhrase] = useState("");
  const [aliases, setAliases] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<WordCategory>("custom");
  const [priority, setPriority] = useState<Priority>("normal");
  const [matchInSentence, setMatchInSentence] = useState(true);
  const [cooldownSeconds, setCooldownSeconds] = useState(defaultCooldown);
  const [repeatCount, setRepeatCount] = useState(1);
  const [channel, setChannel] = useState<HapticChannel>("both");
  const [pattern, setPattern] = useState<HapticStep[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  // تحميل بيانات التعديل أو نمط قادم من صفحة المصمم
  useEffect(() => {
    if (loaded) return;
    if (editing) {
      setPhrase(editing.phrase);
      setAliases(editing.aliases.join("، "));
      setDescription(editing.description ?? "");
      setCategory(editing.category);
      setPriority(editing.priority);
      setMatchInSentence(editing.matchInSentence);
      setCooldownSeconds(editing.cooldownSeconds);
      setRepeatCount(editing.repeatCount);
      setChannel(editing.channel ?? "both");
      setPattern(editing.pattern);
      setLoaded(true);
    } else if (!editId) {
      try {
        const draft = sessionStorage.getItem("hls-draft-pattern");
        if (draft) {
          setPattern(JSON.parse(draft) as HapticStep[]);
          sessionStorage.removeItem("hls-draft-pattern");
        }
      } catch {
        // تجاهل
      }
      setLoaded(true);
    }
  }, [editing, editId, loaded]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!phrase.trim()) next.phrase = "الكلمة أو العبارة مطلوبة.";
    const duplicate = words.find(
      (w) =>
        w.id !== editId &&
        w.phrase.trim() === phrase.trim() &&
        phrase.trim().length > 0
    );
    if (duplicate) next.phrase = "هذه الكلمة موجودة في القاموس بالفعل.";
    if (pattern.filter((s) => s.type === "vibrate").length === 0)
      next.pattern = "لا يمكن حفظ كلمة من دون نمط اهتزاز (خطوة اهتزاز واحدة على الأقل).";
    if (cooldownSeconds < 0 || cooldownSeconds > 300)
      next.cooldown = "مدة منع التكرار يجب أن تكون بين 0 و300 ثانية.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    const aliasList = aliases
      .split(/[،,]/)
      .map((a) => a.trim())
      .filter(Boolean);
    const now = new Date().toISOString();

    if (editing) {
      updateWord(editing.id, {
        phrase: phrase.trim(),
        aliases: aliasList,
        description: description.trim() || undefined,
        category,
        priority,
        matchInSentence,
        cooldownSeconds,
        repeatCount,
        channel,
        pattern,
      });
    } else {
      addWord({
        id: uid(),
        phrase: phrase.trim(),
        aliases: aliasList,
        description: description.trim() || undefined,
        category,
        priority,
        pattern,
        repeatCount,
        cooldownSeconds,
        matchInSentence,
        channel,
        isEnabled: true,
        detectionCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
    router.push("/dictionary");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="رجوع">
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {editing ? `تعديل «${editing.phrase}»` : "إضافة كلمة أو عبارة"}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            حدد الكلمة وخصائصها ثم صمّم نمط الاهتزاز المرتبط بها.
          </p>
        </div>
      </div>

      <Card>
        <CardTitle>بيانات الكلمة</CardTitle>
        <div className="space-y-4">
          <Input
            label="الكلمة أو العبارة *"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="مثال: سيارة خلفك"
            error={errors.phrase}
          />
          <Input
            label="مرادفات اختيارية (افصل بينها بفاصلة)"
            value={aliases}
            onChange={(e) => setAliases(e.target.value)}
            placeholder="مثال: احذر، دير بالك"
            hint="سيُشغَّل النمط أيضًا عند سماع أي من هذه المرادفات."
          />
          <Textarea
            label="وصف المعنى (اختياري)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="متى تُستخدم هذه الكلمة؟ وما أهميتها؟"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="الفئة" value={category} onChange={(e) => setCategory(e.target.value as WordCategory)}>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
            <Select label="الأولوية" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="مدة منع التكرار (ثانية)"
              type="number"
              min={0}
              max={300}
              value={cooldownSeconds}
              onChange={(e) => setCooldownSeconds(Number(e.target.value) || 0)}
              hint="بعد تشغيل النمط، لن يتكرر لنفس الكلمة خلال هذه المدة."
              error={errors.cooldown}
            />
            <Input
              label="عدد مرات تكرار النمط"
              type="number"
              min={1}
              max={5}
              value={repeatCount}
              onChange={(e) =>
                setRepeatCount(Math.max(1, Math.min(5, Number(e.target.value) || 1)))
              }
            />
          </div>
          <Switch
            checked={matchInSentence}
            onChange={setMatchInSentence}
            label="الاكتشاف داخل الجملة"
            description="عند التفعيل، تُكتشف الكلمة حتى لو وردت وسط جملة طويلة. عند التعطيل، يجب أن تكون الجملة كلها مطابقة."
          />
          <Select
            label="محرك الاهتزاز على السوار"
            value={channel}
            onChange={(e) => setChannel(e.target.value as HapticChannel)}
          >
            {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Card>
        <CardTitle>نمط الاهتزاز *</CardTitle>
        {errors.pattern && (
          <p className="mb-3 text-sm font-medium text-red-600" role="alert">
            {errors.pattern}
          </p>
        )}
        <PatternEditor
          value={pattern}
          onChange={setPattern}
          existingWords={words}
          excludeWordId={editId ?? undefined}
        />
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          إلغاء
        </Button>
        <Button size="lg" onClick={save} aria-label="حفظ الكلمة">
          <Save className="h-5 w-5" aria-hidden />
          {editing ? "حفظ التعديلات" : "حفظ الكلمة"}
        </Button>
      </div>
    </div>
  );
}

export default function WordFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label="جارٍ التحميل">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" aria-hidden />
        </div>
      }
    >
      <WordForm />
    </Suspense>
  );
}
