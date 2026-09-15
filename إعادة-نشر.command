#!/bin/bash
# إعادة نشر سريعة على نفس مشروع Cloudflare Pages، بفرع الإنتاج الصحيح
set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════"
echo "   إعادة النشر على Cloudflare Pages"
echo "═══════════════════════════════════════════"

echo ""
echo "١) بناء أحدث نسخة..."
npm run build

echo ""
echo "٢) نشر على فرع الإنتاج (production)..."
npx --yes wrangler pages deploy out --project-name=haptic-language-system --branch=production

echo ""
echo "═══════════════════════════════════════════"
echo " انتهى! الرابط النظيف يجب أن يعمل الآن:"
echo " https://haptic-language-system.pages.dev"
echo "═══════════════════════════════════════════"
read -p "اضغط Enter للإغلاق..."
