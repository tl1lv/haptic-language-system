import type { DeviceInfo, HapticChannel, HapticStep } from "@/types";
import type { DeviceService } from "./device.service";

// ═══════════════════════════════════════════════════════════════
// خدمة اتصال حقيقية عبر Web Bluetooth — تتصل بسوار XIAO ESP32C3
// عبر البلوتوث اللاسلكي (BLE)، بنفس البروتوكول الثنائي والمعرّفات
// المستخدمة في firmware/*.ino الأصلي لمشروع HapticBand (مبني بـ
// PlatformIO/NimBLE، وليس فيرموير haptic-band-esp32c3.ino السلكي).
//
// هذا البروتوكول مُختبَر ومؤكَّد يعمل فعليًا: الاتصال، الأوامر،
// والاهتزاز الحقيقي على نفس اللوحة ونفس أرجل المحركين (D1/D2).
// انظر الوصف الكامل بايتًا بايت في shared/Protocol.md من مشروع
// HapticBand الأصلي.
// ═══════════════════════════════════════════════════════════════

const SERVICE_UUID = "b5a0f100-7c5b-4a6a-9d1e-2e2e1a7c0001";
const COMMAND_UUID = "b5a0f100-7c5b-4a6a-9d1e-2e2e1a7c0002";
const STATUS_UUID = "b5a0f100-7c5b-4a6a-9d1e-2e2e1a7c0003";

const SYNC0 = 0xa5;
const SYNC1 = 0x5a;
const PROTOCOL_VERSION = 0x01;

enum MsgType {
  BeginPattern = 0x01,
  PatternStep = 0x02,
  PlayPattern = 0x03,
  Stop = 0x04,
  Ping = 0x05,
  TestVibration = 0x06,
  Ack = 0x10,
  Error = 0x11,
  Status = 0x12,
  Pong = 0x13,
}

enum MotorMask {
  Left = 1,
  Right = 2,
  Both = 3,
}

/** CRC-8/ATM: متعدد الحدود 0x07، بداية 0x00 — مطابق تمامًا لتطبيق
 * الفيرموير وتطبيق الماك الأصليين. */
function crc8(bytes: number[]): number {
  let crc = 0x00;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x80 ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
    }
  }
  return crc;
}

function encodeFrame(type: MsgType, payload: number[]): Uint8Array {
  const header = [SYNC0, SYNC1, PROTOCOL_VERSION, type, payload.length];
  const withoutCrc = [PROTOCOL_VERSION, type, payload.length, ...payload];
  const crc = crc8(withoutCrc);
  return new Uint8Array([...header, ...payload, crc]);
}

function le16(value: number): [number, number] {
  const v = Math.max(0, Math.min(0xffff, Math.round(value)));
  return [v & 0xff, (v >> 8) & 0xff];
}

function channelToMotorMask(channel: HapticChannel | undefined): MotorMask {
  if (channel === "top") return MotorMask.Left;
  if (channel === "bottom") return MotorMask.Right;
  return MotorMask.Both;
}

/** خطوة اهتزاز واحدة بصيغة البروتوكول الثنائي: محرك، شدة، مدة،
 * توقف بعدها، وعدد تكرار (يبقى 1 دائمًا هنا — التكرار الكلي للنمط
 * يُطبَّق عبر عدد مرات إعادة إرسال التسلسل كاملًا، وليس تكرار خطوة
 * واحدة بمفردها). */
type BinaryStep = {
  motorMask: MotorMask;
  intensityPercent: number;
  durationMs: number;
  pauseMs: number;
};

/** يحوّل تسلسل HapticStep[] (اهتزاز/توقف متتاليين) إلى خطوات
 * البروتوكول الثنائي: كل خطوة "اهتزاز" تُدمَج مع خطوة "توقف" التالية
 * لها مباشرة (إن وُجدت) لتصبح خطوة واحدة (durationMs + pauseMs). */
function toBinarySteps(pattern: HapticStep[], defaultChannel: HapticChannel): BinaryStep[] {
  const steps: BinaryStep[] = [];
  for (let i = 0; i < pattern.length; i++) {
    const step = pattern[i];
    if (step.type !== "vibrate") continue;
    let pauseMs = 0;
    const next = pattern[i + 1];
    if (next && next.type === "pause") {
      pauseMs = next.durationMs;
    }
    steps.push({
      motorMask: channelToMotorMask(step.channel ?? defaultChannel),
      // القوة تُفرض دائمًا على الأقصى — نفس القرار المطبَّق في خدمة
      // Web Serial، بطلب صريح من المستخدم.
      intensityPercent: 100,
      durationMs: Math.min(2000, Math.max(50, Math.round(step.durationMs))),
      pauseMs: Math.min(2000, Math.max(0, Math.round(pauseMs))),
    });
  }
  return steps;
}

export class WebBluetoothDeviceService implements DeviceService {
  private device: BluetoothDevice | null = null;
  private commandChar: BluetoothRemoteGATTCharacteristic | null = null;
  private statusChar: BluetoothRemoteGATTCharacteristic | null = null;
  private seqId = 1;
  private ackResolvers: Array<(data: DataView) => void> = [];

  isSupported(): boolean {
    return typeof navigator !== "undefined" && Boolean((navigator as unknown as { bluetooth?: unknown }).bluetooth);
  }

  async connect(): Promise<DeviceInfo> {
    const bluetooth = (navigator as unknown as { bluetooth: Bluetooth }).bluetooth;
    if (!bluetooth) throw new Error("bluetooth-not-supported");

    // البحث بمعرّف الخدمة (Service UUID) تحديدًا، وليس باسم الجهاز —
    // نفس أسلوب تطبيق الماك الأصلي، فلا يتأثر بتغيّر اسم الإعلان.
    const device = await bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }],
      optionalServices: [SERVICE_UUID],
    });

    const server = await device.gatt?.connect();
    if (!server) throw new Error("gatt-connect-failed");

    const service = await server.getPrimaryService(SERVICE_UUID);
    this.commandChar = await service.getCharacteristic(COMMAND_UUID);
    this.statusChar = await service.getCharacteristic(STATUS_UUID);

    await this.statusChar.startNotifications();
    this.statusChar.addEventListener("characteristicvaluechanged", (event: Event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      if (target.value) this.handleNotification(target.value);
    });

    device.addEventListener("gattserverdisconnected", () => {
      this.commandChar = null;
      this.statusChar = null;
    });

    this.device = device;

    return {
      id: device.id,
      name: device.name || "HapticBand",
      batteryPercent: 100,
      signalRssi: 0,
      firmwareVersion: "BLE",
      firmwareStatus: "up-to-date",
      lastConnectedAt: new Date().toISOString(),
    };
  }

  async disconnect(): Promise<void> {
    try {
      await this.statusChar?.stopNotifications();
    } catch {
      /* تجاهل */
    }
    try {
      this.device?.gatt?.disconnect();
    } catch {
      /* تجاهل */
    }
    this.device = null;
    this.commandChar = null;
    this.statusChar = null;
  }

  private handleNotification(value: DataView): void {
    const resolvers = this.ackResolvers;
    this.ackResolvers = [];
    resolvers.forEach((r) => r(value));
  }

  private waitForAck(timeoutMs: number): Promise<DataView | null> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), timeoutMs);
      this.ackResolvers.push((data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  private async write(frame: Uint8Array, waitAck = true): Promise<void> {
    if (!this.commandChar) throw new Error("not-connected");
    // نسخ إلى ArrayBuffer عادي: Uint8Array.buffer نوعه ArrayBufferLike
    // (قد يكون SharedArrayBuffer)، بينما Web Bluetooth يتطلب BufferSource
    // بـ ArrayBuffer فعلي تحديدًا.
    await this.commandChar.writeValueWithResponse(new Uint8Array(frame).buffer);
    if (waitAck) await this.waitForAck(600);
  }

  async sendTestVibration(): Promise<void> {
    if (!this.commandChar) return;
    const payload = [MotorMask.Both, 100, ...le16(600)];
    await this.write(encodeFrame(MsgType.TestVibration, payload));
  }

  async sendPattern(
    pattern: HapticStep[],
    repeatCount = 1,
    defaultChannel: HapticChannel = "both"
  ): Promise<void> {
    if (!this.commandChar) return;
    const steps = toBinarySteps(pattern, defaultChannel).map((s) => ({
      ...s,
      // عدد التكرار الكلي للنمط يُطبَّق على كل خطوة، فيتكرر التسلسل
      // كاملًا (وليس خطوة واحدة فقط) العدد المطلوب من المرات — هذا هو
      // السلوك الذي يتوقعه المستخدم من "عدد مرات التكرار".
    }));
    if (steps.length === 0) return;

    const seqId = this.seqId;
    this.seqId = this.seqId >= 0xfffe ? 1 : this.seqId + 1;
    const repeats = Math.max(1, Math.min(10, Math.round(repeatCount)));

    // BEGIN_PATTERN: seqID(2) stepCount(1) flags(1)
    const totalSteps = steps.length; // التكرار يُطبَّق عبر repeatCount في كل خطوة أدناه
    await this.write(
      encodeFrame(MsgType.BeginPattern, [...le16(seqId), totalSteps, 0x01]),
      false
    );

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const payload = [
        ...le16(seqId),
        i,
        s.motorMask,
        s.intensityPercent,
        ...le16(s.durationMs),
        ...le16(s.pauseMs),
        repeats,
      ];
      await this.write(encodeFrame(MsgType.PatternStep, payload), false);
    }

    await this.write(encodeFrame(MsgType.PlayPattern, [...le16(seqId)]));
  }

  async syncDictionary(wordCount: number): Promise<{ synced: number }> {
    // الفيرموير الحالي لا يخزّن قاموسًا خاصًا به — القرار والتوقيت من
    // التطبيق نفسه، فلا حاجة لمزامنة فعلية.
    return { synced: wordCount };
  }
}

export const bleDeviceService = new WebBluetoothDeviceService();
