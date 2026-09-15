"use client";

import {
  Watch,
  Battery,
  Signal,
  Usb,
  Unplug,
  Vibrate,
  RefreshCw,
  Cpu,
  Loader2,
} from "lucide-react";
import { useDeviceStore } from "@/stores/device.store";
import { useDictionaryStore } from "@/stores/dictionary.store";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DevicesPage() {
  const { status, info, syncing, lastSyncCount, error, connect, disconnect, sendTest, sync } =
    useDeviceStore();
  const wordCount = useDictionaryStore((s) => s.words.length);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">الأجهزة المتصلة</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          إدارة السوار القابل للارتداء (XIAO ESP32C3) عبر اتصال سلكي بكابل
          USB-C. البنية جاهزة لإضافة اتصال Bluetooth لاحقًا دون تعديل الواجهات.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300" role="alert">
          {error}
        </p>
      )}

      {status === "disconnected" && (
        <EmptyState
          icon={Watch}
          title="لا يوجد جهاز متصل"
          description="وصّل الـ XIAO ESP32C3 بكابل USB-C بالكمبيوتر، ثم اضغط الزر واختر منفذه من نافذة المتصفح."
          action={
            <Button size="lg" onClick={connect} aria-label="التوصيل عبر USB">
              <Usb className="h-5 w-5" aria-hidden /> توصيل عبر USB
            </Button>
          }
        />
      )}

      {status === "connecting" && (
        <Card className="flex items-center justify-center gap-3 py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" aria-hidden />
          <p className="text-sm font-medium">جارٍ الاتصال بالجهاز...</p>
        </Card>
      )}

      {status === "connected" && info && (
        <>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                  <Watch className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <p className="font-bold">{info.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    آخر اتصال:{" "}
                    {info.lastConnectedAt
                      ? new Date(info.lastConnectedAt).toLocaleString("ar", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
              <Badge variant="success">متصل</Badge>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <Battery className="mx-auto mb-1 h-5 w-5 text-emerald-500" aria-hidden />
                <p className="text-lg font-bold">{info.batteryPercent}٪</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">البطارية</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <Signal className="mx-auto mb-1 h-5 w-5 text-secondary-500" aria-hidden />
                <p className="text-lg font-bold">سلكي (USB)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">نوع الاتصال</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <Cpu className="mx-auto mb-1 h-5 w-5 text-primary-500" aria-hidden />
                <p className="text-lg font-bold">{info.firmwareVersion}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {info.firmwareStatus === "up-to-date" ? "برامج محدثة" : "تحديث متاح"}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>إجراءات الجهاز</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button onClick={sendTest} aria-label="إرسال اهتزاز تجريبي">
                <Vibrate className="h-4 w-4" aria-hidden /> اهتزاز تجريبي
              </Button>
              <Button variant="secondary" onClick={() => sync(wordCount)} disabled={syncing} aria-label="مزامنة قاموس الاهتزازات">
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="h-4 w-4" aria-hidden />
                )}
                {syncing ? "جارٍ المزامنة..." : "مزامنة القاموس"}
              </Button>
              <Button variant="outline" onClick={disconnect} aria-label="فصل الجهاز">
                <Unplug className="h-4 w-4" aria-hidden /> فصل
              </Button>
            </div>
            {lastSyncCount !== null && !syncing && (
              <p className="mt-3 text-sm text-emerald-600" role="status">
                تمت مزامنة {lastSyncCount} كلمة مع الجهاز بنجاح.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
