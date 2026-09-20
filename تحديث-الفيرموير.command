#!/bin/bash
# رفع فيرموير v1.2.0 المحدّث على سوار XIAO ESP32C3 تلقائيًا عبر arduino-cli
# (بديل عن فتح Arduino IDE يدويًا) — يتطلب توصيل السوار بكابل USB-C أولًا.
set -e
cd "$(dirname "$0")/firmware/haptic-band-esp32c3"

echo "═══════════════════════════════════════════"
echo "   تحديث فيرموير سوار XIAO ESP32C3"
echo "═══════════════════════════════════════════"

echo ""
echo "١) التأكد من وجود arduino-cli..."
if ! command -v arduino-cli >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "   تثبيت arduino-cli عبر Homebrew (قد يأخذ دقيقة)..."
    brew install arduino-cli
  else
    echo "أداة arduino-cli غير موجودة، ولا يوجد Homebrew على جهازك."
    echo "ثبّت Homebrew من https://brew.sh ثم أعد تشغيل هذا الملف."
    read -p "اضغط Enter للإغلاق..."
    exit 1
  fi
fi

echo ""
echo "٢) إعداد فهرس حزم ESP32 (أول مرة فقط)..."
arduino-cli config init --overwrite >/dev/null 2>&1 || true
arduino-cli config set board_manager.additional_urls https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
arduino-cli core update-index

echo ""
echo "٣) تثبيت حزمة لوحات ESP32 إن لم تكن مثبتة (قد يأخذ عدة دقائق أول مرة)..."
arduino-cli core install esp32:esp32

echo ""
echo "٤) تثبيت مكتبة ArduinoJson..."
arduino-cli lib install ArduinoJson

echo ""
echo "٥) البحث عن السوار الموصول..."
echo "   (كل منافذ USB التسلسلية المكتشفة حاليًا:)"
arduino-cli board list
echo ""

# نستبعد صراحة منفذ البلوتوث الوهمي الدائم الوجود على ماك (Bluetooth-Incoming-Port)،
# ونفضّل أنماط أسماء منافذ USB الحقيقية الشائعة لـ ESP32C3 (USB CDC مدمج أو محول
# CP2102/CH340 خارجي): usbmodem, usbserial, wchusbserial, slab
PORT=$(arduino-cli board list | grep -v -i "bluetooth" | grep -i "usbmodem\|usbserial\|wchusbserial\|slab" | head -1 | awk '{print $1}')

if [ -z "$PORT" ]; then
  echo "⚠️  لم أجد منفذ USB حقيقي لسوار (استبعدت منفذ البلوتوث الوهمي)."
  echo "تأكد من:"
  echo "  • توصيل XIAO ESP32C3 بكابل USB-C بيانات (وليس كابل شحن فقط)"
  echo "  • أن اللوحة مضاءة (يجب أن يظهر لها ضوء LED)"
  echo "ثم أعد تشغيل هذا الملف."
  read -p "اضغط Enter للإغلاق..."
  exit 1
fi

echo "   وُجد منفذ: $PORT"

echo ""
echo "٦) ترجمة الكود ورفعه على اللوحة..."
arduino-cli compile --fqbn esp32:esp32:XIAO_ESP32C3 .
arduino-cli upload -p "$PORT" --fqbn esp32:esp32:XIAO_ESP32C3 .

echo ""
echo "═══════════════════════════════════════════"
echo " تم رفع فيرموير v1.2.1 بنجاح على السوار!"
echo " الإصلاحات: الشدة 100، الاهتزاز الضعيف، اندماج النبضتين،"
echo " ودعم محرك منفصل لكل خطوة."
echo " أعد توصيل السوار من صفحة 'الأجهزة المتصلة' في التطبيق."
echo "═══════════════════════════════════════════"
read -p "اضغط Enter للإغلاق..."
