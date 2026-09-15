#!/bin/bash
# مشغّل نظام اللغة الاهتزازية بضغطة واحدة
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════"
echo "   نظام اللغة الاهتزازية — جارٍ التشغيل"
echo "═══════════════════════════════════════════"

# إيقاف أي نسخة قديمة عالقة على المنفذ 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

# تثبيت المكتبات إذا لم تكن موجودة
if [ ! -d node_modules ]; then
  echo "أول تشغيل: جارٍ تثبيت المكتبات (يأخذ دقيقة أو اثنتين)..."
  npm install --no-audit --no-fund
fi

# تشغيل السيرفر في الخلفية
npm run dev &
DEV_PID=$!

# إيقاف كل شيء عند إغلاق النافذة
trap "kill $DEV_PID 2>/dev/null; lsof -ti:3000 | xargs kill -9 2>/dev/null" EXIT

echo "انتظر قليلًا حتى يجهز السيرفر..."
sleep 6

# فتح الموقع على الماك
open http://localhost:3000

echo ""
echo "═══════════════════════════════════════════"
echo " للفتح من الهاتف/التاب: انسخ الرابط الذي"
echo " سيظهر بالأسفل (ينتهي بـ trycloudflare.com)"
echo " ولإيقاف كل شيء: أغلق هذه النافذة"
echo "═══════════════════════════════════════════"
echo ""

# إنشاء رابط عام عبر كلاودفلير
if command -v cloudflared >/dev/null 2>&1; then
  cloudflared tunnel --url http://localhost:3000
else
  echo "(cloudflared غير مثبت — الموقع يعمل محليًا فقط على http://localhost:3000)"
  wait $DEV_PID
fi
