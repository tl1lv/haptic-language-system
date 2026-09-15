import type { HapticStep } from "@/types";
import { audioFeedbackService } from "./audio-feedback.service";
import { useSettingsStore } from "@/stores/settings.store";

export type StepCallback = (stepIndex: number | null) => void;

export interface HapticService {
  isSupported(): boolean;
  playPattern(
    pattern: HapticStep[],
    repeatCount?: number,
    onStep?: StepCallback
  ): Promise<void>;
  stop(): void;
}

/**
 * تنفيذ ويب يعتمد على navigator.vibrate عند توفره،
 * مع محاكاة صوتية (Web Audio) ومحاكاة بصرية عبر onStep.
 * منطق التطبيق لا يعتمد مباشرة على navigator.vibrate — يمكن استبدال
 * هذه الخدمة لاحقًا باتصال سوار Bluetooth دون تعديل الواجهات.
 */
class WebHapticService implements HapticService {
  private timeouts: ReturnType<typeof setTimeout>[] = [];

  isSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.vibrate === "function"
    );
  }

  private soundEnabled(): boolean {
    try {
      return useSettingsStore.getState().soundSimulation;
    } catch {
      return false;
    }
  }

  private vibrationEnabled(): boolean {
    try {
      return useSettingsStore.getState().phoneVibration;
    } catch {
      return true;
    }
  }

  playPattern(
    pattern: HapticStep[],
    repeatCount = 1,
    onStep?: StepCallback
  ): Promise<void> {
    this.stop();
    const steps: HapticStep[] = [];
    for (let r = 0; r < Math.max(1, repeatCount); r++) steps.push(...pattern);
    if (steps.length === 0) return Promise.resolve();

    if (this.isSupported() && this.vibrationEnabled()) {
      // تحويل الخطوات إلى صيغة navigator.vibrate: [اهتزاز, توقف, اهتزاز, ...]
      const sequence: number[] = [];
      for (const step of steps) {
        const slotIsVibrate = sequence.length % 2 === 0;
        if ((step.type === "vibrate") !== slotIsVibrate) sequence.push(0);
        sequence.push(step.durationMs);
      }
      try {
        navigator.vibrate(sequence);
      } catch {
        // تجاهل: المحاكاة تستمر
      }
    }

    // المحاكاة الصوتية: نغمة تتبع النمط نفسه (مفيدة حيث لا يوجد اهتزاز)
    if (this.soundEnabled()) {
      audioFeedbackService.schedule(steps);
    }

    return new Promise<void>((resolve) => {
      let elapsed = 0;
      steps.forEach((step, index) => {
        this.timeouts.push(setTimeout(() => onStep?.(index), elapsed));
        elapsed += step.durationMs;
      });
      this.timeouts.push(
        setTimeout(() => {
          onStep?.(null);
          resolve();
        }, elapsed)
      );
    });
  }

  stop(): void {
    this.timeouts.forEach((t) => clearTimeout(t));
    this.timeouts = [];
    audioFeedbackService.stop();
    if (this.isSupported()) {
      try {
        navigator.vibrate(0);
      } catch {
        // تجاهل
      }
    }
  }
}

export const hapticService: HapticService = new WebHapticService();
