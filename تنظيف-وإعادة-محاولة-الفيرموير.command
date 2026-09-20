#!/bin/bash
# حذف بقايا تنزيل arduino-cli الفاشل (~/Library/Arduino15) لتحرير مساحة،
# ثم إعادة تشغيل سكريبت رفع الفيرموير من جديد.
set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════"
echo "   تنظيف المساحة وإعادة محاولة الفيرموير"
echo "═══════════════════════════════════════════"

echo ""
echo "١) حذف /Users/albalushi/Library/Arduino15 (بقايا تالفة، $(du -sh "$HOME/Library/Arduino15" 2>/dev/null | cut -f1))..."
rm -rf "$HOME/Library/Arduino15"
echo "   تم."

echo ""
echo "٢) تنظيف كاش Homebrew..."
brew cleanup -s 2>/dev/null || true

echo ""
echo "٣) المساحة الفاضية الآن:"
df -h / | awk 'NR==1 || NR==2'

echo ""
echo "٤) إعادة تشغيل تثبيت ورفع الفيرموير..."
echo ""
bash "./تحديث-الفيرموير.command"
