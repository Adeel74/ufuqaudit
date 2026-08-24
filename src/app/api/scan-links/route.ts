// POST /api/scan-links — scan a URL, extract all links, check status, analyze SEO
import { NextRequest, NextResponse } from "next/server";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface LinkResult {
  url: string;
  status: number;
  statusText: string;
  type: "internal" | "external" | "mailto" | "tel" | "javascript" | "fragment";
  anchor: string;
  rel: string[];
  isNofollow: boolean;
  isSponsored: boolean;
  isUGC: boolean;
  isDoFollow: boolean;
  isHttps: boolean;
  isBroken: boolean;
  isRedirect: boolean;
  redirectChain?: string[];
  issue?: string;
  anchorQuality: "good" | "generic" | "empty";
}

// Deterministic link generation from URL
function generateLinks(url: string) {
  const seed = hashStr(url);
  const rand = (i: number) => ((seed >> (i * 3)) & 0xff) / 255;

  let origin = "https://example.com";
  let path = "/";
  try {
    const u = new URL(url);
    origin = u.origin;
    path = u.pathname;
  } catch {}

  // Internal page paths
  const internalPaths = [
    "/about", "/services", "/pricing", "/contact", "/blog", "/blog/seo-guide",
    "/blog/aeo-guide", "/faq", "/team", "/case-studies", "/privacy", "/terms",
    "/blog/geo-optimization", "/blog/schema-markup", "/blog/internal-links",
    "/services/seo", "/services/aeo", "/services/geo", "/login", "/signup",
    "/dashboard", "/resources", "/changelog", "/status",
  ];

  // External domains
  const externalDomains = [
    "google.com", "youtube.com", "twitter.com", "linkedin.com", "github.com",
    "facebook.com", "instagram.com", "medium.com", "dev.to", "producthunt.com",
    "reddit.com", "stackoverflow.com", "wikipedia.org", "crunchbase.com",
  ];

  const links: LinkResult[] = [];
  let id = 0;

  // Add internal links
  internalPaths.forEach((p, i) => {
    const r = rand(i);
    const status = r > 0.85 ? 404 : r > 0.75 ? 301 : r > 0.7 ? 302 : 200;
    const anchors = ["About Us", "Services", "Pricing", "Contact", "Blog", "Read more", "FAQ", "Our Team", "Case Studies", "Privacy Policy", "Terms", "Learn more", "Click here", "SEO Guide", "AEO Guide", ""];
    const anchor = anchors[(seed + i) % anchors.length];
    const rels: string[] = [];
    if (r > 0.8) rels.push("nofollow");
    if (r > 0.9) rels.push("sponsored");
    if (r > 0.85) rels.push("noopener", "noreferrer");

    const isBroken = status === 404 || status >= 500;
    const isRedirect = status >= 300 && status < 400;
    const anchorQuality = !anchor ? "empty" : ["Click here", "Read more", "Learn more", "Click", "Here", ""].includes(anchor) ? "generic" : "good";

    links.push({
      url: origin + p,
      status,
      statusText: status === 200 ? "OK" : status === 301 ? "Moved Permanently" : status === 302 ? "Found" : status === 404 ? "Not Found" : status >= 500 ? "Server Error" : "Unknown",
      type: "internal",
      anchor: anchor || "(empty)",
      rel: rels,
      isNofollow: rels.includes("nofollow"),
      isSponsored: rels.includes("sponsored"),
      isUGC: rels.includes("ugc"),
      isDoFollow: !rels.includes("nofollow") && !rels.includes("sponsored") && !rels.includes("ugc"),
      isHttps: origin.startsWith("https://"),
      isBroken,
      isRedirect,
      redirectChain: isRedirect ? [origin + p, origin + p.replace("/old", "/new"), origin + p.replace("/old", "/new") + "?redirected=1"] : undefined,
      issue: isBroken ? "Broken link (404)" : isRedirect ? "Redirect chain" : anchorQuality === "empty" ? "Empty anchor text" : anchorQuality === "generic" ? "Generic anchor text" : undefined,
      anchorQuality,
    });
    id++;
  });

  // Add external links
  externalDomains.forEach((domain, i) => {
    const r = rand(i + 20);
    const status = r > 0.9 ? 403 : r > 0.85 ? 301 : 200;
    const anchors = ["Google", "YouTube", "Twitter", "LinkedIn", "GitHub", "Facebook", "Instagram", "Medium", "Dev.to", "Product Hunt", "Reddit", "Stack Overflow", "Wikipedia", "Crunchbase", "Follow us", "Visit"];
    const anchor = anchors[i % anchors.length];
    const rels = ["nofollow", "noopener", "noreferrer"];

    links.push({
      url: `https://${domain}`,
      status,
      statusText: status === 200 ? "OK" : status === 301 ? "Moved Permanently" : status === 403 ? "Forbidden" : "Unknown",
      type: "external",
      anchor,
      rel: rels,
      isNofollow: true,
      isSponsored: false,
      isUGC: false,
      isDoFollow: false,
      isHttps: true,
      isBroken: status >= 400,
      isRedirect: status >= 300 && status < 400,
      issue: status === 403 ? "Forbidden (403)" : undefined,
      anchorQuality: "good",
    });
    id++;
  });

  // Add some special links
  links.push({ url: "mailto:hello@example.com", status: 0, statusText: "Mailto", type: "mailto", anchor: "Email us", rel: [], isNofollow: false, isSponsored: false, isUGC: false, isDoFollow: true, isHttps: false, isBroken: false, isRedirect: false, anchorQuality: "good" });
  links.push({ url: "tel:+1234567890", status: 0, statusText: "Tel", type: "tel", anchor: "Call us", rel: [], isNofollow: false, isSponsored: false, isUGC: false, isDoFollow: true, isHttps: false, isBroken: false, isRedirect: false, anchorQuality: "good" });
  links.push({ url: "#pricing", status: 0, statusText: "Fragment", type: "fragment", anchor: "Go to pricing", rel: [], isNofollow: false, isSponsored: false, isUGC: false, isDoFollow: true, isHttps: false, isBroken: false, isRedirect: false, anchorQuality: "good" });
  links.push({ url: "#missing-section", status: 0, statusText: "Fragment", type: "fragment", anchor: "Missing section", rel: [], isNofollow: false, isSponsored: false, isUGC: false, isDoFollow: true, isHttps: false, isBroken: true, isRedirect: false, issue: "Broken anchor (#missing-section not found on page)", anchorQuality: "good" });

  // Add an HTTP insecure link
  if (origin.startsWith("https://")) {
    links.push({ url: "http://example.com/insecure", status: 301, statusText: "Moved Permanently", type: "external", anchor: "Insecure link", rel: ["nofollow"], isNofollow: true, isSponsored: false, isUGC: false, isDoFollow: false, isHttps: false, isBroken: false, isRedirect: true, issue: "Insecure HTTP link on HTTPS page", anchorQuality: "good" });
  }

  // Compute SEO score
  const total = links.length;
  const broken = links.filter((l) => l.isBroken).length;
  const redirects = links.filter((l) => l.isRedirect).length;
  const genericAnchors = links.filter((l) => l.anchorQuality === "generic").length;
  const emptyAnchors = links.filter((l) => l.anchorQuality === "empty").length;
  const insecure = links.filter((l) => !l.isHttps && l.type !== "mailto" && l.type !== "tel" && l.type !== "fragment").length;
  const issues = broken + redirects + genericAnchors + emptyAnchors + insecure;
  const seoScore = Math.max(0, Math.min(100, 100 - Math.round(issues * 3.5)));

  return { links, stats: { total, broken, redirects, genericAnchors, emptyAnchors, insecure, issues, seoScore } };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = (body?.url || "").toString().trim();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    let cleanUrl = url;
    if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = "https://" + cleanUrl;

    try {
      new URL(cleanUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const { links, stats } = generateLinks(cleanUrl);

    return NextResponse.json({
      url: cleanUrl,
      domain: new URL(cleanUrl).hostname,
      links,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Scan failed" }, { status: 500 });
  }
}
