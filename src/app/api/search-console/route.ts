// GET /api/search-console — mock Google Search Console data
import { NextResponse } from "next/server";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface QueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  trend: { date: string; clicks: number }[];
}

interface PageRow {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

const QUERIES = [
  "seo audit tool", "website audit", "aeo optimization", "geo ai visibility",
  "core web vitals checker", "schema markup generator", "robots.txt generator",
  "website health score", "ai search readiness", "seo checker free",
  "technical seo audit", "meta tag generator", "sitemap generator",
  "json-ld schema", "answer engine optimization",
];

const PAGES = [
  "/", "/blog/seo-guide", "/pricing", "/features", "/blog/aeo-guide",
  "/blog/geo-optimization", "/faq", "/about", "/blog/schema-markup",
];

export async function GET() {
  const queries: QueryRow[] = QUERIES.map((q, i) => {
    const seed = hashStr(q);
    const clicks = 50 + (seed % 3200);
    const impressions = clicks * (8 + (seed % 20));
    const ctr = Math.round((clicks / impressions) * 1000) / 10;
    const position = 1 + (seed % 45);
    const trend = Array.from({ length: 12 }, (_, w) => ({
      date: `W${w + 1}`,
      clicks: Math.max(5, clicks - (12 - w) * (5 + (seed % 8))),
    }));
    return { query: q, clicks, impressions, ctr, position, trend };
  }).sort((a, b) => b.clicks - a.clicks);

  const pages: PageRow[] = PAGES.map((p) => {
    const seed = hashStr(p);
    const clicks = 80 + (seed % 2800);
    const impressions = clicks * (6 + (seed % 15));
    const ctr = Math.round((clicks / impressions) * 1000) / 10;
    const position = 1 + (seed % 30);
    return { url: p, clicks, impressions, ctr, position };
  }).sort((a, b) => b.clicks - a.clicks);

  const totalClicks = queries.reduce((s, q) => s + q.clicks, 0);
  const totalImpressions = queries.reduce((s, q) => s + q.impressions, 0);
  const avgCtr = Math.round((totalClicks / totalImpressions) * 1000) / 10;
  const avgPosition = Math.round(queries.reduce((s, q) => s + q.position, 0) / queries.length * 10) / 10;

  // Countries
  const countries = [
    { country: "United States", code: "US", clicks: Math.round(totalClicks * 0.42), impressions: Math.round(totalImpressions * 0.38) },
    { country: "United Kingdom", code: "GB", clicks: Math.round(totalClicks * 0.15), impressions: Math.round(totalImpressions * 0.16) },
    { country: "India", code: "IN", clicks: Math.round(totalClicks * 0.12), impressions: Math.round(totalImpressions * 0.14) },
    { country: "Germany", code: "DE", clicks: Math.round(totalClicks * 0.08), impressions: Math.round(totalImpressions * 0.09) },
    { country: "Canada", code: "CA", clicks: Math.round(totalClicks * 0.07), impressions: Math.round(totalImpressions * 0.07) },
    { country: "Others", code: "XX", clicks: Math.round(totalClicks * 0.16), impressions: Math.round(totalImpressions * 0.16) },
  ];

  // Devices
  const devices = [
    { device: "Mobile", clicks: Math.round(totalClicks * 0.64), impressions: Math.round(totalImpressions * 0.68) },
    { device: "Desktop", clicks: Math.round(totalClicks * 0.28), impressions: Math.round(totalImpressions * 0.24) },
    { device: "Tablet", clicks: Math.round(totalClicks * 0.08), impressions: Math.round(totalImpressions * 0.08) },
  ];

  // 30-day trend
  const dailyTrend = Array.from({ length: 30 }, (_, i) => {
    const seed = hashStr("day" + i);
    return {
      date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      clicks: 40 + (seed % 80),
      impressions: 800 + (seed % 600),
    };
  });

  return NextResponse.json({
    summary: { totalClicks, totalImpressions, avgCtr, avgPosition, totalQueries: queries.length },
    queries,
    pages,
    countries,
    devices,
    dailyTrend,
  });
}
