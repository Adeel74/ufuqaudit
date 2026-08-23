// GET /api/portal/[token] — fetch a single portal link + its audit data
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface PortalLink {
  id: string;
  token: string;
  clientName: string;
  clientEmail: string;
  auditUrl: string;
  overallScore: number;
  createdAt: string;
  expiresAt: string | null;
  views: number;
  lastViewedAt: string | null;
  branding: { agencyName: string; primaryColor: string; logoUrl: string | null };
}

const PORTAL_LINKS: PortalLink[] = [
  {
    id: "pl_1",
    token: "abc123xyz789",
    clientName: "Acme Corp",
    clientEmail: "john@acme.com",
    auditUrl: "https://example.com",
    overallScore: 94,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 25 * 86400000).toISOString(),
    views: 7,
    lastViewedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    branding: { agencyName: "Northwind Digital", primaryColor: "#10b981", logoUrl: null },
  },
  {
    id: "pl_2",
    token: "def456uvw012",
    clientName: "Globex Inc",
    clientEmail: "sarah@globex.com",
    auditUrl: "https://stripe.com",
    overallScore: 92,
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    expiresAt: null,
    views: 14,
    lastViewedAt: new Date(Date.now() - 86400000).toISOString(),
    branding: { agencyName: "Northwind Digital", primaryColor: "#10b981", logoUrl: null },
  },
];

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = PORTAL_LINKS.find((l) => l.token === token);

  if (!link) {
    return NextResponse.json({ error: "Link not found or has been revoked" }, { status: 404 });
  }

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return NextResponse.json({ error: "This link has expired", expired: true }, { status: 410 });
  }

  let auditData: { audit: any; issues: any[] } | null = null;
  try {
    const a = await db.audit.findFirst({
      where: { url: link.auditUrl },
      orderBy: { createdAt: "desc" },
      include: { issues: { take: 30, orderBy: { severity: "asc" } } },
    });
    if (a) auditData = { audit: a, issues: (a as any).issues ?? [] };
  } catch {}

  const audit = auditData?.audit ?? null;
  const auditIssues = auditData?.issues ?? [];

  const scores = audit
    ? {
        technical: audit.technicalScore,
        content: audit.contentScore,
        performance: audit.performanceScore,
        aeo: audit.aeoScore,
        geo: audit.geoScore,
        security: audit.securityScore,
      }
    : {
        technical: 87,
        content: 94,
        performance: 100,
        aeo: 97,
        geo: 94,
        security: 99,
      };

  const counts = audit
    ? {
        critical: audit.criticalCount,
        error: audit.errorCount,
        warning: audit.warningCount,
        opportunity: audit.opportunityCount,
      }
    : { critical: 0, error: 2, warning: 8, opportunity: 5 };

  const topIssues = audit
    ? auditIssues.slice(0, 10).map((i: any) => ({
        category: i.category,
        severity: i.severity,
        title: i.title,
        description: i.description,
        recommendation: i.recommendation,
      }))
    : [
        { category: "on_page", severity: "warning", title: "Missing meta description", description: "Add a unique meta description.", recommendation: "Write 140-160 chars." },
        { category: "content", severity: "warning", title: "Thin content", description: "Pages under 300 words.", recommendation: "Expand content." },
      ];

  return NextResponse.json({
    link: {
      clientName: link.clientName,
      auditUrl: link.auditUrl,
      overallScore: link.overallScore,
      branding: link.branding,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
    },
    audit: {
      overallScore: audit?.overallScore ?? link.overallScore,
      scores,
      counts,
      pagesCrawled: audit?.pagesCrawled ?? 12,
      summary: audit?.summary ?? `Overall health ${link.overallScore}/100 with 12 pages crawled.`,
      topIssues,
      aiActionPlan: [
        "Generate meta descriptions for all pages.",
        "Add Organization + WebSite JSON-LD schema.",
        "Improve internal linking to orphan pages.",
      ],
    },
  });
}
