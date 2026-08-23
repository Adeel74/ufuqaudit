// GET/POST /api/admin/plans — list + create pricing plans
import { NextRequest, NextResponse } from "next/server";

interface PlanConfig {
  id: string;
  name: string;
  internalId: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  trialDays: number;
  status: "active" | "archived";
  featured: boolean;
  displayOrder: number;
  limits: {
    projects: number;
    websites: number;
    urlsPerCrawl: number;
    monthlyAudits: number;
    scheduledAudits: number;
    teamMembers: number;
    apiRequests: number;
    apiRateLimit: number;
    aiRequests: number;
    aiCredits: number;
    pdfReports: number;
    whiteLabel: boolean;
    competitorAudits: number;
    gscIntegration: boolean;
    ga4Integration: boolean;
    aeo: boolean;
    geo: boolean;
    aiVisibility: boolean;
    keywordTracking: number;
    clientAccounts: number;
  };
}

const PLANS: PlanConfig[] = [
  {
    id: "free", name: "Free", internalId: "plan_free", description: "For trying out UfuqAudit",
    monthlyPrice: 0, yearlyPrice: 0, currency: "USD", trialDays: 0, status: "active", featured: false, displayOrder: 1,
    limits: { projects: 1, websites: 1, urlsPerCrawl: 50, monthlyAudits: 1, scheduledAudits: 0, teamMembers: 1, apiRequests: 100, apiRateLimit: 10, aiRequests: 10, aiCredits: 50, pdfReports: 1, whiteLabel: false, competitorAudits: 0, gscIntegration: false, ga4Integration: false, aeo: false, geo: false, aiVisibility: false, keywordTracking: 0, clientAccounts: 0 },
  },
  {
    id: "starter", name: "Starter", internalId: "plan_starter", description: "For freelancers & small sites",
    monthlyPrice: 19, yearlyPrice: 190, currency: "USD", trialDays: 14, status: "active", featured: true, displayOrder: 2,
    limits: { projects: 5, websites: 5, urlsPerCrawl: 1000, monthlyAudits: -1, scheduledAudits: 0, teamMembers: 3, apiRequests: 1000, apiRateLimit: 60, aiRequests: 500, aiCredits: 2000, pdfReports: 10, whiteLabel: false, competitorAudits: 1, gscIntegration: false, ga4Integration: false, aeo: true, geo: true, aiVisibility: true, keywordTracking: 50, clientAccounts: 0 },
  },
  {
    id: "pro", name: "Professional", internalId: "plan_pro", description: "For growing teams & agencies",
    monthlyPrice: 49, yearlyPrice: 490, currency: "USD", trialDays: 14, status: "active", featured: false, displayOrder: 3,
    limits: { projects: 20, websites: 20, urlsPerCrawl: 10000, monthlyAudits: -1, scheduledAudits: 20, teamMembers: 10, apiRequests: 10000, apiRateLimit: 300, aiRequests: 5000, aiCredits: 20000, pdfReports: 50, whiteLabel: true, competitorAudits: 5, gscIntegration: true, ga4Integration: true, aeo: true, geo: true, aiVisibility: true, keywordTracking: 500, clientAccounts: 5 },
  },
  {
    id: "agency", name: "Agency", internalId: "plan_agency", description: "For large agencies & enterprises",
    monthlyPrice: 99, yearlyPrice: 990, currency: "USD", trialDays: 30, status: "active", featured: false, displayOrder: 4,
    limits: { projects: 50, websites: 50, urlsPerCrawl: 50000, monthlyAudits: -1, scheduledAudits: 100, teamMembers: 50, apiRequests: 50000, apiRateLimit: 1000, aiRequests: 25000, aiCredits: 100000, pdfReports: -1, whiteLabel: true, competitorAudits: 20, gscIntegration: true, ga4Integration: true, aeo: true, geo: true, aiVisibility: true, keywordTracking: 5000, clientAccounts: 50 },
  },
];

export async function GET() {
  return NextResponse.json({ plans: PLANS });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, description, monthlyPrice, yearlyPrice } = body;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const newPlan: PlanConfig = {
    id: `plan_${Date.now()}`, name, internalId: `plan_${Date.now()}`, description: description || "",
    monthlyPrice: monthlyPrice || 0, yearlyPrice: yearlyPrice || 0, currency: "USD", trialDays: 14,
    status: "active", featured: false, displayOrder: PLANS.length + 1,
    limits: { projects: 1, websites: 1, urlsPerCrawl: 100, monthlyAudits: 1, scheduledAudits: 0, teamMembers: 1, apiRequests: 100, apiRateLimit: 10, aiRequests: 10, aiCredits: 50, pdfReports: 1, whiteLabel: false, competitorAudits: 0, gscIntegration: false, ga4Integration: false, aeo: false, geo: false, aiVisibility: false, keywordTracking: 0, clientAccounts: 0 },
  };
  PLANS.push(newPlan);
  return NextResponse.json({ plan: newPlan });
}
