// GET /api/admin/competitors — competitor management config
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    settings: {
      maxCompetitorsPerAudit: 3,
      maxCompetitorUrls: 500,
      competitorCrawlDepth: 50,
      comparisonFeatures: {
        overallScore: true,
        categoryScores: true,
        performance: true,
        technical: true,
        aeo: true,
        geo: true,
        keywordOverlap: true,
        backlinkComparison: false,
        contentGap: true,
      },
      autoRefreshDays: 30,
      storeResults: true,
    },
    planLimits: [
      { plan: "Free", maxCompetitors: 0, maxUrls: 0 },
      { plan: "Starter", maxCompetitors: 1, maxUrls: 100 },
      { plan: "Professional", maxCompetitors: 5, maxUrls: 500 },
      { plan: "Agency", maxCompetitors: 20, maxUrls: 5000 },
    ],
    recentComparisons: [
      { id: "cmp_1", user: "Sarah Chen", org: "Northwind Digital", yourSite: "stripe.com", competitors: ["paypal.com", "square.com", "adyen.com"], date: new Date(Date.now() - 2 * 86400000).toISOString(), yourScore: 92, competitorAvg: 84 },
      { id: "cmp_2", user: "Amir Hassan", org: "PixelCraft Co", yourSite: "shopify.com", competitors: ["woocommerce.com", "bigcommerce.com"], date: new Date(Date.now() - 5 * 86400000).toISOString(), yourScore: 76, competitorAvg: 81 },
      { id: "cmp_3", user: "Mike Rodriguez", org: "Bright Labs", yourSite: "vercel.com", competitors: ["netlify.com", "heroku.com", "render.com"], date: new Date(Date.now() - 8 * 86400000).toISOString(), yourScore: 88, competitorAvg: 79 },
    ],
    stats: {
      totalComparisons: 234,
      thisMonth: 42,
      avgCompetitorsPerComparison: 2.8,
    },
  });
}
