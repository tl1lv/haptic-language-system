"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { HapticStep } from "@/types";
import { useDictionaryStore } from "@/stores/dictionary.store";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PatternEditor } from "@/components/haptics/PatternEditor";

export default function DesignerPage() {
  const router = useRouter();
  const words = useDictionaryStore((s) => s.words);
  const [pattern, setPattern] = useState<HapticStep[]>([]);

  const useInNewWord = () => {
    try {
      sessionStorage.setItem("hls-draft-pattern", JSON.stringify(pattern));
    } catch {
      // تجاهل
    }
    router.push("/dictionary/new");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">مصمم الاهتزازات</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          ركّب نمط اهتزاز من نبضات وتوقفات، وجرّبه، وافحص تشابهه مع أنماطك
          المحفوظة قبل استخدامه.
        </p>
      </div>

      <Card>
        <CardTitle>محرر النمط</CardTitle>
        <PatternEditor
          value={pattern}
          onChange={setPattern}
          existingWords={words}
        />
      </Card>

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={useInNewWord}
          disabled={pattern.filter((s) => s.type === "vibrate").length === 0}
          aria-label="استخدام النمط في كلمة جديدة"
        >
          استخدام النمط في كلمة جديدة
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
