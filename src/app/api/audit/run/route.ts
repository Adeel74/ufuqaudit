// POST /api/audit/run — run a fresh audit for a URL
import { NextRequest, NextResponse } from "next/server";
import { crawl } from "@/lib/crawler";
import { analyze, buildAiActionPlan } from "@/lib/analyzers";
import { generateAuditSummary } from "@/lib/ai";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = (body?.url || "").toString().trim();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    // best-effort: ensure demo user exists
    let user = await db.user.findFirst({ where: { email: "demo@ufuqaudit.app" } });
    if (!user) {
      user = await db.user.create({ data: { email: "demo@ufuqaudit.app", name: "Demo User", role: "admin", plan: "pro" } });
    }
    let project = await db.project.findFirst({ where: { userId: user.id, url } });
    if (!project) {
      project = await db.project.create({ data: { name: url, url, userId: user.id } });
    }

    const auditRow = await db.audit.create({
      data: { projectId: project.id, userId: user.id, url, status: "running" },
    });

    const crawlRes = await crawl(url);
    const result = analyze(crawlRes);

    for (const p of crawlRes.pages) {
      await db.auditPage.create({
        data: {
          auditId: auditRow.id,
          url: p.url,
          statusCode: p.statusCode ?? null,
          title: p.title ?? null,
          metaDescription: p.metaDescription ?? null,
          h1: p.h1 ?? null,
          wordCount: p.wordCount ?? 0,
          loadTimeMs: p.loadTimeMs ?? 0,
          pageSizeKb: p.pageSizeKb ?? 0,
          indexable: p.indexable ?? true,
          issuesCount: 0,
        },
      });
    }

    for (const i of result.issues) {
      await db.issue.create({
        data: {
          auditId: auditRow.id,
          category: i.category,
          severity: i.severity,
          issueType: i.issueType,
          title: i.title,
          description: i.description,
          impact: i.impact,
          recommendation: i.recommendation ?? null,
          pageUrl: i.pageUrl ?? null,
          status: "open",
        },
      });
    }

    const summary = await generateAuditSummary(
      { overall: result.overall, ...result.scores },
      url,
      result.counts
    ).catch(() => "");

    await db.audit.update({
      where: { id: auditRow.id },
      data: {
        status: "done",
        overallScore: result.overall,
        technicalScore: result.scores.technical,
        contentScore: result.scores.content,
        performanceScore: result.scores.performance,
        aeoScore: result.scores.aeo,
        geoScore: result.scores.geo,
        securityScore: result.scores.security,
        pagesCrawled: crawlRes.pages.length,
        issuesCount: result.issues.length,
        criticalCount: result.counts.critical,
        errorCount: result.counts.error,
        warningCount: result.counts.warning,
        opportunityCount: result.counts.opportunity,
        summary,
      },
    });

    // Audit log entry
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "audit.run",
        entity: "audit",
        entityId: auditRow.id,
        details: `Audited ${url} — score ${result.overall}/100 (${crawlRes.pages.length} pages, ${result.issues.length} issues)`,
      },
    }).catch(() => {});

    // Issue creation logs (only for critical)
    for (const issue of result.issues.filter((i) => i.severity === "critical").slice(0, 5)) {
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: "issue.detected",
          entity: "issue",
          entityId: auditRow.id,
          details: `Critical: ${issue.title}`,
        },
      }).catch(() => {});
    }

    const prev = await db.audit.findMany({
      where: { userId: user.id, status: "done" },
      orderBy: { createdAt: "asc" },
      select: { overallScore: true, createdAt: true },
    });
    const history = prev.map((p) => ({
      date: new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: p.overallScore,
    }));

    const actionPlan = buildAiActionPlan(result.issues);

    return NextResponse.json({
      id: auditRow.id,
      url,
      status: "done",
      overallScore: result.overall,
      scores: result.scores,
      pages: crawlRes.pages,
      issues: result.issues,
      pagesCrawled: crawlRes.pages.length,
      counts: result.counts,
      aiActionPlan: actionPlan,
      summary,
      history,
      fromLive: crawlRes.fromLive,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Audit failed" }, { status: 500 });
  }
}
