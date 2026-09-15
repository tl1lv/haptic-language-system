import type { HapticStep } from "@/types";

/**
 * محاكاة صوتية لأنماط الاهتزاز عبر Web Audio API.
 * كل خطوة اهتزاز = نغمة بنفس المدة، وعلو الصوت يتبع الشدة (1-100).
 * مفيدة على الأجهزة بلا محرك اهتزاز (iPhone، التابلت، الكمبيوتر).
 */
class AudioFeedbackService {
  private ctx: AudioContext | null = null;
  private activeOscillators: OscillatorNode[] = [];

  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    return Boolean(w.AudioContext || w.webkitAudioContext);
  }

  private getContext(): AudioContext | null {
    if (!this.isSupported()) return null;
    if (!this.ctx) {
      const w = window as unknown as {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const Ctor = w.AudioContext ?? w.webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    // يجب استدعاؤها ضمن تفاعل مستخدم (ضغطة زر) أول مرة
    void this.ctx.resume();
    return this.ctx;
  }

  /** جدولة صوت النمط كاملًا بتوقيت دقيق */
  schedule(steps: HapticStep[]): void {
    const ctx = this.getContext();
    if (!ctx) return;

    let t = ctx.currentTime + 0.03;
    for (const step of steps) {
      const dur = step.durationMs / 1000;
      if (step.type === "vibrate") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        // صوت "أزيز" منخفض يشبه إحساس الاهتزاز
        osc.type = "square";
        osc.frequency.value = 150;
        const volume = 0.3 * (Math.max(1, step.intensity) / 100);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(volume, t + 0.012);
        gain.gain.setValueAtTime(volume, Math.max(t + 0.012, t + dur - 0.015));
        gain.gain.linearRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur + 0.03);
        this.activeOscillators.push(osc);
        osc.onended = () => {
          this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
        };
      }
      t += dur;
    }
  }

  stop(): void {
    for (const osc of this.activeOscillators) {
      try {
        osc.stop();
      } catch {
        // تجاهل
      }
    }
    this.activeOscillators = [];
  }
}

export const audioFeedbackService = new AudioFeedbackService();
