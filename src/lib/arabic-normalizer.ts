/**
 * تطبيع النص العربي إلى صيغة موحدة للمقارنة والبحث.
 * - توحيد أشكال الألف والياء.
 * - إزالة التشكيل والتطويل وعلامات الترقيم والمسافات المتكررة.
 */
export function normalizeArabicText(input: string): string {
  if (!input) return "";
  let text = String(input);

  // إزالة التشكيل (الحركات): U+064B..U+0652 + U+0670 (الألف الخنجرية)
  text = text.replace(/[ً-ْٰ]/g, "");
  // إزالة التطويل (ـ) U+0640
  text = text.replace(/ـ/g, "");
  // توحيد الألف: أ إ آ ٱ -> ا
  text = text.replace(/[أإآٱ]/g, "ا");
  // توحيد الياء: ى -> ي
  text = text.replace(/ى/g, "ي");
  // إزالة علامات الترقيم العربية: ، ؛ ؟
  text = text.replace(/[،؛؟]/g, " ");
  // إزالة أي رمز ليس حرفًا عربيًا أو رقمًا أو حرفًا لاتينيًا أو مسافة
  text = text.replace(/[^ء-ي٠-٩0-9a-zA-Z\s]/g, " ");
  // توحيد المسافات
  text = text.replace(/\s+/g, " ").trim();
  // توحيد حالة الأحرف اللاتينية إن وجدت
  text = text.toLowerCase();

  return text;
}
