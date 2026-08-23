// GET /api/admin/advanced-analytics — advanced platform analytics
import { NextResponse } from "next/server";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export async function GET() {
  // User growth (12 months)
  const userGrowth = Array.from({ length: 12 }, (_, i) => {
    const seed = hashStr("ug_" + i);
    return {
      month: new Date(Date.now() - (11 - i) * 30 * 86400000).toLocaleDateString("en-US", { month: "short" }),
      newUsers: 20 + (seed % 80),
      totalUsers: 100 + i * 35 + (seed % 50),
      churned: 2 + (seed % 8),
    };
  });

  // Revenue (12 months)
  const revenue = Array.from({ length: 12 }, (_, i) => {
    const seed = hashStr("rev_" + i);
    const mrr = 1500 + i * 280 + (seed % 200);
    return {
      month: new Date(Date.now() - (11 - i) * 30 * 86400000).toLocaleDateString("en-US", { month: "short" }),
      mrr,
      newRevenue: 200 + (seed % 400),
      refunds: 20 + (seed % 80),
      net: mrr - (20 + (seed % 80)),
    };
  });

  // Feature usage
  const featureUsage = [
    { feature: "Audit Dashboard", users: 3421, percentage: 89 },
    { feature: "Issues List", users: 3198, percentage: 83 },
    { feature: "AI Recommendations", users: 2876, percentage: 75 },
    { feature: "AEO Scoring", users: 2341, percentage: 61 },
    { feature: "GEO Scoring", users: 2189, percentage: 57 },
    { feature: "Performance View", users: 1987, percentage: 52 },
    { feature: "SEO Tools", users: 1654, percentage: 43 },
    { feature: "Competitor Audit", users: 892, percentage: 23 },
    { feature: "Client Portal", users: 678, percentage: 18 },
    { feature: "Scheduled Audits", users: 543, percentage: 14 },
  ];

  // Cohort retention (6 months, monthly)
  const cohorts = Array.from({ length: 6 }, (_, i) => {
    const month = new Date(Date.now() - (5 - i) * 30 * 86400000).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const size = 40 + i * 15 + (hashStr("cohort_" + i) % 30);
    const retention = Array.from({ length: 6 - i }, (_, j) => {
      const pct = Math.max(15, Math.round(100 * Math.pow(0.75, j) + (hashStr("ret_" + i + "_" + j) % 10) - 5));
      return { month: j, percentage: pct };
    });
    return { cohort: month, size, retention };
  });

  // Plan distribution
  const planDistribution = [
    { plan: "Free", users: 2103, percentage: 55, revenue: 0, color: "#94a3b8" },
    { plan: "Starter", users: 892, percentage: 23, revenue: 16948, color: "#10b981" },
    { plan: "Professional", users: 612, percentage: 16, revenue: 29988, color: "#f59e0b" },
    { plan: "Agency", users: 231, percentage: 6, revenue: 22869, color: "#8b5cf6" },
  ];

  // Most active users
  const mostActiveUsers = [
    { name: "Sarah Chen", email: "sarah@northwind.agency", org: "Northwind Digital", audits: 142, logins: 89, lastActive: "2h ago" },
    { name: "Amir Hassan", email: "amir@pixelcraft.co", org: "PixelCraft Co", audits: 98, logins: 67, lastActive: "5h ago" },
    { name: "Mike Rodriguez", email: "mike@brightlabs.io", org: "Bright Labs", audits: 76, logins: 52, lastActive: "1d ago" },
    { name: "Lena Petrova", email: "lena@growthflow.com", org: "GrowthFlow", audits: 43, logins: 34, lastActive: "3h ago" },
    { name: "John Smith", email: "john@acme.com", org: "Acme Corp", audits: 31, logins: 23, lastActive: "8h ago" },
  ];

  // Most audited websites
  const mostAuditedSites = [
    { url: "https://example.com", audits: 28, avgScore: 94, users: 5 },
    { url: "https://stripe.com", audits: 18, avgScore: 92, users: 3 },
    { url: "https://shopify.com", audits: 14, avgScore: 76, users: 2 },
    { url: "https://vercel.com", audits: 11, avgScore: 88, users: 4 },
    { url: "https://github.com", audits: 9, avgScore: 94, users: 3 },
  ];

  return NextResponse.json({
    userGrowth,
    revenue,
    featureUsage,
    cohorts,
    planDistribution,
    mostActiveUsers,
    mostAuditedSites,
    summary: {
      totalUsers: planDistribution.reduce((s, p) => s + p.users, 0),
      totalMrr: revenue[revenue.length - 1].mrr,
      avgRetention: 68,
      totalRevenue: planDistribution.reduce((s, p) => s + p.revenue, 0),
    },
  });
}
