import { describe, it, expect } from "vitest";

// النسخة الداخلية من crc8/encodeFrame غير مُصدَّرة من ble-device.service.ts
// (الملف خدمة متصلة بـ navigator.bluetooth الحقيقي، غير مناسب للاستيراد
// المباشر في بيئة اختبار بلا متصفح). هذا الاختبار يعيد بناء نفس منطق
// CRC-8 المستخدم فعليًا في الخدمة والفيرموير (poly 0x07, init 0x00)
// للتأكد من تطابقه مع القيمة المرجعية القياسية ومع الطرف الآخر (ESP32).

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

describe("BLE protocol CRC-8", () => {
  it("يطابق القيمة المرجعية القياسية لـ CRC-8/ATM على '123456789'", () => {
    const bytes = Array.from("123456789").map((c) => c.charCodeAt(0));
    expect(crc8(bytes)).toBe(0xf4);
  });

  it("يعطي صفرًا لمصفوفة فارغة", () => {
    expect(crc8([])).toBe(0x00);
  });

  it("يتغيّر عند تغيّر أي بايت واحد (يكتشف التلف)", () => {
    const original = [0x01, 0x04, 0x07, 0x00, 0x64, 0x00, 0x00];
    const corrupted = [...original];
    corrupted[3] ^= 0xff;
    expect(crc8(original)).not.toBe(crc8(corrupted));
  });
});
