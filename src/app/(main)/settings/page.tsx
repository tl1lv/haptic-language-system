"use client";

import { useRef, useState } from "react";
import {
  Download,
  Upload,
  RotateCcw,
  Vibrate,
} from "lucide-react";
import { useSettingsStore } from "@/stores/settings.store";
import { useDictionaryStore } from "@/stores/dictionary.store";
import { useLogsStore } from "@/stores/logs.store";
import { useTrainingStore } from "@/stores/training.store";
import { storageService } from "@/services/storage.service";
import { hapticService } from "@/services/haptic.service";
import { vibrate, pause } from "@/lib/presets";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Modal } from "@/components/ui/Modal";
import type { WordMapping } from "@/types";

const DIALECTS = [
  { value: "ar-SA", label: "العربية (السعودية)" },
  { value: "ar-OM", label: "العربية (عُمان)" },
  { value: "ar-AE", label: "العربية (الإمارات)" },
  { value: "ar-EG", label: "العربية (مصر)" },
  { value: "ar-JO", label: "العربية (الأردن)" },
  { value: "ar-MA", label: "العربية (المغرب)" },
];

export default function SettingsPage() {
  const settings = useSettingsStore();
  const words = useDictionaryStore((s) => s.words);
  const importWords = useDictionaryStore((s) => s.importWords);
  const clearLogs = useLogsStore((s) => s.clearLogs);
  const resetTraining = useTrainingStore((s) => s.reset);

  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const exportDictionary = () => {
    const data = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      words,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "haptic-dictionary.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    setImportMessage(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as { words?: WordMapping[] };
      if (!Array.isArray(data.words)) throw new Error("bad-format");
      const valid = data.words.every(
        (w) => typeof w.phrase === "string" && Array.isArray(w.pattern)
      );
      if (!valid) throw new Error("bad-format");
      importWords(data.words);
      setImportMessage(`تم استيراد ${data.words.length} كلمة بنجاح.`);
    } catch {
      setImportMessage("فشل الاستيراد: الملف غير صالح أو بصيغة غير متوقعة.");
    }
  };

  const resetSystem = () => {
    storageService.clearAppData();
    settings.reset();
    importWords([]);
    clearLogs();
    resetTraining();
    window.location.href = "/";
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">الإعدادات</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          خصص سلوك النظام والخصوصية والاهتزاز الافتراضي.
        </p>
      </div>

      <Card>
        <CardTitle>عام</CardTitle>
        <div className="space-y-4">
          <Input
            label="الاسم"
            value={settings.userName}
            onChange={(e) => settings.update({ userName: e.target.value })}
            placeholder="اسمك"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="اللغة" value={settings.language} disabled>
              <option value="ar">العربية</option>
            </Select>
            <Select
              label="اللهجة"
              value={settings.dialect}
              onChange={(e) => settings.update({ dialect: e.target.value })}
            >
              {DIALECTS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </Select>
          </div>
          <Switch
            checked={settings.theme === "dark"}
            onChange={(v) => settings.update({ theme: v ? "dark" : "light" })}
            label="الوضع الداكن"
            description="الوضع الفاتح هو الافتراضي."
          />
        </div>
      </Card>

      <Card>
        <CardTitle>الاستماع والاكتشاف</CardTitle>
        <div className="space-y-4">
          <Switch
            checked={settings.micAllowed}
            onChange={(v) => settings.update({ micAllowed: v })}
            label="السماح بالميكروفون"
            description="عند التعطيل، يعمل النظام بوضع المحاكاة النصية فقط."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="مدة منع تكرار الكلمة الافتراضية (ثانية)"
              type="number"
              min={0}
              max={300}
              value={settings.defaultCooldownSeconds}
              onChange={(e) =>
                settings.update({
                  defaultCooldownSeconds: Math.max(0, Number(e.target.value) || 0),
                })
              }
            />
            <Input
              label="الحد الأقصى للكلمات في الجملة الواحدة"
              type="number"
              min={1}
              max={10}
              value={settings.maxWordsPerSentence}
              onChange={(e) =>
                settings.update({
                  maxWordsPerSentence: Math.max(1, Math.min(10, Number(e.target.value) || 1)),
                })
              }
            />
          </div>
          <Select
            label="ترتيب تشغيل الكلمات المكتشفة"
            value={settings.playbackOrder}
            onChange={(e) =>
              settings.update({
                playbackOrder: e.target.value as "appearance" | "priority",
              })
            }
          >
            <option value="priority">حسب الأولوية (الطوارئ أولًا)</option>
            <option value="appearance">حسب ترتيب الظهور في الجملة</option>
          </Select>
        </div>
      </Card>

      <Card>
        <CardTitle>الاهتزاز</CardTitle>
        <div className="space-y-4">
          <Switch
            checked={settings.phoneVibration}
            onChange={(v) => settings.update({ phoneVibration: v })}
            label="تفعيل الاهتزاز على الهاتف"
          />
          <Switch
            checked={settings.soundSimulation}
            onChange={(v) => settings.update({ soundSimulation: v })}
            label="المحاكاة الصوتية للأنماط"
            description="نغمة تتبع إيقاع النمط نفسه (المدة والتوقفات والشدة) — مفيدة على الأجهزة التي لا تدعم الاهتزاز مثل iPhone والتابلت والكمبيوتر."
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              شدة الاهتزاز الافتراضية: {settings.defaultIntensity}
            </label>
            <input
              type="range"
              min={1}
              max={100}
              value={settings.defaultIntensity}
              onChange={(e) =>
                settings.update({ defaultIntensity: Number(e.target.value) })
              }
              className="h-2 w-full accent-primary-600"
              aria-label="شدة الاهتزاز الافتراضية"
            />
          </div>
          <Button
            variant="outline"
            onClick={() =>
              hapticService.playPattern([
                vibrate(250, settings.defaultIntensity),
                pause(150),
                vibrate(250, settings.defaultIntensity),
              ])
            }
            aria-label="تجربة الاهتزاز"
          >
            <Vibrate className="h-4 w-4" aria-hidden /> تجربة الاهتزاز
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>الخصوصية</CardTitle>
        <Switch
          checked={settings.saveTranscripts}
          onChange={(v) => settings.update({ saveTranscripts: v })}
          label="حفظ النصوص المكتشفة في السجل"
          description="عند التعطيل، تُحفظ الكلمات المطابقة فقط دون نص الجملة."
        />
      </Card>

      <Card>
        <CardTitle>البيانات</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportDictionary} aria-label="تصدير القاموس">
            <Download className="h-4 w-4" aria-hidden /> تصدير القاموس
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} aria-label="استيراد القاموس">
            <Upload className="h-4 w-4" aria-hidden /> استيراد القاموس
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
              e.target.value = "";
            }}
            aria-hidden
          />
          <Button variant="danger" onClick={() => setConfirmReset(true)} aria-label="إعادة ضبط النظام">
            <RotateCcw className="h-4 w-4" aria-hidden /> إعادة ضبط النظام
          </Button>
        </div>
        {importMessage && (
          <p className="mt-3 text-sm font-medium text-primary-600 dark:text-primary-400" role="status">
            {importMessage}
          </p>
        )}
      </Card>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="إعادة ضبط النظام">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          سيُحذف القاموس والسجل وبيانات التدريب والإعدادات نهائيًا. هل أنت متأكد؟
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmReset(false)}>إلغاء</Button>
          <Button variant="danger" onClick={resetSystem}>إعادة الضبط</Button>
        </div>
      </Modal>
    </div>
  );
}
