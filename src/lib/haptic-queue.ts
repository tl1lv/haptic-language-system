import type { HapticChannel, HapticStep, Priority } from "@/types";
import { hapticService } from "@/services/haptic.service";
import { deviceService } from "@/services/device.service";
import { useDeviceStore } from "@/stores/device.store";

export type QueueItem = {
  id: string;
  label: string;
  pattern: HapticStep[];
  repeatCount: number;
  priority: Priority;
  channel: HapticChannel;
};

export type QueueState = {
  queue: QueueItem[];
  playing: QueueItem | null;
  lastPlayed: QueueItem | null;
};

type Player = (
  pattern: HapticStep[],
  repeatCount: number | undefined,
  channel: HapticChannel
) => Promise<void>;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * مدير قائمة انتظار الاهتزازات: يشغّل الأنماط واحدًا تلو الآخر
 * مع فاصل زمني واضح بين كل نمطين.
 */
export class HapticQueueManager {
  private queue: QueueItem[] = [];
  private playing: QueueItem | null = null;
  private lastPlayed: QueueItem | null = null;
  private processing = false;
  private listeners = new Set<() => void>();

  constructor(
    private player: Player,
    private gapMs: number = 650
  ) {}

  enqueue(item: QueueItem): void {
    this.queue.push(item);
    this.emit();
    void this.process();
  }

  getState(): QueueState {
    return {
      queue: [...this.queue],
      playing: this.playing,
      lastPlayed: this.lastPlayed,
    };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  clear(): void {
    this.queue = [];
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((l) => l());
  }

  private async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.playing = item;
      this.emit();
      try {
        await this.player(item.pattern, item.repeatCount, item.channel);
      } catch {
        // تجاهل أخطاء التشغيل حتى لا تتوقف القائمة
      }
      this.playing = null;
      this.lastPlayed = item;
      this.emit();
      if (this.queue.length > 0) await delay(this.gapMs);
    }
    this.processing = false;
  }
}

export const hapticQueue = new HapticQueueManager(async (pattern, repeat, channel) => {
  // تشغيل محلي دائمًا (اهتزاز الهاتف/المحاكاة الصوتية)، بالتوازي مع
  // إرسال النمط إلى السوار السلكي إن كان متصلًا حاليًا.
  const tasks: Promise<void>[] = [hapticService.playPattern(pattern, repeat)];
  if (useDeviceStore.getState().status === "connected") {
    tasks.push(deviceService.sendPattern(pattern, repeat, channel));
  }
  await Promise.all(tasks);
});
