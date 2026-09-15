"use client";

import { AppShell } from "@/components/layout/AppShell";
import { useMounted } from "@/hooks/useMounted";
import { Loader2 } from "lucide-react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mounted = useMounted();

  return (
    <AppShell>
      {mounted ? (
        children
      ) : (
        <div
          className="flex min-h-[50vh] items-center justify-center"
          role="status"
          aria-label="جارٍ التحميل"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" aria-hidden />
        </div>
      )}
    </AppShell>
  );
}
