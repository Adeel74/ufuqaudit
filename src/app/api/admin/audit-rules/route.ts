// GET/POST /api/admin/audit-rules — SEO audit rule management
import { NextRequest, NextResponse } from "next/server";

interface AuditRule {
  id: string;
  name: string;
  category: string;
  severity: string;
  scoreImpact: number;
  status: "enabled" | "disabled";
  recommendation: string;
  fixInstructions: string;
  planAvailability: string[];
}

const RULES: AuditRule[] = [
  { id: "rule_1", name: "robots.txt missing", category: "Technical SEO", severity: "error", scoreImpact: 4, status: "enabled", recommendation: "Create a robots.txt file at /robots.txt", fixInstructions: "Add a robots.txt that allows crawling of public content and disallows private paths. Reference your sitemap.", planAvailability: ["free", "starter", "pro", "agency"] },
  { id: "rule_2", name: "AI crawlers blocked", category: "Technical SEO", severity: "critical", scoreImpact: 8, status: "enabled", recommendation: "Allow GPTBot, ClaudeBot, PerplexityBot in robots.txt", fixInstructions: "Remove disallow rules for AI crawlers if you want AI answer engines to cite your content.", planAvailability: ["starter", "pro", "agency"] },
  { id: "rule_3", name: "Sitemap missing", category: "Technical SEO", severity: "warning", scoreImpact: 2, status: "enabled", recommendation: "Generate an XML sitemap at /sitemap.xml", fixInstructions: "Create sitemap.xml and reference it from robots.txt.", planAvailability: ["free", "starter", "pro", "agency"] },
  { id: "rule_4", name: "No HTTPS", category: "Technical SEO", severity: "critical", scoreImpact: 8, status: "enabled", recommendation: "Install SSL and redirect HTTP to HTTPS", fixInstructions: "Install Let's Encrypt SSL + 301 redirect + HSTS header.", planAvailability: ["free", "starter", "pro", "agency"] },
  { id: "rule_5", name: "Missing title tag", category: "On-Page SEO", severity: "error", scoreImpact: 4, status: "enabled", recommendation: "Add a unique <title> (50-60 chars)", fixInstructions: "Write a descriptive title containing the target keyword.", planAvailability: ["free", "starter", "pro", "agency"] },
  { id: "rule_6", name: "Missing meta description", category: "On-Page SEO", severity: "warning", scoreImpact: 2, status: "enabled", recommendation: "Write 140-160 char meta description", fixInstructions: "Add a unique meta description per page with a CTA.", planAvailability: ["free", "starter", "pro", "agency"] },
  { id: "rule_7", name: "Missing H1", category: "On-Page SEO", severity: "error", scoreImpact: 4, status: "enabled", recommendation: "Add a single descriptive H1", fixInstructions: "Ensure every page has exactly one H1 with the target keyword.", planAvailability: ["free", "starter", "pro", "agency"] },
  { id: "rule_8", name: "Title too long", category: "On-Page SEO", severity: "warning", scoreImpact: 2, status: "enabled", recommendation: "Shorten title to 50-60 chars", fixInstructions: "Trim titles to fit SERP display limits.", planAvailability: ["free", "starter", "pro", "agency"] },
  { id: "rule_9", name: "Missing viewport meta", category: "On-Page SEO", severity: "critical", scoreImpact: 8, status: "enabled", recommendation: "Add viewport meta tag", fixInstructions: "Add <meta name='viewport' content='width=device-width, initial-scale=1'>.", planAvailability: ["free", "starter", "pro", "agency"] },
  { id: "rule_10", name: "Image alt missing", category: "On-Page SEO", severity: "warning", scoreImpact: 2, status: "enabled", recommendation: "Add alt text to all images", fixInstructions: "Write descriptive alt text for meaningful images.", planAvailability: ["free", "starter", "pro", "agency"] },
  { id: "rule_11", name: "Thin content (<300 words)", category: "Content SEO", severity: "warning", scoreImpact: 2, status: "enabled", recommendation: "Expand content to 300+ words", fixInstructions: "Add original insights, examples, data and FAQs.", planAvailability: ["free", "starter", "pro", "agency"] },
  { id: "rule_12", name: "Very thin content (<150 words)", category: "Content SEO", severity: "error", scoreImpact: 4, status: "enabled", recommendation: "Expand or consolidate", fixInstructions: "Either expand substantially or redirect to a stronger page.", planAvailability: ["free", "starter", "pro", "agency"] },
  { id: "rule_13", name: "Orphan pages", category: "Internal Links", severity: "warning", scoreImpact: 2, status: "enabled", recommendation: "Add internal links to orphan pages", fixInstructions: "Add contextual links from related high-authority pages.", planAvailability: ["free", "starter", "pro", "agency"] },
  { id: "rule_14", name: "Broken internal links", category: "Internal Links", severity: "error", scoreImpact: 4, status: "enabled", recommendation: "Fix or redirect broken links", fixInstructions: "Find and fix or 301-redirect each broken link.", planAvailability: ["free", "starter", "pro", "agency"] },
  { id: "rule_15", name: "Missing JSON-LD schema", category: "Schema", severity: "warning", scoreImpact: 2, status: "enabled", recommendation: "Add Organization + WebSite schema", fixInstructions: "Add JSON-LD for Organization, WebSite, WebPage, Article, BreadcrumbList.", planAvailability: ["free", "starter", "pro", "agency"] },
  { id: "rule_16", name: "Missing FAQ schema", category: "Schema", severity: "opportunity", scoreImpact: 1, status: "enabled", recommendation: "Add FAQPage schema", fixInstructions: "Add FAQPage JSON-LD with concise Q&A pairs.", planAvailability: ["starter", "pro", "agency"] },
  { id: "rule_17", name: "No FAQ/Q&A format", category: "AEO", severity: "warning", scoreImpact: 2, status: "enabled", recommendation: "Add FAQ sections with direct answers", fixInstructions: "Add explicit questions with 40-55 word direct answers.", planAvailability: ["starter", "pro", "agency"] },
  { id: "rule_18", name: "Weak answer depth", category: "AEO", severity: "opportunity", scoreImpact: 1, status: "enabled", recommendation: "Expand content depth to 600+ words", fixInstructions: "Add self-contained, citable answers with context.", planAvailability: ["starter", "pro", "agency"] },
  { id: "rule_19", name: "Weak entity signals", category: "GEO", severity: "warning", scoreImpact: 2, status: "enabled", recommendation: "Strengthen entity/brand signals", fixInstructions: "Add Organization schema, About page, NAP consistency.", planAvailability: ["starter", "pro", "agency"] },
  { id: "rule_20", name: "Missing author credentials", category: "GEO", severity: "warning", scoreImpact: 2, status: "enabled", recommendation: "Add author bios + credentials", fixInstructions: "Add author bylines, link to bios, reference publications.", planAvailability: ["starter", "pro", "agency"] },
  { id: "rule_21", name: "Slow LCP (>2.5s)", category: "Performance", severity: "error", scoreImpact: 4, status: "enabled", recommendation: "Improve LCP under 2.5s", fixInstructions: "Preload hero image, compress, use WebP/AVIF, reduce TTFB.", planAvailability: ["free", "starter", "pro", "agency"] },
  { id: "rule_22", name: "Large page weight (>500KB)", category: "Performance", severity: "warning", scoreImpact: 2, status: "enabled", recommendation: "Reduce page weight", fixInstructions: "Lazy-load images, minify CSS/JS, compress with Brotli.", planAvailability: ["free", "starter", "pro", "agency"] },
  { id: "rule_23", name: "No HTTPS (Security)", category: "Security", severity: "critical", scoreImpact: 8, status: "enabled", recommendation: "Migrate to HTTPS", fixInstructions: "Install TLS + 301 redirect + HSTS.", planAvailability: ["free", "starter", "pro", "agency"] },
  { id: "rule_24", name: "Security headers missing", category: "Security", severity: "opportunity", scoreImpact: 1, status: "enabled", recommendation: "Set security headers", fixInstructions: "Add HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.", planAvailability: ["free", "starter", "pro", "agency"] },
];

export async function GET() {
  return NextResponse.json({ rules: RULES, total: RULES.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { id, action, severity, scoreImpact, status } = body;

  if (action === "toggle" && id) {
    const rule = RULES.find((r) => r.id === id);
    if (rule) {
      rule.status = rule.status === "enabled" ? "disabled" : "enabled";
      return NextResponse.json({ ok: true, rule });
    }
  }
  if (action === "update" && id) {
    const rule = RULES.find((r) => r.id === id);
    if (rule) {
      if (severity) rule.severity = severity;
      if (typeof scoreImpact === "number") rule.scoreImpact = scoreImpact;
      if (status) rule.status = status;
      return NextResponse.json({ ok: true, rule });
    }
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
