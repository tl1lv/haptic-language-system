"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HapticChannel, HapticStep } from "@/types";
import { hapticService } from "@/services/haptic.service";
import { deviceService } from "@/services/device.service";
import { useDeviceStore } from "@/stores/device.store";

/**
 * تشغيل نمط اهتزاز مع تتبّع الخطوة النشطة للمحاكاة البصرية.
 * يشغّل محليًا (اهتزاز الهاتف/المحاكاة الصوتية) وأيضًا يرسل النمط
 * إلى السوار السلكي إن كان متصلًا حاليًا — نفس المسار الذي يستخدمه
 * أي زر "تجربة" في التطبيق (القاموس، المصمم، التدريب...).
 */
export function useHapticPlayer() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      hapticService.stop();
    };
  }, []);

  const play = useCallback(
    async (
      pattern: HapticStep[],
      repeatCount = 1,
      channel: HapticChannel = "both"
    ) => {
      if (!pattern.length) return;
      setIsPlaying(true);

      const tasks: Promise<void>[] = [
        hapticService.playPattern(pattern, repeatCount, (index) => {
          if (mountedRef.current) setActiveStep(index);
        }),
      ];
      if (useDeviceStore.getState().status === "connected") {
        tasks.push(deviceService.sendPattern(pattern, repeatCount, channel));
      }
      await Promise.all(tasks);

      if (mountedRef.current) {
        setIsPlaying(false);
        setActiveStep(null);
      }
    },
    []
  );

  const stop = useCallback(() => {
    hapticService.stop();
    setIsPlaying(false);
    setActiveStep(null);
  }, []);

  return { play, stop, activeStep, isPlaying, isSupported: hapticService.isSupported() };
}
