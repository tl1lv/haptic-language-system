# نظام اللغة الاهتزازية — Haptic Language System

نموذج أولي لنظام مساعد للأشخاص الصم وضعاف السمع: يلتقط الكلام من المحيط،
يحوّله إلى نص، يكتشف الكلمات التي اختارها المستخدم، ويشغّل نمط الاهتزاز
الشخصي المرتبط بكل كلمة.

المسار: ميكروفون ← تحويل الكلام إلى نص ← تطبيع النص العربي ← اكتشاف الكلمات
والمرادفات ← ترتيب حسب الأولوية ومنع التكرار ← قائمة انتظار ← تشغيل الاهتزاز.

## التشغيل

```bash
npm install
npm run dev        # التطوير على http://localhost:3000
```

أوامر أخرى:

```bash
npm run build      # بناء نسخة الإنتاج
npm start          # تشغيل نسخة الإنتاج
npm test           # اختبارات Vitest (27 اختبارًا)
npm run typecheck  # فحص TypeScript
npm run lint       # فحص ESLint
```

## التقنيات

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Zustand (مع persist إلى
localStorage وschema version) · Framer Motion · Lucide React · Vitest.

## الصفحات

- `/` الترحيب والتعريف
- `/onboarding` الإعداد الأولي (7 خطوات مع شريط تقدم)
- `/dashboard` لوحة التحكم (إحصائيات، استماع سريع، آخر الأحداث)
- `/dictionary` القاموس (بحث، تصفية، ترتيب، تجربة/تعديل/تعطيل/حذف)
- `/dictionary/new` إضافة أو تعديل كلمة (`?id=` للتعديل)
- `/designer` مصمم الاهتزازات (محرر خطوات + Timeline + أنماط جاهزة + فحص تشابه)
- `/listening` وضع الاستماع (ميكروفون أو محاكاة نصية)
- `/training` التدريب (جلسات، نتائج، كلمات ضعيفة، إعادة تدريب)
- `/logs` سجل الأحداث (بحث وتصفية وخصوصية)
- `/devices` الجهاز القابل للارتداء (محاكاة، بنية جاهزة لـ Web Bluetooth)
- `/settings` الإعدادات (تصدير/استيراد القاموس، إعادة ضبط، وضع داكن)

## البنية

```
src/
  app/            الصفحات (App Router)
  components/     ui / layout / haptics / dictionary / listening
  services/       haptic / speech-recognition / device / storage (واجهات قابلة للاستبدال)
  stores/         Zustand: dictionary / settings / logs / device / training
  hooks/          useListening / useHapticPlayer / useMounted
  lib/            arabic-normalizer / phrase-matcher / pattern-similarity /
                  detection-engine / haptic-queue / presets
  data/           البيانات التجريبية العربية
  types/          أنواع TypeScript
```

## ملاحظات الدعم

- الاهتزاز الفعلي يعمل عبر `navigator.vibrate` (متوفر على أندرويد/كروم).
  على iOS وسطح المكتب تظهر محاكاة بصرية على الخط الزمني بدل حدوث خطأ.
- التعرف الصوتي يعتمد على Web Speech API إن توفرت (كروم). عند عدم الدعم
  يعمل وضع المحاكاة النصية بالكامل.
- الشدة (1-100) لا يدعمها `navigator.vibrate`؛ تُعرض بصريًا وتُحفظ في النمط
  لاستخدامها لاحقًا مع سوار Bluetooth.
- الخدمات (Haptic/Speech/Device/Storage) واجهات مستقلة يمكن استبدالها
  بتنفيذ حقيقي (سوار BLE أو Supabase) دون تعديل الواجهات.

## تنبيه

النظام وسيلة مساعدة وليس بديلًا مضمونًا لأجهزة الطوارئ الطبية المعتمدة.
