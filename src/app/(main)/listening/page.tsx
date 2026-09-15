"use client";

import { useListening } from "@/hooks/useListening";
import { ListeningPanel } from "@/components/listening/ListeningPanel";

export default function ListeningPage() {
  const listening = useListening();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">وضع الاستماع</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          استمع للمحيط أو جرّب المحاكاة النصية، وشاهد الكلمات المكتشفة
          وقائمة الاهتزازات لحظة بلحظة.
        </p>
      </div>
      <ListeningPanel listening={listening} full />
    </div>
  );
}
