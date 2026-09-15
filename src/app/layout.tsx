import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "نظام اللغة الاهتزازية | Haptic Language System",
  description:
    "نظام مساعد للأشخاص الصم وضعاف السمع يحوّل الكلمات المسموعة إلى أنماط اهتزاز شخصية.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#5457e0",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
