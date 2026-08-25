// GET /api/all-audits — list all audits with full details for the all-audits page
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const audits = await db.audit.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: true, pages: { take: 5 } },
  });

  const formatted = audits.map((a) => ({
    id: a.id,
    url: a.url,
    user: a.user?.email || "unknown",
    userName: a.user?.name || "Unknown",
    overallScore: a.overallScore,
    status: a.status,
    scores: {
      technical: a.technicalScore,
      content: a.contentScore,
      performance: a.performanceScore,
      aeo: a.aeoScore,
      geo: a.geoScore,
      security: a.securityScore,
    },
    pagesCrawled: a.pagesCrawled,
    issuesCount: a.issuesCount,
    criticalCount: a.criticalCount,
    errorCount: a.errorCount,
    warningCount: a.warningCount,
    opportunityCount: a.opportunityCount,
    summary: a.summary,
    createdAt: a.createdAt.toISOString(),
    pageUrls: a.pages.map((p) => p.url),
  }));

  return NextResponse.json({
    audits: formatted,
    stats: {
      total: formatted.length,
      avgScore: formatted.length ? Math.round(formatted.reduce((s, a) => s + a.overallScore, 0) / formatted.length) : 0,
      totalIssues: formatted.reduce((s, a) => s + a.issuesCount, 0),
      totalCritical: formatted.reduce((s, a) => s + a.criticalCount, 0),
    },
  });
}
