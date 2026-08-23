import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [users, audits, projects, issues] = await Promise.all([
    db.user.count(),
    db.audit.count(),
    db.project.count(),
    db.issue.count(),
  ]);
  const recentAudits = await db.audit.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { user: true },
  });
  const avgScore = await db.audit.aggregate({ _avg: { overallScore: true } });
  return NextResponse.json({
    counts: { users, audits, projects, issues },
    avgScore: Math.round(avgScore._avg.overallScore || 0),
    recentAudits: recentAudits.map((a) => ({
      id: a.id,
      url: a.url,
      overallScore: a.overallScore,
      status: a.status,
      createdAt: a.createdAt,
      user: a.user?.email,
    })),
  });
}
