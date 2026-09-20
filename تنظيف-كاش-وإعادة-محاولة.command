#!/bin/bash
# حذف كاش تطبيقات آمن (يُعاد بناؤه تلقائيًا) لتحرير مساحة كافية،
# ثم إعادة محاولة تثبيت ورفع فيرموير ESP32C3.
set -e
cd "$(dirname "$0")"

echo "═══════════════════════════════════════════"
echo "   تنظيف الكاش وإعادة محاولة الفيرموير"
echo "═══════════════════════════════════════════"

CACHES=(
  "$HOME/Library/Caches/com.spotify.client"
  "$HOME/Library/Caches/ms-playwright"
  "$HOME/Library/Caches/com.anthropic.claudefordesktop.ShipIt"
  "$HOME/Library/Caches/Google"
  "$HOME/Library/Caches/Codex"
  "$HOME/Library/Caches/messages"
  "$HOME/Library/Caches/colima"
)

echo ""
echo "١) حذف الكاش التالي (كله يُعاد إنشاؤه تلقائيًا عند الحاجة):"
for d in "${CACHES[@]}"; do
  if [ -e "$d" ]; then
    SIZE=$(du -sh "$d" 2>/dev/null | cut -f1)
    echo "   - $d ($SIZE)"
    rm -rf "$d"
  fi
done

echo ""
echo "٢) تنظيف بقايا arduino-cli الفاشلة من المحاولة السابقة..."
rm -rf "$HOME/Library/Arduino15/tmp"

echo ""
echo "٣) تنظيف كاش Homebrew..."
brew cleanup -s 2>/dev/null || true

echo ""
echo "٤) المساحة الفاضية الآن:"
df -h / | awk 'NR==1 || NR==2'

echo ""
echo "٥) إعادة تشغيل تثبيت ورفع الفيرموير..."
echo ""
bash "./تحديث-الفيرموير.command"
