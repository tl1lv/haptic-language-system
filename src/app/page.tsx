"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Vibrate,
  Ear,
  Fingerprint,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { Card } from "@/components/ui/Card";

const FEATURES = [
  {
    icon: Ear,
    title: "من الصوت إلى النص",
    description:
      "يلتقط النظام الكلام من البيئة المحيطة عبر الميكروفون ويحوّله إلى نص فوريًا.",
  },
  {
    icon: Fingerprint,
    title: "لغتك أنت",
    description:
      "أنت من يختار الكلمات المهمة، وأنت من يصمم نمط الاهتزاز الخاص بكل كلمة.",
  },
  {
    icon: Vibrate,
    title: "إحساس فوري",
    description:
      "عند اكتشاف كلمة محفوظة، يُشغَّل نمط الاهتزاز المرتبط بها على هاتفك أو سوارك.",
  },
];

export default function WelcomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full text-center"
      >
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-600 text-white shadow-lg shadow-primary-600/25">
          <Vibrate className="h-8 w-8" aria-hidden />
        </span>

        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          نظام اللغة الاهتزازية
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
          نظام مساعد للأشخاص الصم وضعاف السمع يحوّل الكلمات المسموعة من حولك إلى
          لغة اهتزازية شخصية تشعر بها — كلمة «انتبه» لها إيقاع، واسمك له إيقاع
          آخر تعرفه فورًا.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
            >
              <Card className="h-full text-start">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                  <f.icon className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="text-sm font-semibold">{f.title}</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {f.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div
          className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-start text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
          role="note"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>
            هذا النظام وسيلة مساعدة لتعزيز الوعي بالمحيط، وليس بديلًا مضمونًا عن
            أجهزة الإنذار أو الطوارئ الطبية المعتمدة.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/onboarding"
            className="focus-ring inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary-600 px-8 text-base font-semibold text-white shadow-lg shadow-primary-600/25 transition-colors hover:bg-primary-700"
          >
            ابدأ إعداد لغتك الاهتزازية
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <Link
            href="/dashboard"
            className="focus-ring rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:text-primary-600 dark:text-slate-400"
          >
            الانتقال مباشرة إلى لوحة التحكم
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
