import { describe, it, expect } from "vitest";
import { HapticQueueManager, type QueueItem } from "../haptic-queue";
import type { HapticStep } from "@/types";

function item(id: string): QueueItem {
  return {
    id,
    label: id,
    pattern: [{ id: "s", type: "vibrate", durationMs: 10, intensity: 70 }],
    repeatCount: 1,
    priority: "normal",
    channel: "both",
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("HapticQueueManager - إدارة قائمة انتظار الاهتزازات", () => {
  it("يشغّل العناصر بالتتابع وليس في الوقت نفسه", async () => {
    const played: string[] = [];
    let concurrent = 0;
    let maxConcurrent = 0;

    const player = async (_p: HapticStep[]) => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await wait(20);
      concurrent--;
    };

    const queue = new HapticQueueManager(async (p) => {
      await player(p);
    }, 5);

    const original = queue.enqueue.bind(queue);
    // تتبع الترتيب من خلال الاشتراك
    queue.subscribe(() => {
      const state = queue.getState();
      if (state.playing && !played.includes(state.playing.id)) {
        played.push(state.playing.id);
      }
    });

    original(item("a"));
    original(item("b"));
    original(item("c"));

    await wait(200);
    expect(played).toEqual(["a", "b", "c"]);
    expect(maxConcurrent).toBe(1);
  });

  it("clear يفرغ قائمة الانتظار", async () => {
    const queue = new HapticQueueManager(async () => {
      await wait(50);
    }, 5);
    queue.enqueue(item("a"));
    queue.enqueue(item("b"));
    queue.enqueue(item("c"));
    await wait(10);
    queue.clear();
    const state = queue.getState();
    expect(state.queue).toHaveLength(0);
  });

  it("يسجل آخر عنصر تم تشغيله", async () => {
    const queue = new HapticQueueManager(async () => {
      await wait(5);
    }, 2);
    queue.enqueue(item("x"));
    await wait(50);
    expect(queue.getState().lastPlayed?.id).toBe("x");
  });
});
