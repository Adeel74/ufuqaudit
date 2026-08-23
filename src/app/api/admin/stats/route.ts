import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [users, audits, projects, issues] = await Promise.all([
    db.user.count(),
    db.audit.count(),
    db.project.count(),
    db.issue.count(),
  ]);
  // Deduplicate: pick the latest audit per distinct URL so the admin table
  // shows a variety of sites rather than N runs of the same URL.
  const allRecent = await db.audit.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { user: true },
  });
  const seenUrls = new Set<string>();
  const recentAudits: Array<{
    id: string;
    url: string;
    overallScore: number;
    status: string;
    createdAt: Date;
    user: string | null;
  }> = [];
  for (const a of allRecent) {
    if (seenUrls.has(a.url)) continue;
    seenUrls.add(a.url);
    recentAudits.push({
      id: a.id,
      url: a.url,
      overallScore: a.overallScore,
      status: a.status,
      createdAt: a.createdAt,
      user: a.user?.email,
    });
    if (recentAudits.length >= 8) break;
  }
  const avgScore = await db.audit.aggregate({ _avg: { overallScore: true } });
  return NextResponse.json({
    counts: { users, audits, projects, issues },
    avgScore: Math.round(avgScore._avg.overallScore || 0),
    recentAudits,
  });
}
