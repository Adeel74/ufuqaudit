// GET /api/backlinks — returns mock backlink monitoring data
import { NextResponse } from "next/server";

interface Backlink {
  sourceUrl: string;
  sourceDomain: string;
  domainAuthority: number;
  targetUrl: string;
  anchorText: string;
  type: "dofollow" | "nofollow" | "ugc" | "sponsored";
  firstSeen: string;
  status: "active" | "lost" | "new";
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const SOURCES = [
  { domain: "github.com", url: "https://github.com/awesome-seo" },
  { domain: "dev.to", url: "https://dev.to/seo/audit-tools-2024" },
  { domain: "producthunt.com", url: "https://producthunt.com/posts/ufuqaudit" },
  { domain: "medium.com", url: "https://medium.com/@seoexpert/audit-guide" },
  { domain: "reddit.com", url: "https://reddit.com/r/SEO/comments/audit" },
  { domain: "hashnode.com", url: "https://hashnode.com/post/seo-tools" },
  { domain: "hackernoon.com", url: "https://hackernoon.com/seo-in-2024" },
  { domain: "searchengineland.com", url: "https://searchengineland.com/audit-tools" },
  { domain: "moz.com", url: "https://moz.com/blog/audit-checklist" },
  { domain: "ahrefs.com", url: "https://ahrefs.com/blog/technical-seo" },
  { domain: "semrush.com", url: "https://semrush.com/blog/aeo-guide" },
  { domain: "backlinko.com", url: "https://backlinko.com/seo-this-year" },
];

const ANCHORS = [
  "UfuqAudit",
  "best SEO audit tool",
  "AI-powered website audit",
  "AEO + GEO audit",
  "free website audit",
  "click here",
  "this audit tool",
  "UfuqAudit's scoring engine",
];

const TARGETS = ["/", "/blog/seo-guide", "/pricing", "/features"];

export async function GET() {
  const backlinks: Backlink[] = SOURCES.map((src, i) => {
    const seed = hashStr(src.domain);
    const da = 30 + (seed % 65);
    const types: Backlink["type"][] = ["dofollow", "dofollow", "dofollow", "nofollow", "ugc", "sponsored"];
    const type = types[seed % types.length];
    const statuses: Backlink["status"][] = ["active", "active", "active", "active", "new", "lost"];
    const status = statuses[(seed >> 4) % statuses.length];
    const daysAgo = (seed % 90) + 1;
    const firstSeen = new Date(Date.now() - daysAgo * 86400000).toISOString();
    return {
      sourceUrl: src.url,
      sourceDomain: src.domain,
      domainAuthority: da,
      targetUrl: `https://example.com${TARGETS[seed % TARGETS.length]}`,
      anchorText: ANCHORS[(seed >> 2) % ANCHORS.length],
      type,
      firstSeen,
      status,
    };
  });

  const total = backlinks.length;
  const active = backlinks.filter((b) => b.status === "active").length;
  const newCount = backlinks.filter((b) => b.status === "new").length;
  const lost = backlinks.filter((b) => b.status === "lost").length;
  const dofollow = backlinks.filter((b) => b.type === "dofollow").length;
  const avgDA = Math.round(backlinks.reduce((s, b) => s + b.domainAuthority, 0) / total);
  const totalDA = backlinks.reduce((s, b) => s + b.domainAuthority, 0);
  const referringDomains = new Set(backlinks.map((b) => b.sourceDomain)).size;

  return NextResponse.json({
    backlinks,
    stats: {
      total,
      active,
      new: newCount,
      lost,
      dofollow,
      nofollow: total - dofollow,
      avgDA,
      totalDA,
      referringDomains,
    },
    // 12-week trend
    trend: Array.from({ length: 12 }, (_, i) => ({
      week: `W${i + 1}`,
      gained: 2 + ((hashStr("g" + i) % 6)),
      lost: (hashStr("l" + i) % 3),
    })),
  });
}
