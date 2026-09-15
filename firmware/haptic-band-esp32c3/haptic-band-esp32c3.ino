/*
  ══════════════════════════════════════════════════════════════════
  نظام اللغة الاهتزازية — فيرموير XIAO ESP32C3 (اتصال سلكي عبر USB)
  ══════════════════════════════════════════════════════════════════
  يستقبل أوامر اهتزاز من التطبيق عبر منفذ USB التسلسلي (Serial) على
  شكل سطر JSON واحد لكل أمر، وينفذها على محركَي اهتزاز عبر PWM.

  المكتبات المطلوبة (Library Manager في Arduino IDE):
    - ArduinoJson (بقلم Benoit Blanchon) — أي إصدار 6.x أو أحدث

  إعداد اللوحة:
    Tools → Board → esp32 → XIAO_ESP32C3
    (ثبّت حزمة "esp32 by Espressif Systems" من Boards Manager أولًا)

  ─────────────────────────── التوصيل (Wiring) ───────────────────────────
  لكل محرك اهتزاز استخدم ترانزستور MOSFET كمفتاح تحكم — لا تُوصّل
  المحرك مباشرة بأرجل ESP32 (التيار المسحوب من المحرك أعلى من قدرة GPIO):

    XIAO D0 (GPIO2) ──[مقاومة 220Ω]── Gate لترانزستور N-MOSFET (AO3400/2N7000)
                                       Drain ── طرف (+) للمحرك العلوي (Top)
                                       Source ── الأرضية المشتركة (GND)
    المحرك العلوي (-) ── إلى (+) مصدر تغذية المحركات (بطارية LiPo 3.7V
                          أو 5V من USB عبر جهد XIAO الـ 5V)
    ضع دايود تحرير (Flyback، مثل 1N4148) بالتوازي مع طرفي المحرك،
    والكاثود (الخط) جهة الطرف الموجب.

    XIAO D1 (GPIO3) ── نفس الدائرة أعلاه بالضبط للمحرك السفلي (Bottom)

    مهم: اربط GND الخاص بمصدر تغذية المحركات مع GND الخاص بلوحة
    XIAO — أرضية مشتركة إلزامية بين الدائرتين.

  ملاحظة: إذا كانت محركاتك صغيرة جدًا (نوع "عملة" Coin motor، تيار
  تشغيل ~70-100mA فقط) يمكن تجربة توصيلها مؤقتًا مباشرة من GPIO
  للاختبار السريع، لكن يُنصح بشدة باستخدام دائرة الترانزستور أعلاه
  لحماية اللوحة والحصول على تحكم سليم بالشدة عبر PWM.

  ─────────────────────────── البروتوكول ───────────────────────────
  عبر Serial بسرعة 115200 baud، سطر JSON واحد ينتهي بـ \n في كل اتجاه:

    التطبيق → اللوحة:
      {"cmd":"status"}
      {"cmd":"pattern","r":1,"ch":"both","s":[{"t":"v","d":150,"i":80},{"t":"p","d":100}]}
      {"cmd":"sync"}

    اللوحة → التطبيق (ردًا على status/sync، أو عند الإقلاع):
      {"battery":100,"fw":"1.0.0"}

  حقول خطوة النمط: "t" النوع (v = اهتزاز، p = توقف)، "d" المدة
  بالمللي ثانية، "i" الشدة من 1 إلى 100 (يُتجاهل لنوع p).
  حقل "ch" يحدد أي محرك يعمل: "both" (كلاهما، افتراضي)، "top"
  (العلوي فقط، D0)، "bottom" (السفلي فقط، D1).
  ══════════════════════════════════════════════════════════════════
*/

#include <ArduinoJson.h>

// ── إعداد الأرجل والـ PWM ──
const int MOTOR1_PIN = D0;
const int MOTOR2_PIN = D1;

const int PWM_FREQ = 5000;
const int PWM_RESOLUTION = 8; // دقة 8-bit: 0-255
const int PWM_CHANNEL_1 = 0;
const int PWM_CHANNEL_2 = 1;

const char *FW_VERSION = "1.1.0";
const int MAX_STEPS = 32;

// ── حالة تشغيل النمط الحالي (آلة حالة بدون حجب Serial) ──
struct Step {
  bool isVibrate;
  unsigned long durationMs;
  uint8_t intensity; // 1-100
};

enum MotorChannel { CH_BOTH, CH_TOP, CH_BOTTOM };

Step currentPattern[MAX_STEPS];
int patternLength = 0;
int repeatsLeft = 0;
int stepIndex = -1;
unsigned long stepStartedAt = 0;
bool playing = false;
MotorChannel activeChannel = CH_BOTH;

String serialLine;

// duty يُطبَّق فقط على المحرك/المحركات التي يحددها activeChannel،
// والمحرك غير المختار يبقى دائمًا على 0 (متوقف)
void setMotors(uint8_t duty) {
  uint8_t topDuty = (activeChannel == CH_BOTH || activeChannel == CH_TOP) ? duty : 0;
  uint8_t bottomDuty = (activeChannel == CH_BOTH || activeChannel == CH_BOTTOM) ? duty : 0;
  ledcWrite(PWM_CHANNEL_1, topDuty);    // المحرك العلوي (D0)
  ledcWrite(PWM_CHANNEL_2, bottomDuty); // المحرك السفلي (D1)
}

void applyStep(int index) {
  if (index < 0 || index >= patternLength) return;
  Step &s = currentPattern[index];
  if (s.isVibrate) {
    // تحويل الشدة (1-100) إلى دورة عمل PWM (40-255) بحيث تبقى
    // أقل شدة محسوسة فعليًا وليست ضعيفة جدًا لدرجة عدم الشعور بها
    int duty = map(constrain((int)s.intensity, 1, 100), 1, 100, 40, 255);
    setMotors((uint8_t)duty);
  } else {
    setMotors(0);
  }
  stepStartedAt = millis();
}

void stopPattern() {
  playing = false;
  patternLength = 0;
  stepIndex = -1;
  setMotors(0);
}

void startPattern(JsonArray steps, int repeats, MotorChannel channel) {
  activeChannel = channel;
  patternLength = min((int)steps.size(), MAX_STEPS);
  for (int i = 0; i < patternLength; i++) {
    JsonObject step = steps[i];
    const char *type = step["t"] | "v";
    currentPattern[i].isVibrate = (type[0] == 'v');
    currentPattern[i].durationMs = step["d"] | 100;
    currentPattern[i].intensity = step["i"] | 70;
  }
  repeatsLeft = max(1, repeats);
  stepIndex = 0;
  playing = patternLength > 0;
  if (playing) applyStep(0);
}

void sendStatus() {
  StaticJsonDocument<128> doc;
  // لا يوجد قياس بطارية فعلي بعد (يتطلب مقسّم جهد على أرجل ADC) —
  // قيمة ثابتة مؤقتًا حتى تضيف دائرة قياس البطارية الخاصة بك.
  doc["battery"] = 100;
  doc["fw"] = FW_VERSION;
  serializeJson(doc, Serial);
  Serial.print('\n');
}

void handleCommand(const String &line) {
  StaticJsonDocument<1024> doc;
  DeserializationError err = deserializeJson(doc, line);
  if (err) return; // سطر غير صالح — تجاهل بصمت

  const char *cmd = doc["cmd"] | "";
  if (strcmp(cmd, "status") == 0 || strcmp(cmd, "sync") == 0) {
    sendStatus();
  } else if (strcmp(cmd, "pattern") == 0) {
    JsonArray steps = doc["s"].as<JsonArray>();
    int repeats = doc["r"] | 1;
    const char *ch = doc["ch"] | "both";
    MotorChannel channel = CH_BOTH;
    if (strcmp(ch, "top") == 0) channel = CH_TOP;
    else if (strcmp(ch, "bottom") == 0) channel = CH_BOTTOM;
    startPattern(steps, repeats, channel);
  }
}

void setup() {
  Serial.begin(115200);

  ledcSetup(PWM_CHANNEL_1, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(MOTOR1_PIN, PWM_CHANNEL_1);
  ledcSetup(PWM_CHANNEL_2, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(MOTOR2_PIN, PWM_CHANNEL_2);
  setMotors(0);

  serialLine.reserve(256);
}

void loop() {
  // قراءة أوامر واردة من التطبيق سطرًا بسطر
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n') {
      serialLine.trim();
      if (serialLine.length() > 0) handleCommand(serialLine);
      serialLine = "";
    } else if (c != '\r') {
      serialLine += c;
      if (serialLine.length() > 800) serialLine = ""; // حماية من الفيضان
    }
  }

  // تشغيل النمط الحالي كآلة حالة بدون حجب (non-blocking)
  if (playing) {
    Step &s = currentPattern[stepIndex];
    if (millis() - stepStartedAt >= s.durationMs) {
      stepIndex++;
      if (stepIndex >= patternLength) {
        repeatsLeft--;
        if (repeatsLeft > 0) {
          stepIndex = 0;
          applyStep(0);
        } else {
          stopPattern();
        }
      } else {
        applyStep(stepIndex);
      }
    }
  }
}
