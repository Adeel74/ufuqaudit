// GET /api/audit/get?id=<auditId> — load a specific audit with pages + issues
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildAiActionPlan } from "@/lib/analyzers";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const audit = await db.audit.findUnique({
      where: { id },
      include: {
        pages: { take: 50 },
        issues: { take: 200 },
      },
    });
    if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

    // Get all audits for this user for history
    const prev = await db.audit.findMany({
      where: { userId: audit.userId, status: "done" },
      orderBy: { createdAt: "asc" },
      select: { overallScore: true, createdAt: true },
    });
    const history = prev.map((p) => ({
      date: new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: p.overallScore,
    }));

    const counts = {
      critical: audit.criticalCount,
      error: audit.errorCount,
      warning: audit.warningCount,
      opportunity: audit.opportunityCount,
    };

    // Reconstruct issues array for the action plan
    const actionPlan = buildAiActionPlan(
      audit.issues.map((i) => ({
        category: i.category as any,
        severity: i.severity as any,
        issueType: i.issueType,
        title: i.title,
        description: i.description,
        impact: i.impact as any,
        recommendation: i.recommendation ?? undefined,
        pageUrl: i.pageUrl ?? undefined,
      }))
    );

    return NextResponse.json({
      id: audit.id,
      url: audit.url,
      status: audit.status,
      overallScore: audit.overallScore,
      scores: {
        technical: audit.technicalScore,
        content: audit.contentScore,
        performance: audit.performanceScore,
        aeo: audit.aeoScore,
        geo: audit.geoScore,
        security: audit.securityScore,
      },
      pages: audit.pages.map((p) => ({
        url: p.url,
        statusCode: p.statusCode ?? undefined,
        title: p.title ?? undefined,
        metaDescription: p.metaDescription ?? undefined,
        h1: p.h1 ?? undefined,
        wordCount: p.wordCount,
        loadTimeMs: p.loadTimeMs,
        pageSizeKb: p.pageSizeKb,
        indexable: p.indexable,
      })),
      issues: audit.issues.map((i) => ({
        category: i.category,
        severity: i.severity,
        issueType: i.issueType,
        title: i.title,
        description: i.description,
        impact: i.impact,
        recommendation: i.recommendation ?? undefined,
        pageUrl: i.pageUrl ?? undefined,
        status: i.status,
      })),
      pagesCrawled: audit.pagesCrawled,
      counts,
      aiActionPlan: actionPlan,
      summary: audit.summary ?? undefined,
      history,
      fromLive: false,
      createdAt: audit.createdAt.toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to load audit" }, { status: 500 });
  }
}
