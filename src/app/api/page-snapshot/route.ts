// GET /api/page-snapshot?url=<url> — returns mock page metadata + visual preview data
import { NextRequest, NextResponse } from "next/server";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url") || "";
  const seed = hashStr(url);

  // Generate a deterministic "screenshot" as SVG data
  const w = 1280;
  const h = 800;
  const bgColors = ["#ffffff", "#f8fafc", "#fef3c7", "#dbeafe", "#dcfce7"];
  const headerColors = ["#1e293b", "#0f766e", "#7c3aed", "#0369a1", "#be123c"];
  const accentColors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"];

  const bg = bgColors[seed % bgColors.length];
  const header = headerColors[seed % headerColors.length];
  const accent = accentColors[seed % accentColors.length];

  // Build a mock webpage layout as SVG
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="${bg}"/>
    <!-- Browser chrome -->
    <rect x="0" y="0" width="${w}" height="40" fill="#1e293b"/>
    <circle cx="20" cy="20" r="6" fill="#ef4444"/>
    <circle cx="40" cy="20" r="6" fill="#f59e0b"/>
    <circle cx="60" cy="20" r="6" fill="#10b981"/>
    <rect x="80" y="10" width="${w-100}" height="20" rx="4" fill="#334155"/>
    <text x="90" y="24" fill="#94a3b8" font-size="11" font-family="monospace">${url.replace(/^https?:\/\//, "").slice(0, 60)}</text>
    <!-- Header/Nav -->
    <rect x="0" y="40" width="${w}" height="60" fill="${header}"/>
    <rect x="40" y="55" width="120" height="30" rx="4" fill="${accent}" opacity="0.8"/>
    <rect x="200" y="62" width="60" height="16" rx="2" fill="white" opacity="0.7"/>
    <rect x="280" y="62" width="60" height="16" rx="2" fill="white" opacity="0.5"/>
    <rect x="360" y="62" width="60" height="16" rx="2" fill="white" opacity="0.5"/>
    <rect x="${w-140}" y="55" width="80" height="30" rx="4" fill="${accent}"/>
    <!-- Hero section -->
    <rect x="60" y="130" width="${w-120}" height="200" rx="8" fill="${accent}" opacity="0.1"/>
    <rect x="100" y="160" width="400" height="24" rx="4" fill="${header}"/>
    <rect x="100" y="200" width="300" height="16" rx="2" fill="#64748b"/>
    <rect x="100" y="226" width="350" height="16" rx="2" fill="#64748b"/>
    <rect x="100" y="270" width="120" height="36" rx="6" fill="${accent}"/>
    <!-- Hero image placeholder -->
    <rect x="${w-400}" y="150" width="320" height="160" rx="8" fill="${header}" opacity="0.15"/>
    <!-- Content blocks -->
    <rect x="60" y="360" width="360" height="120" rx="8" fill="white" stroke="#e2e8f0"/>
    <rect x="80" y="380" width="200" height="14" rx="2" fill="${header}"/>
    <rect x="80" y="404" width="280" height="10" rx="2" fill="#cbd5e1"/>
    <rect x="80" y="422" width="260" height="10" rx="2" fill="#cbd5e1"/>
    <rect x="80" y="440" width="240" height="10" rx="2" fill="#cbd5e1"/>
    <rect x="460" y="360" width="360" height="120" rx="8" fill="white" stroke="#e2e8f0"/>
    <rect x="480" y="380" width="200" height="14" rx="2" fill="${header}"/>
    <rect x="480" y="404" width="280" height="10" rx="2" fill="#cbd5e1"/>
    <rect x="480" y="422" width="260" height="10" rx="2" fill="#cbd5e1"/>
    <rect x="860" y="360" width="${w-920}" height="120" rx="8" fill="white" stroke="#e2e8f0"/>
    <rect x="880" y="380" width="180" height="14" rx="2" fill="${header}"/>
    <rect x="880" y="404" width="200" height="10" rx="2" fill="#cbd5e1"/>
    <!-- Footer -->
    <rect x="0" y="${h-60}" width="${w}" height="60" fill="${header}"/>
    <rect x="40" y="${h-40}" width="100" height="12" rx="2" fill="white" opacity="0.5"/>
    <rect x="160" y="${h-40}" width="80" height="12" rx="2" fill="white" opacity="0.3"/>
  </svg>`;

  // Page SEO metadata (mock but deterministic)
  const slug = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const pathParts = slug.split("/").filter(Boolean);
  const pageName = pathParts[pathParts.length - 1] || "home";

  const meta = {
    title: pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/[-_]/g, " ") + " — " + (pathParts[0] || "UfuqAudit"),
    metaDescription: `Learn about ${pageName} on our website. Comprehensive guides, tips, and best practices.`,
    h1: pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/[-_]/g, " "),
    wordCount: 200 + (seed % 1800),
    loadTimeMs: 200 + (seed % 2500),
    pageSizeKb: 80 + (seed % 600),
    canonical: url,
    robots: "index, follow",
    ogTitle: pageName + " — UfuqAudit",
    ogDescription: `Learn about ${pageName} on our website.`,
    hasSchema: seed % 3 === 0,
    hasFAQ: seed % 5 === 0,
    hasViewport: seed % 10 !== 0,
    hasLang: seed % 8 !== 0,
    https: url.startsWith("https://"),
    indexable: seed % 12 !== 0,
    imagesTotal: 3 + (seed % 12),
    imagesNoAlt: seed % 4,
    h2Count: seed % 6,
    internalLinks: 3 + (seed % 20),
    externalLinks: seed % 8,
  };

  // Highlight zones (areas on the screenshot where issues exist)
  const highlights: { x: number; y: number; w: number; h: number; type: string; label: string; severity: string }[] = [];
  if (!meta.hasViewport) highlights.push({ x: 0, y: 40, w: w, h: 60, type: "viewport", label: "Missing viewport meta tag", severity: "critical" });
  if (!meta.hasLang) highlights.push({ x: 0, y: 0, w: w, h: 40, type: "lang", label: "Missing HTML lang attribute", severity: "warning" });
  if (meta.imagesNoAlt > 0) highlights.push({ x: w - 400, y: 150, w: 320, h: 160, type: "images", label: `${meta.imagesNoAlt} images missing alt text`, severity: "warning" });
  if (meta.wordCount < 300) highlights.push({ x: 60, y: 360, w: 360, h: 120, type: "thin", label: "Thin content (< 300 words)", severity: "warning" });
  if (!meta.hasSchema) highlights.push({ x: 0, y: h - 60, w: w, h: 60, type: "schema", label: "Missing JSON-LD schema", severity: "warning" });
  if (!meta.https) highlights.push({ x: 0, y: 0, w: w, h: 40, type: "https", label: "Not served over HTTPS", severity: "critical" });

  return NextResponse.json({
    url,
    svg,
    meta,
    highlights,
    width: w,
    height: h,
  });
}
