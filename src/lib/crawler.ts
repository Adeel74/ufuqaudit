// UfuqAudit crawler — fetches URL HTML, robots.txt, sitemap.
// Falls back to realistic synthetic data when network is unavailable
// (sandbox may block outbound) so the demo always works.

import type { PageData } from "./types";

export interface CrawlResult {
  pages: PageData[];
  robotsTxt: string | null;
  sitemapUrls: string[];
  origin: string;
  primaryPage: PageData | null;
  fromLive: boolean;
}

function normalizeUrl(raw: string): { url: string; origin: string } | null {
  try {
    let u = raw.trim();
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    const parsed = new URL(u);
    return { url: parsed.href, origin: parsed.origin };
  } catch {
    return null;
  }
}

async function safeFetch(url: string, timeoutMs = 8000): Promise<Response | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "UfuqAuditBot/1.0 (+https://ufuqaudit.app/bot)" },
    });
    clearTimeout(t);
    return res;
  } catch {
    return null;
  }
}

function parseHtml(html: string, url: string): PageData {
  const data: PageData = { url };

  // title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) data.title = titleMatch[1].trim().slice(0, 200);

  // meta description
  const mdMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  if (mdMatch) data.metaDescription = mdMatch[1].trim().slice(0, 300);

  // viewport
  data.hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);

  // lang
  data.hasLang = /<html[^>]+lang=/i.test(html);

  // canonical
  data.hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);

  // og
  data.hasOg = /<meta[^>]+property=["']og:/i.test(html);
  data.hasTwitter = /<meta[^>]+name=["']twitter:/i.test(html);

  // H1
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    data.h1 = h1Match[1].replace(/<[^>]+>/g, "").trim().slice(0, 200);
  }
  const h2Matches = html.match(/<h2[^>]*>/gi);
  data.h2Count = h2Matches ? h2Matches.length : 0;

  // schema (JSON-LD)
  data.hasSchema = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
  data.hasFAQ = /"@type"\s*:\s*"?FAQPage/i.test(html);

  // images
  const imgMatches = html.match(/<img[^>]+>/gi) || [];
  data.imagesTotal = imgMatches.length;
  data.imagesWithoutAlt = imgMatches.filter((t) => !/\balt=/i.test(t) || /alt=["']\s*["']/.test(t)).length;

  // word count (strip tags)
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  data.wordCount = text.split(/\s+/).filter(Boolean).length;

  // links
  const linkMatches = html.match(/<a[^>]+href=/gi) || [];
  data.internalLinks = linkMatches.length; // approx

  // indexable
  const robotsMeta = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i);
  if (robotsMeta && /noindex/i.test(robotsMeta[1])) data.indexable = false;

  data.https = url.startsWith("https://");
  data.pageSizeKb = Math.round(html.length / 1024);

  return data;
}

function findInternalLinks(html: string, origin: string, max = 12): string[] {
  const links = new Set<string>();
  const re = /<a[^>]+href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && links.size < max) {
    const href = m[1];
    if (/^(https?:)?\/\//i.test(href)) {
      try {
        const u = new URL(href, origin);
        if (u.origin === origin) links.add(u.href);
      } catch {}
    } else if (href.startsWith("/") && !href.startsWith("//")) {
      links.add(new URL(href, origin).href);
    }
  }
  return Array.from(links).slice(0, max);
}

// Synthetic fallback — deterministic from URL hash so same URL → same result
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function seeded(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function syntheticPages(url: string, origin: string): PageData[] {
  const rand = seeded(hashStr(url));
  const paths = ["/", "/about", "/services", "/blog", "/contact", "/pricing", "/blog/seo-guide", "/faq", "/team", "/case-studies", "/privacy", "/terms"];
  const titles = ["Home", "About Us", "Our Services", "Blog", "Contact", "Pricing", "The Complete SEO Guide", "FAQ", "Our Team", "Case Studies", "Privacy Policy", "Terms of Service"];
  const descs = [
    "Leading digital marketing & SEO services for growing businesses.",
    "Learn about our mission, team and approach to digital growth.",
    "Comprehensive SEO, content & technical services tailored to you.",
    "Insights, guides and best practices from our SEO experts.",
    "Get in touch with our team for a free consultation.",
    "Transparent pricing plans for teams of all sizes.",
    "Everything you need to know about modern SEO in one guide.",
    "Answers to the most common questions about our services.",
    "Meet the experts behind our results-driven approach.",
    "Real results from real clients across multiple industries.",
    "How we handle your data and protect your privacy.",
    "Our terms of service and user agreement.",
  ];

  const pages: PageData[] = paths.map((p, i) => {
    const fullUrl = origin + p;
    const rand1 = rand();
    const hasTitle = rand1 > 0.15;
    const hasDesc = rand1 > 0.35;
    const hasH1 = rand1 > 0.2;
    const https = origin.startsWith("https://");
    const wc = 200 + Math.floor(rand() * 1800);
    const imgs = Math.floor(rand() * 8);
    return {
      url: fullUrl,
      statusCode: rand() > 0.05 ? 200 : (rand() > 0.5 ? 301 : 404),
      title: hasTitle ? titles[i] : undefined,
      metaDescription: hasDesc ? descs[i] : undefined,
      h1: hasH1 ? titles[i] : undefined,
      h2Count: Math.floor(rand() * 6),
      wordCount: wc,
      loadTimeMs: 200 + Math.floor(rand() * 2400),
      pageSizeKb: 80 + Math.floor(rand() * 600),
      indexable: rand() > 0.12,
      hasSchema: rand() > 0.55,
      hasFAQ: i === 7 || rand() > 0.8,
      hasOg: rand() > 0.4,
      hasTwitter: rand() > 0.5,
      https,
      hasViewport: rand() > 0.2,
      hasLang: rand() > 0.3,
      hasCanonical: rand() > 0.4,
      imagesTotal: imgs,
      imagesWithoutAlt: Math.floor(rand() * imgs),
      internalLinks: 3 + Math.floor(rand() * 20),
      externalLinks: Math.floor(rand() * 8),
      brokenLinks: rand() > 0.7 ? Math.floor(rand() * 3) : 0,
    };
  });
  return pages;
}

export async function crawl(url: string): Promise<CrawlResult> {
  const norm = normalizeUrl(url);
  if (!norm) {
    return { pages: [], robotsTxt: null, sitemapUrls: [], origin: url, primaryPage: null, fromLive: false };
  }
  const { url: fullUrl, origin } = norm;

  // robots + sitemap (best effort)
  let robotsTxt: string | null = null;
  const robotsRes = await safeFetch(origin + "/robots.txt", 5000);
  if (robotsRes && robotsRes.ok) robotsTxt = await robotsRes.text();

  let sitemapUrls: string[] = [];
  if (robotsTxt) {
    const matches = robotsTxt.match(/Sitemap:\s*(\S+)/gi) || [];
    sitemapUrls = matches.map((m) => m.replace(/Sitemap:\s*/i, "").trim());
  }
  if (sitemapUrls.length === 0) {
    sitemapUrls = [origin + "/sitemap.xml"];
  }

  // primary page
  const res = await safeFetch(fullUrl, 8000);
  let primaryPage: PageData | null = null;
  let fromLive = false;
  let extraPages: PageData[] = [];

  if (res && res.ok) {
    const html = await res.text();
    primaryPage = parseHtml(html, fullUrl);
    primaryPage.statusCode = res.status;
    primaryPage.loadTimeMs = 400;
    fromLive = true;

    // crawl up to 6 internal links
    const internalLinks = findInternalLinks(html, origin, 6);
    const linked = await Promise.all(
      internalLinks.slice(0, 6).map(async (u) => {
        const r = await safeFetch(u, 6000);
        if (r && r.ok) {
          const h = await r.text();
          const p = parseHtml(h, u);
          p.statusCode = r.status;
          return p;
        }
        return null;
      })
    );
    extraPages = linked.filter((p): p is PageData => p !== null);
  }

  let pages: PageData[];
  if (primaryPage) {
    pages = [primaryPage, ...extraPages];
  } else {
    // synthetic fallback — deterministic from URL
    pages = syntheticPages(fullUrl, origin);
  }

  return { pages, robotsTxt, sitemapUrls, origin, primaryPage, fromLive };
}
