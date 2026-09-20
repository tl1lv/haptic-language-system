#!/bin/bash
# فحص مساحة القرص فقط — لا يحذف أي شيء
echo "═══════════════════════════════════════════"
echo "   مساحة القرص المتاحة"
echo "═══════════════════════════════════════════"
df -h / | awk 'NR==1 || NR==2'

echo ""
echo "═══════════════════════════════════════════"
echo "   أكبر 15 عنصرًا داخل هذه المجلدات"
echo "   (Downloads, Desktop, Documents, Caches,"
echo "    ملفات Xcode/Simulator، سلة المهملات)"
echo "═══════════════════════════════════════════"
du -sh \
  "$HOME/Downloads/"* \
  "$HOME/Desktop/"* \
  "$HOME/Documents/"* \
  "$HOME/Library/Caches/"* \
  "$HOME/Library/Developer/"* \
  "$HOME/.Trash/"* \
  2>/dev/null | sort -rh | head -15

echo ""
echo "═══════════════════════════════════════════"
echo "   مساحة مجلد Homebrew المؤقت (تنزيلات arduino-cli)"
echo "═══════════════════════════════════════════"
du -sh "$(brew --cache 2>/dev/null)" 2>/dev/null
du -sh "$HOME/Library/Arduino15" 2>/dev/null

echo ""
echo "هذا الفحص لا يحذف أي شيء. أرسل النتيجة أعلاه ليقرر ماذا يُحذف."
read -p "اضغط Enter للإغلاق..."
