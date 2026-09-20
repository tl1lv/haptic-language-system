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

    XIAO D1 (GPIO3) ──[مقاومة 220Ω]── Gate لترانزستور N-MOSFET (AO3400/2N7000)
                                       Drain ── طرف (+) للمحرك العلوي (Top)
                                       Source ── الأرضية المشتركة (GND)
    المحرك العلوي (-) ── إلى (+) مصدر تغذية المحركات (بطارية LiPo 3.7V
                          أو 5V من USB عبر جهد XIAO الـ 5V)
    ضع دايود تحرير (Flyback، مثل 1N4148) بالتوازي مع طرفي المحرك،
    والكاثود (الخط) جهة الطرف الموجب.

    XIAO D2 (GPIO4) ── نفس الدائرة أعلاه بالضبط للمحرك السفلي (Bottom)

    ملاحظة: على هذه اللوحة تحديدًا المحركان "V3.19 Vibration Motor"
    (IN/VCC/GND متكاملة) موصولان مباشرة بـ D1 وD2 دون ترانزستور خارجي —
    مؤكَّد بالاختبار المباشر أنهما يعملان بأمان على هذا التصميم.

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
      {"cmd":"pattern","r":1,"ch":"both","s":[{"t":"v","d":150,"i":80,"ch":"top"},{"t":"p","d":100}]}
      {"cmd":"sync"}

    اللوحة → التطبيق (ردًا على status/sync، أو عند الإقلاع):
      {"battery":100,"fw":"1.1.0"}

  حقول خطوة النمط: "t" النوع (v = اهتزاز، p = توقف)، "d" المدة
  بالمللي ثانية، "i" الشدة من 1 إلى 100 (يُتجاهل لنوع p).
  حقل "ch" على مستوى الخطوة نفسها يحدد أي محرك يعمل لهذه الخطوة
  تحديدًا: "both" (كلاهما)، "top" (العلوي فقط، D0)، "bottom" (السفلي
  فقط، D1) — هذا ما يسمح ببناء نمط يتنقّل بين المحركين (مثلًا: نبضة
  علوية ثم توقف ثم نبضة سفلية). حقل "ch" على مستوى الأمر (خارج "s")
  يبقى كقيمة احتياطية تُستخدم فقط لأي خطوة لا تحمل "ch" خاصًا بها.

  ─────────────────────── ملاحظات إصلاح شدة/إحساس الاهتزاز ───────────────────────
  v1.1.0 كانت تُعاني من ثلاث مشاكل واقعية أبلغ عنها المستخدم بعد
  التجربة على الأجهزة الفعلية، وتم إصلاحها في v1.2.0:
    • الشدة 100 لا تعمل إطلاقًا: بعض ألواح ESP32 تُظهر عطلًا معروفًا
      في وحدة LEDC عند دورة العمل القصوى الكاملة (255 عند دقة 8-bit)
      يجعل الخرج ينقطع بدل أن يكون في أعلى قوته. الحل: سقف دورة العمل
      الآن محدود بـ MAX_DUTY (أقل من 255 بقليل) بدل الوصول للحد الأقصى
      المطلق مهما كانت الشدة المطلوبة 100.
    • اهتزاز ضعيف جدًا أو غير محسوس عند الشدات المنخفضة: كانت أرضية
      دورة العمل 40 فقط من 255، وهي أقل من عتبة انطلاق أغلب محركات
      الاهتزاز الصغيرة (Coin/ERM) التي تحتاج جهد ابتدائي أعلى لكسر
      الاحتكاك الساكن. رُفعت الأرضية إلى MIN_DUTY، وأُضيفت "ضربة
      انطلاق" (kick-start) قصيرة جدًا بأقصى قوة في بداية كل خطوة اهتزاز
      قبل الاستقرار على الشدة المطلوبة — يجعل حتى الشدات المنخفضة جدًا
      محسوسة بوضوح.
    • نبضتان بينهما توقف قصير تُحسّان كنبضة واحدة متصلة: محركات
      الاهتزاز الصغيرة تستمر بالدوران فعليًا لعشرات المللي ثانية بعد
      قطع التيار عنها (قصور ذاتي ميكانيكي)، فإذا كان التوقف بينهما
      أقصر من زمن توقفها الفعلي يندمج الإحساس بالنبضتين كنبضة واحدة
      ممدودة. الحل المضاف: MIN_PAUSE_MS يفرض حدًا أدنى فعليًا لأي خطوة
      توقف حتى لو أرسل التطبيق مدة أقصر، بالإضافة إلى أن ضربة الانطلاق
      أعلاه تجعل بداية كل نبضة تالية أوضح وأكثر تمييزًا رغم القصور
      الذاتي المتبقي من النبضة السابقة.
  ══════════════════════════════════════════════════════════════════
*/

#include <ArduinoJson.h>

// ── إعداد الأرجل والـ PWM ──
// مطابقة للتوصيل الفعلي المؤكَّد على هذه اللوحة تحديدًا (وليس D0/D1
// الافتراضيين): المحرك الأول على D1 (GPIO3) والثاني على D2 (GPIO4).
// تم التأكد بالاختبار المباشر (raw digitalWrite ثم PWM) أن كلا المحركين
// يهتزّان فعليًا على هذين الطرفين بالذات.
const int MOTOR1_PIN = D1;
const int MOTOR2_PIN = D2;

const int PWM_FREQ = 5000;
const int PWM_RESOLUTION = 8; // دقة 8-bit: 0-255
// ملاحظة: إصدار Arduino-ESP32 core المُثبَّت فعليًا هنا (عبر
// platform espressif32@6.9.0) لا يزال يستخدم واجهة LEDC القديمة
// القائمة على رقم قناة (ledcSetup/ledcAttachPin/ledcWrite(channel,...))
// وليس الواجهة الأحدث المبنية على رقم الطرف مباشرة. القناتان أدناه
// ثابتتان ومخصصتان بوضوح لكل محرك.
const int MOTOR1_CHANNEL = 0;
const int MOTOR2_CHANNEL = 1;

const char *FW_VERSION = "1.2.1";
const int MAX_STEPS = 32;

// ── ثوابت معايرة القوة والإحساس بالاهتزاز (انظر الملاحظات أعلى الملف) ──
const uint8_t MAX_DUTY = 250;       // سقف آمن أقل من 255 (تجنّب عطل LEDC عند الحد الأقصى المطلق)
const uint8_t MIN_DUTY = 110;       // أرضية أعلى لضمان تجاوز عتبة انطلاق المحرك
const unsigned long KICK_MS = 25;   // مدة ضربة الانطلاق بأقصى قوة في بداية كل نبضة
const unsigned long MIN_PAUSE_MS = 120; // أقل مدة فعلية لأي خطوة توقف (سماح للمحرك بالتوقف فعليًا)

// ── حالة تشغيل النمط الحالي (آلة حالة بدون حجب Serial) ──
enum MotorChannel { CH_BOTH, CH_TOP, CH_BOTTOM };

struct Step {
  bool isVibrate;
  unsigned long durationMs;
  uint8_t intensity; // 1-100
  MotorChannel channel; // محرك هذه الخطوة تحديدًا
};

Step currentPattern[MAX_STEPS];
int patternLength = 0;
int repeatsLeft = 0;
int stepIndex = -1;
unsigned long stepStartedAt = 0;
bool playing = false;
bool inKickPhase = false;
MotorChannel activeChannel = CH_BOTH;

String serialLine;

MotorChannel parseChannel(const char *ch) {
  if (strcmp(ch, "top") == 0) return CH_TOP;
  if (strcmp(ch, "bottom") == 0) return CH_BOTTOM;
  return CH_BOTH;
}

// duty يُطبَّق فقط على المحرك/المحركات التي يحددها activeChannel،
// والمحرك غير المختار يبقى دائمًا على 0 (متوقف)
void setMotors(uint8_t duty) {
  uint8_t topDuty = (activeChannel == CH_BOTH || activeChannel == CH_TOP) ? duty : 0;
  uint8_t bottomDuty = (activeChannel == CH_BOTH || activeChannel == CH_BOTTOM) ? duty : 0;
  ledcWrite(MOTOR1_CHANNEL, topDuty);    // المحرك العلوي (D1)
  ledcWrite(MOTOR2_CHANNEL, bottomDuty); // المحرك السفلي (D2)
}

void applyStep(int index) {
  if (index < 0 || index >= patternLength) return;
  Step &s = currentPattern[index];
  activeChannel = s.channel;
  if (s.isVibrate) {
    // تحويل الشدة (1-100) إلى دورة عمل PWM ضمن (MIN_DUTY..MAX_DUTY)
    int duty = map(constrain((int)s.intensity, 1, 100), 1, 100, MIN_DUTY, MAX_DUTY);
    // ضربة انطلاق قصيرة بأقصى قوة (MAX_DUTY) لكسر القصور الذاتي فورًا
    // وجعل بداية النبضة محسوسة بوضوح، حتى لو كانت الشدة المطلوبة منخفضة
    // أو مدة الخطوة قصيرة جدًا.
    inKickPhase = s.durationMs > KICK_MS;
    setMotors(inKickPhase ? MAX_DUTY : (uint8_t)duty);
  } else {
    inKickPhase = false;
    setMotors(0);
  }
  stepStartedAt = millis();
}

void stopPattern() {
  playing = false;
  inKickPhase = false;
  patternLength = 0;
  stepIndex = -1;
  setMotors(0);
}

void startPattern(JsonArray steps, int repeats, MotorChannel defaultChannel) {
  patternLength = min((int)steps.size(), MAX_STEPS);
  for (int i = 0; i < patternLength; i++) {
    JsonObject step = steps[i];
    const char *type = step["t"] | "v";
    bool isVibrate = (type[0] == 'v');
    currentPattern[i].isVibrate = isVibrate;
    unsigned long d = step["d"] | 100;
    // فرض حد أدنى فعلي لخطوات التوقف حتى لا تندمج نبضتان متتاليتان
    // في إحساس واحد بسبب القصور الذاتي الميكانيكي للمحرك
    if (!isVibrate && d < MIN_PAUSE_MS) d = MIN_PAUSE_MS;
    currentPattern[i].durationMs = d;
    currentPattern[i].intensity = step["i"] | 70;
    // قناة كل خطوة تحديدًا إن وُجدت، وإلا القناة الافتراضية للأمر كاملًا
    const char *stepCh = step["ch"] | "";
    currentPattern[i].channel = (stepCh[0] != '\0') ? parseChannel(stepCh) : defaultChannel;
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
  // حجم أكبر (2048) لاستيعاب حتى 32 خطوة مع حقل "ch" إضافي لكل خطوة
  StaticJsonDocument<2048> doc;
  DeserializationError err = deserializeJson(doc, line);
  if (err) return; // سطر غير صالح — تجاهل بصمت

  const char *cmd = doc["cmd"] | "";
  if (strcmp(cmd, "status") == 0 || strcmp(cmd, "sync") == 0) {
    sendStatus();
  } else if (strcmp(cmd, "pattern") == 0) {
    JsonArray steps = doc["s"].as<JsonArray>();
    int repeats = doc["r"] | 1;
    const char *ch = doc["ch"] | "both";
    startPattern(steps, repeats, parseChannel(ch));
  }
}

void setup() {
  Serial.begin(115200);

  ledcSetup(MOTOR1_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
  ledcSetup(MOTOR2_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(MOTOR1_PIN, MOTOR1_CHANNEL);
  ledcAttachPin(MOTOR2_PIN, MOTOR2_CHANNEL);
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
    unsigned long elapsed = millis() - stepStartedAt;

    // انتهاء ضربة الانطلاق: الانتقال من أقصى قوة إلى الشدة المطلوبة فعليًا
    if (inKickPhase && elapsed >= KICK_MS) {
      inKickPhase = false;
      int duty = map(constrain((int)s.intensity, 1, 100), 1, 100, MIN_DUTY, MAX_DUTY);
      setMotors((uint8_t)duty);
    }

    if (elapsed >= s.durationMs) {
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
