"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { findMatches, type MatchResult } from "@/lib/phrase-matcher";
import { planPlayback } from "@/lib/detection-engine";
import { normalizeArabicText } from "@/lib/arabic-normalizer";
import { hapticQueue, type QueueState } from "@/lib/haptic-queue";
import { uid } from "@/lib/id";
import { useDictionaryStore } from "@/stores/dictionary.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useLogsStore } from "@/stores/logs.store";
import { speechRecognitionService } from "@/services/speech-recognition.service";

export type ListeningMode = "microphone" | "simulation";

export function useListening() {
  const words = useDictionaryStore((s) => s.words);
  const incrementDetection = useDictionaryStore((s) => s.incrementDetection);
  const addLog = useLogsStore((s) => s.addLog);
  const settings = useSettingsStore();

  const [mode, setMode] = useState<ListeningMode>("simulation");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [recentMatches, setRecentMatches] = useState<MatchResult[]>([]);
  const [queueState, setQueueState] = useState<QueueState>(
    hapticQueue.getState()
  );
  const [lastResponseMs, setLastResponseMs] = useState<number | null>(null);
  const [lastConfidence, setLastConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wordsRef = useRef(words);
  wordsRef.current = words;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const unsubscribe = hapticQueue.subscribe(() => {
      setQueueState(hapticQueue.getState());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    return () => speechRecognitionService.stop();
  }, []);

  const processText = useCallback(
    (text: string, source: ListeningMode): MatchResult[] => {
      const started = performance.now();
      const matches = findMatches(text, wordsRef.current);
      const s = settingsRef.current;
      const planned = planPlayback(matches, {
        maxPerSentence: s.maxWordsPerSentence,
        order: s.playbackOrder,
        defaultCooldownSeconds: s.defaultCooldownSeconds,
      });

      const confidence =
        source === "simulation"
          ? Math.round((0.85 + Math.random() * 0.14) * 100) / 100
          : 0.9;
      const responseTimeMs =
        Math.round(performance.now() - started) +
        (source === "simulation" ? Math.round(40 + Math.random() * 110) : 0);

      for (const match of planned) {
        hapticQueue.enqueue({
          id: uid(),
          label: match.mapping.phrase,
          pattern: match.mapping.pattern,
          repeatCount: match.mapping.repeatCount,
          priority: match.mapping.priority,
          channel: match.mapping.channel,
        });
        incrementDetection(match.mapping.id);
        addLog({
          id: uid(),
          originalText: s.saveTranscripts ? text : "(الحفظ معطل)",
          normalizedText: s.saveTranscripts ? normalizeArabicText(text) : "",
          matchedPhrase: match.matchedVariant,
          wordMappingId: match.mapping.id,
          confidence,
          responseTimeMs,
          source,
          vibrationPlayed: true,
          detectedAt: new Date().toISOString(),
        });
      }

      if (planned.length > 0) {
        setRecentMatches((prev) => [...planned, ...prev].slice(0, 20));
        setLastResponseMs(responseTimeMs);
        setLastConfidence(confidence);
      }
      return planned;
    },
    [addLog, incrementDetection]
  );

  const startMicrophone = useCallback(() => {
    setError(null);
    if (!settingsRef.current.micAllowed) {
      setError("تم تعطيل الميكروفون من الإعدادات.");
      return;
    }
    if (!speechRecognitionService.isSupported()) {
      setError(
        "التعرف الصوتي غير مدعوم في هذا المتصفح. يمكنك استخدام وضع المحاكاة النصية."
      );
      return;
    }
    setIsListening(true);
    speechRecognitionService.start({
      lang: settingsRef.current.dialect,
      onResult: (text, isFinal) => {
        // نحلّل النص الحي فور وصوله (وليس فقط عند اكتمال الجملة)، حتى
        // يُشغَّل النمط بمجرد سماع الكلمة دون الحاجة لإيقاف الميكروفون
        // أو انتظار توقف المتحدث. Cooldown كل كلمة يمنع تكرار تشغيلها
        // من التحديثات المتتالية لنفس المقطع أثناء اكتمال التعرف عليه.
        if (isFinal) {
          setTranscript((prev) => `${prev} ${text}`.trim());
          setInterim("");
        } else {
          setInterim(text);
        }
        if (text.trim()) processText(text, "microphone");
      },
      onError: (err) => {
        setError(
          err === "not-allowed"
            ? "تم رفض إذن الميكروفون. فعّله من إعدادات المتصفح."
            : `تعذّر التعرف الصوتي (${err}). جرّب وضع المحاكاة.`
        );
        setIsListening(false);
      },
      onEnd: () => setIsListening(false),
    });
  }, [processText]);

  const stopListening = useCallback(() => {
    speechRecognitionService.stop();
    setIsListening(false);
    setInterim("");
  }, []);

  const simulate = useCallback(
    (text: string) => {
      if (!text.trim()) return [];
      setTranscript((prev) => (prev ? `${prev}\n${text}` : text));
      return processText(text, "simulation");
    },
    [processText]
  );

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterim("");
    setRecentMatches([]);
  }, []);

  return {
    mode,
    setMode,
    isListening,
    transcript,
    interim,
    recentMatches,
    queueState,
    lastResponseMs,
    lastConfidence,
    error,
    startMicrophone,
    stopListening,
    simulate,
    clearTranscript,
    clearQueue: () => hapticQueue.clear(),
    speechSupported: speechRecognitionService.isSupported(),
  };
}
