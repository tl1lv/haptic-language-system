import type { DeviceInfo, HapticChannel, HapticStep } from "@/types";
import { hapticService } from "./haptic.service";
import { vibrate, pause } from "@/lib/presets";
import { bleDeviceService } from "./ble-device.service";

export interface DeviceService {
  isSupported(): boolean;
  connect(): Promise<DeviceInfo>;
  disconnect(): Promise<void>;
  sendTestVibration(): Promise<void>;
  sendPattern(
    pattern: HapticStep[],
    repeatCount?: number,
    channel?: HapticChannel
  ): Promise<void>;
  syncDictionary(wordCount: number): Promise<{ synced: number }>;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * خدمة جهاز محاكاة (تُستخدم عند عدم توفر Web Serial في المتصفح،
 * مثل سفاري أو كروم على أندرويد التي لا تدعم منافذ USB التسلسلية).
 */
class SimulatedDeviceService implements DeviceService {
  isSupported(): boolean {
    return true; // المحاكاة متاحة دائمًا كخيار احتياطي
  }

  async connect(): Promise<DeviceInfo> {
    await delay(1400);
    return {
      id: "hls-band-001",
      name: "HLS Band Pro (محاكاة)",
      batteryPercent: 82,
      signalRssi: -58,
      firmwareVersion: "1.2.4",
      firmwareStatus: "up-to-date",
      lastConnectedAt: new Date().toISOString(),
    };
  }

  async disconnect(): Promise<void> {
    await delay(400);
  }

  async sendTestVibration(): Promise<void> {
    await hapticService.playPattern([
      vibrate(200, 80),
      pause(150),
      vibrate(200, 80),
    ]);
  }

  async sendPattern(pattern: HapticStep[], repeatCount = 1): Promise<void> {
    // المحاكاة لا تفرّق بين المحركين (جهاز افتراضي بلا قنوات).
    // القوة تُفرض دائمًا على الأقصى هنا أيضًا، لتطابق سلوك الجهاز الحقيقي.
    const maxed = pattern.map((step) =>
      step.type === "vibrate" ? { ...step, intensity: 100 } : step
    );
    await hapticService.playPattern(maxed, repeatCount);
  }

  async syncDictionary(wordCount: number): Promise<{ synced: number }> {
    await delay(1800);
    return { synced: wordCount };
  }
}

// ═══════════════════════════════════════════════════════════════
// خدمة سلكية حقيقية عبر Web Serial — تتصل بسوار XIAO ESP32C3
// بكابل USB-C مباشرة (بدون بلوتوث حاليًا).
//
// البروتوكول: كل رسالة سطر JSON واحد ينتهي بـ \n في الاتجاهين:
//   التطبيق → الجهاز: {"cmd":"pattern","r":1,"s":[{"t":"v","d":150,"i":80}]}
//   الجهاز → التطبيق: {"battery":100,"fw":"1.0.0"}
// نفس التنسيق المستخدم في firmware/haptic-band-esp32c3/*.ino
// ═══════════════════════════════════════════════════════════════

class WebSerialDeviceService implements DeviceService {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private lineBuffer = "";
  private latestStatus: { battery?: number; fw?: string } = {};
  private statusResolvers: Array<() => void> = [];

  isSupported(): boolean {
    return typeof navigator !== "undefined" && Boolean((navigator as any).serial);
  }

  async connect(): Promise<DeviceInfo> {
    const serial = (navigator as any).serial;
    if (!serial) throw new Error("serial-not-supported");

    // نافذة اختيار منفذ USB التي يعرضها المتصفح — يختار المستخدم
    // منها منفذ الـ XIAO ESP32C3 (يظهر عادة باسم يحتوي CP2104 أو USB Serial)
    const port = await serial.requestPort();
    await port.open({ baudRate: 115200 });

    this.port = port;
    this.lineBuffer = "";
    this.latestStatus = {};
    this.writer = port.writable.getWriter();
    this.reader = port.readable.getReader();
    void this.readLoop();

    await this.send({ cmd: "status" });
    await this.waitForStatus(1200);

    return {
      id: "xiao-esp32c3-usb",
      name: "HLS-Band (XIAO ESP32C3 عبر USB)",
      batteryPercent: this.latestStatus.battery ?? 100,
      signalRssi: 0,
      firmwareVersion: this.latestStatus.fw ?? "غير معروف",
      firmwareStatus: "up-to-date",
      lastConnectedAt: new Date().toISOString(),
    };
  }

  private async readLoop(): Promise<void> {
    const decoder = new TextDecoder();
    try {
      while (this.reader) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          this.lineBuffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = this.lineBuffer.indexOf("\n")) !== -1) {
            const line = this.lineBuffer.slice(0, idx).trim();
            this.lineBuffer = this.lineBuffer.slice(idx + 1);
            if (line) this.handleLine(line);
          }
        }
      }
    } catch {
      // انقطع الاتصال أو أُغلق المنفذ — طبيعي عند الفصل
    }
  }

  private handleLine(line: string): void {
    try {
      const data = JSON.parse(line) as { battery?: number; fw?: string };
      if (typeof data.battery === "number") this.latestStatus.battery = data.battery;
      if (data.fw) this.latestStatus.fw = data.fw;
    } catch {
      // سطر غير JSON (رسالة تصحيح من الفيرموير مثلًا) — تجاهل
    }
    const resolvers = this.statusResolvers;
    this.statusResolvers = [];
    resolvers.forEach((r) => r());
  }

  private waitForStatus(timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, timeoutMs);
      this.statusResolvers.push(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  private async send(payload: unknown): Promise<void> {
    if (!this.writer) return;
    const bytes = new TextEncoder().encode(JSON.stringify(payload) + "\n");
    try {
      await this.writer.write(bytes);
    } catch {
      // تجاهل فشل الإرسال (الكابل فُصل مثلًا) حتى لا تتوقف قائمة الانتظار
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.reader?.cancel();
    } catch {
      /* تجاهل */
    }
    try {
      this.reader?.releaseLock();
    } catch {
      /* تجاهل */
    }
    try {
      this.writer?.releaseLock();
    } catch {
      /* تجاهل */
    }
    try {
      await this.port?.close();
    } catch {
      /* تجاهل */
    }
    this.port = null;
    this.reader = null;
    this.writer = null;
  }

  async sendTestVibration(): Promise<void> {
    await this.sendPattern([vibrate(200, 80), pause(150), vibrate(200, 80)]);
  }

  async sendPattern(
    pattern: HapticStep[],
    repeatCount = 1,
    defaultChannel: HapticChannel = "both"
  ): Promise<void> {
    // كل خطوة تحمل محركها الخاص (step.channel) إن حُدد، وإلا فالمحرك
    // الافتراضي للكلمة (defaultChannel) — هذا ما يسمح بتناوب محرك
    // الاهتزاز العلوي/السفلي داخل نمط الكلمة الواحدة.
    //
    // القوة المرسلة فعليًا للجهاز دائمًا 100 (أقصى قوة)، بطلب صريح من
    // المستخدم، بصرف النظر عن القيمة المضبوطة في مصمم الأنماط — الشدة
    // المعروضة في الواجهة تبقى كما صمّمها المستخدم (لأغراض العرض
    // والتصميم المستقبلي)، لكن ما يصل فعليًا للمحرك هو الحد الأقصى دومًا.
    await this.send({
      cmd: "pattern",
      r: Math.max(1, repeatCount),
      ch: defaultChannel,
      s: pattern.map((step) => ({
        t: step.type === "vibrate" ? "v" : "p",
        d: step.durationMs,
        i: step.type === "vibrate" ? 100 : step.intensity,
        ch: step.channel ?? defaultChannel,
      })),
    });
  }

  async syncDictionary(wordCount: number): Promise<{ synced: number }> {
    // الفيرموير الحالي لا يخزّن قاموسًا خاصًا به — القرار والتوقيت من
    // التطبيق نفسه، والجهاز ينفّذ فقط الأنماط المُرسلة إليه لحظيًا.
    await this.send({ cmd: "sync" });
    return { synced: wordCount };
  }
}

const webSerialService = new WebSerialDeviceService();
const simulatedService = new SimulatedDeviceService();

/**
 * ترتيب الأفضلية: بلوتوث حقيقي (Web Bluetooth) أولًا — هذا ما يطلبه
 * المستخدم صراحةً ويسمح بارتداء السوار بعيدًا عن الحاسوب دون كابل —
 * ثم Web Serial السلكي كبديل إن كان المتصفح لا يدعم Web Bluetooth
 * (سفاري مثلًا يدعم الاثنين معًا بشرط تفعيل الأعلام التجريبية، بينما
 * كروم/إيدج على سطح المكتب يدعمان Web Bluetooth افتراضيًا)، ثم أخيرًا
 * وضع المحاكاة إن لم يتوفر أي منهما.
 */
export const deviceService: DeviceService = bleDeviceService.isSupported()
  ? bleDeviceService
  : webSerialService.isSupported()
    ? webSerialService
    : simulatedService;
