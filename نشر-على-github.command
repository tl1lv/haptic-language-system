#!/bin/bash
# نشر المشروع على GitHub بضغطة واحدة، حتى تقدر تكمل عليه من أي جهاز
set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════"
echo "   نشر المشروع على GitHub"
echo "═══════════════════════════════════════════"

echo ""
echo "١) التأكد من وجود أداة GitHub CLI..."
if ! command -v gh >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "   تثبيت gh عبر Homebrew (قد يأخذ دقيقة)..."
    brew install gh
  else
    echo ""
    echo "أداة GitHub CLI (gh) غير موجودة، ولا يوجد Homebrew على جهازك."
    echo "ثبّت Homebrew أولًا من https://brew.sh ثم أعد تشغيل هذا الملف."
    read -p "اضغط Enter للإغلاق..."
    exit 1
  fi
fi

echo ""
echo "٢) تهيئة مستودع Git..."
if [ ! -d .git ]; then
  git init
  git branch -M main
fi
git add -A
git commit -m "نظام اللغة الاهتزازية" || echo "   لا توجد تغييرات جديدة للحفظ"

echo ""
echo "٣) تسجيل الدخول إلى GitHub"
echo "   سيظهر رمز (Code) أدناه — افتح الرابط الذي يظهر معه في متصفحك،"
echo "   أدخل الرمز نفسه، وسجّل الدخول بحسابك ثم اضغط Authorize."
echo "   ═ انتظر حتى تكمل هذه الخطوة في المتصفح قبل المتابعة هنا ═"
gh auth login --web -h github.com -p https -s repo || true

echo ""
echo "٤) إنشاء المستودع ورفع الكود..."
if git remote get-url origin >/dev/null 2>&1; then
  echo "   المستودع مربوط مسبقًا — رفع التحديثات فقط..."
  git push -u origin main
else
  gh repo create haptic-language-system --private --source=. --remote=origin --push
fi

echo ""
echo "═══════════════════════════════════════════"
echo " تم! رابط مستودعك على GitHub:"
gh repo view --json url -q .url 2>/dev/null || echo " (تحقق من حسابك على github.com)"
echo "═══════════════════════════════════════════"
echo ""
echo "للعمل من جهاز آخر لاحقًا:"
echo "  git clone <رابط المستودع أعلاه>"
echo "  cd haptic-language-system && npm install && npm run dev"
read -p "اضغط Enter للإغلاق..."
