/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // تصدير ثابت (Static Export) — التطبيق كله مكونات عميل (localStorage,
  // Web Serial, Web Speech) بلا مسارات API أو عرض من الخادم، لذا يمكن
  // نشره كملفات ثابتة على Cloudflare Pages أو أي استضافة ثابتة أخرى.
  // "npm run dev" يستمر بالعمل عاديًا؛ هذا يؤثر فقط على "npm run build".
  output: "export",
};

export default nextConfig;
