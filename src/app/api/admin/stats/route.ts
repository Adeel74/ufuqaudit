import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export async function GET() {
  const [users, audits, projects, issues, pages, recommendations] = await Promise.all([
    db.user.count(),
    db.audit.count(),
    db.project.count(),
    db.issue.count(),
    db.auditPage.count(),
    db.recommendation.count(),
  ]);

  // Deduplicate recent audits by URL
  const allRecent = await db.audit.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { user: true },
  });
  const seenUrls = new Set<string>();
  const recentAudits: Array<{
    id: string; url: string; overallScore: number; status: string;
    createdAt: Date; user: string | null;
  }> = [];
  for (const a of allRecent) {
    if (seenUrls.has(a.url)) continue;
    seenUrls.add(a.url);
    recentAudits.push({
      id: a.id, url: a.url, overallScore: a.overallScore, status: a.status,
      createdAt: a.createdAt, user: a.user?.email ?? null,
    });
    if (recentAudits.length >= 8) break;
  }
  const avgScore = await db.audit.aggregate({ _avg: { overallScore: true } });

  // User stats
  const now = Date.now();
  const todayStart = new Date(now - 86400000);
  const monthStart = new Date(now - 30 * 86400000);
  const usersToday = await db.user.count({ where: { createdAt: { gte: todayStart } } });
  const usersThisMonth = await db.user.count({ where: { createdAt: { gte: monthStart } } });

  // Plan distribution
  const planCounts = await db.user.groupBy({
    by: ["plan"],
    _count: { plan: true },
  });

  // Mock SaaS metrics (would come from billing DB in production)
  const totalApiRequests = 124_532 + (hashStr("api") % 5000);
  const aiTokensUsed = 892_431 + (hashStr("ai") % 50000);
  const monthlyRevenue = 4_827;
  const annualRevenue = monthlyRevenue * 12;
  const activeSubscriptions = 34;
  const trialUsers = 12;
  const cancelledSubscriptions = 8;
  const failedPayments = 3;

  return NextResponse.json({
    counts: {
      users, audits, projects, issues, pages, recommendations,
      activeUsers: Math.round(users * 0.65),
      usersToday, usersThisMonth,
      totalApiRequests, aiTokensUsed,
      monthlyRevenue, annualRevenue,
      activeSubscriptions, trialUsers, cancelledSubscriptions, failedPayments,
    },
    avgScore: Math.round(avgScore._avg.overallScore || 0),
    recentAudits,
    planDistribution: planCounts.map((p) => ({ plan: p.plan, count: p._count.plan })),
  });
}
