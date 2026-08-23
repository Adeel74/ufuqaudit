// GET /api/admin/all-audits — all audits across the platform
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const audits = await db.audit.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: true },
  });

  const formatted = audits.map((a) => ({
    id: a.id,
    url: a.url,
    user: a.user?.email || "unknown",
    userName: a.user?.name || "Unknown",
    overallScore: a.overallScore,
    status: a.status,
    pagesCrawled: a.pagesCrawled,
    issuesCount: a.issuesCount,
    criticalCount: a.criticalCount,
    duration: Math.round((Date.now() - a.createdAt.getTime()) / 1000),
    started: a.createdAt.toISOString(),
    completed: a.status === "done" ? a.createdAt.toISOString() : null,
  }));

  return NextResponse.json({
    audits: formatted,
    stats: {
      total: await db.audit.count(),
      running: await db.audit.count({ where: { status: "running" } }),
      completed: await db.audit.count({ where: { status: "done" } }),
      failed: await db.audit.count({ where: { status: "failed" } }),
    },
  });
}
