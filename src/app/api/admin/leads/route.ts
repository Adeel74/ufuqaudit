// GET /api/admin/leads — lead management for free audit conversions
import { NextResponse } from "next/server";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface Lead {
  id: string;
  website: string;
  email: string;
  score: number;
  issues: number;
  criticalIssues: number;
  source: string;
  campaign: string;
  status: "new" | "contacted" | "converted" | "lost";
  createdAt: string;
  convertedAt: string | null;
  plan: string | null;
}

const LEADS: Lead[] = [
  { id: "lead_1", website: "acme-store.com", email: "owner@acme-store.com", score: 42, issues: 23, criticalIssues: 4, source: "Free Audit", campaign: "Google Ads", status: "new", createdAt: new Date(Date.now() - 0.2 * 86400000).toISOString(), convertedAt: null, plan: null },
  { id: "lead_2", website: "brightlabs.io", email: "founder@brightlabs.io", score: 68, issues: 12, criticalIssues: 1, source: "Free Audit", campaign: "Organic", status: "contacted", createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), convertedAt: null, plan: null },
  { id: "lead_3", website: "globex.com", email: "marketing@globex.com", score: 81, issues: 8, criticalIssues: 0, source: "Free Audit", campaign: "Twitter", status: "converted", createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), convertedAt: new Date(Date.now() - 5 * 86400000).toISOString(), plan: "pro" },
  { id: "lead_4", website: "initech.com", email: "peter@initech.com", score: 35, issues: 31, criticalIssues: 6, source: "Free Audit", campaign: "LinkedIn", status: "lost", createdAt: new Date(Date.now() - 14 * 86400000).toISOString(), convertedAt: null, plan: null },
  { id: "lead_5", website: "umbrella.com", email: "olivia@umbrella.com", score: 74, issues: 15, criticalIssues: 2, source: "Free Audit", campaign: "Product Hunt", status: "new", createdAt: new Date(Date.now() - 0.5 * 86400000).toISOString(), convertedAt: null, plan: null },
  { id: "lead_6", website: "growthflow.com", email: "lena@growthflow.com", score: 88, issues: 6, criticalIssues: 0, source: "Free Audit", campaign: "Organic", status: "converted", createdAt: new Date(Date.now() - 21 * 86400000).toISOString(), convertedAt: new Date(Date.now() - 18 * 86400000).toISOString(), plan: "starter" },
  { id: "lead_7", website: "pixelcraft.co", email: "amir@pixelcraft.co", score: 92, issues: 4, criticalIssues: 0, source: "Free Audit", campaign: "Referral", status: "converted", createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), convertedAt: new Date(Date.now() - 28 * 86400000).toISOString(), plan: "agency" },
  { id: "lead_8", website: "dataviz.io", email: "contact@dataviz.io", score: 57, issues: 18, criticalIssues: 3, source: "Free Audit", campaign: "Google Ads", status: "contacted", createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), convertedAt: null, plan: null },
  { id: "lead_9", website: "techcorp.com", email: "james@techcorp.com", score: 63, issues: 14, criticalIssues: 1, source: "Free Audit", campaign: "Newsletter", status: "new", createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), convertedAt: null, plan: null },
  { id: "lead_10", website: "northwind.agency", email: "sarah@northwind.agency", score: 95, issues: 3, criticalIssues: 0, source: "Free Audit", campaign: "Referral", status: "converted", createdAt: new Date(Date.now() - 45 * 86400000).toISOString(), convertedAt: new Date(Date.now() - 42 * 86400000).toISOString(), plan: "agency" },
];

export async function GET() {
  const total = LEADS.length;
  const converted = LEADS.filter((l) => l.status === "converted").length;
  const conversionRate = Math.round((converted / total) * 1000) / 10;
  const avgScore = Math.round(LEADS.reduce((s, l) => s + l.score, 0) / total);

  return NextResponse.json({
    leads: LEADS,
    stats: {
      total,
      new: LEADS.filter((l) => l.status === "new").length,
      contacted: LEADS.filter((l) => l.status === "contacted").length,
      converted,
      lost: LEADS.filter((l) => l.status === "lost").length,
      conversionRate,
      avgScore,
      avgIssues: Math.round(LEADS.reduce((s, l) => s + l.issues, 0) / total),
    },
  });
}
