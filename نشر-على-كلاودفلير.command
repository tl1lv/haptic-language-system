#!/bin/bash
# نشر نظام اللغة الاهتزازية على Cloudflare Pages بضغطة واحدة
set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════"
echo "   نشر المشروع على Cloudflare Pages"
echo "═══════════════════════════════════════════"

echo ""
echo "١) تثبيت المكتبات إن لزم..."
if [ ! -d node_modules ]; then
  npm install --no-audit --no-fund
fi

echo ""
echo "٢) بناء النسخة الثابتة (npm run build)..."
npm run build

echo ""
echo "٣) تسجيل الدخول إلى Cloudflare"
echo "   سيُفتح رابط في متصفحك — سجّل الدخول بحسابك (أو أنشئ حسابًا"
echo "   مجانيًا إن لم يكن لديك)، ثم اضغط زر Authorize/Allow."
echo "   ═ انتظر حتى تكمل هذه الخطوة في المتصفح قبل المتابعة هنا ═"
npx --yes wrangler login

echo ""
echo "٤) نشر المجلد out على Cloudflare Pages..."
echo "   (إذا ظهر سؤال بإنشاء مشروع جديد، اكتب y واضغط Enter)"
npx --yes wrangler pages deploy out --project-name=haptic-language-system --branch=main

echo ""
echo "═══════════════════════════════════════════"
echo " انتهى! ابحث أعلاه عن سطر يبدأ بـ"
echo " https://haptic-language-system.pages.dev"
echo " هذا هو رابط موقعك المنشور — احتفظ به."
echo "═══════════════════════════════════════════"
read -p "اضغط Enter للإغلاق..."
