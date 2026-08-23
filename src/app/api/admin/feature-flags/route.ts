// GET/POST /api/admin/feature-flags — feature flag management
import { NextRequest, NextResponse } from "next/server";

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  category: string;
  enabled: boolean;
  globalDefault: boolean;
  planOverrides: { plan: string; enabled: boolean }[];
  rolloutPercent: number;
  createdAt: string;
  updatedAt: string;
}

const FLAGS: FeatureFlag[] = [
  { id: "ff_1", name: "AEO Scoring", key: "aeo_scoring", description: "Answer Engine Optimization scoring engine", category: "Audit", enabled: true, globalDefault: true, planOverrides: [{ plan: "free", enabled: false }, { plan: "starter", enabled: true }, { plan: "pro", enabled: true }, { plan: "agency", enabled: true }], rolloutPercent: 100, createdAt: new Date(Date.now() - 90 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "ff_2", name: "GEO / AI Visibility", key: "geo_ai_visibility", description: "AI visibility readiness checks", category: "Audit", enabled: true, globalDefault: true, planOverrides: [{ plan: "free", enabled: false }, { plan: "starter", enabled: true }, { plan: "pro", enabled: true }, { plan: "agency", enabled: true }], rolloutPercent: 100, createdAt: new Date(Date.now() - 60 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: "ff_3", name: "AI Recommendations", key: "ai_recommendations", description: "AI-powered fix suggestions", category: "AI", enabled: true, globalDefault: true, planOverrides: [{ plan: "free", enabled: true }, { plan: "starter", enabled: true }, { plan: "pro", enabled: true }, { plan: "agency", enabled: true }], rolloutPercent: 100, createdAt: new Date(Date.now() - 120 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "ff_4", name: "Competitor Audit", key: "competitor_audit", description: "Side-by-side competitor comparison", category: "Audit", enabled: true, globalDefault: false, planOverrides: [{ plan: "free", enabled: false }, { plan: "starter", enabled: false }, { plan: "pro", enabled: true }, { plan: "agency", enabled: true }], rolloutPercent: 100, createdAt: new Date(Date.now() - 45 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "ff_5", name: "Google Search Console", key: "gsc_integration", description: "GSC OAuth integration", category: "Integration", enabled: true, globalDefault: false, planOverrides: [{ plan: "free", enabled: false }, { plan: "starter", enabled: false }, { plan: "pro", enabled: true }, { plan: "agency", enabled: true }], rolloutPercent: 100, createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: "ff_6", name: "White-Label Reports", key: "white_label_reports", description: "Custom branded PDF reports", category: "Reports", enabled: true, globalDefault: false, planOverrides: [{ plan: "free", enabled: false }, { plan: "starter", enabled: false }, { plan: "pro", enabled: true }, { plan: "agency", enabled: true }], rolloutPercent: 100, createdAt: new Date(Date.now() - 50 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: "ff_7", name: "Client Portal", key: "client_portal", description: "Shareable branded audit links", category: "Reports", enabled: true, globalDefault: false, planOverrides: [{ plan: "free", enabled: false }, { plan: "starter", enabled: false }, { plan: "pro", enabled: true }, { plan: "agency", enabled: true }], rolloutPercent: 100, createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "ff_8", name: "AI Blog Generator", key: "ai_blog_generator", description: "Generate SEO blog posts with AI", category: "AI", enabled: false, globalDefault: false, planOverrides: [{ plan: "free", enabled: false }, { plan: "starter", enabled: false }, { plan: "pro", enabled: false }, { plan: "agency", enabled: true }], rolloutPercent: 25, createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 0.5 * 86400000).toISOString() },
  { id: "ff_9", name: "Scheduled Audits", key: "scheduled_audits", description: "Recurring automated audits", category: "Audit", enabled: true, globalDefault: false, planOverrides: [{ plan: "free", enabled: false }, { plan: "starter", enabled: false }, { plan: "pro", enabled: true }, { plan: "agency", enabled: true }], rolloutPercent: 100, createdAt: new Date(Date.now() - 70 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: "ff_10", name: "Free Audit", key: "free_audit", description: "Public free audit without signup", category: "Marketing", enabled: true, globalDefault: true, planOverrides: [{ plan: "free", enabled: true }, { plan: "starter", enabled: true }, { plan: "pro", enabled: true }, { plan: "agency", enabled: true }], rolloutPercent: 100, createdAt: new Date(Date.now() - 100 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 8 * 86400000).toISOString() },
];

export async function GET() {
  return NextResponse.json({
    flags: FLAGS,
    stats: {
      total: FLAGS.length,
      enabled: FLAGS.filter((f) => f.enabled).length,
      disabled: FLAGS.filter((f) => !f.enabled).length,
      categories: [...new Set(FLAGS.map((f) => f.category))].length,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { id, action, enabled, rolloutPercent, planOverrides } = body;

  if (action === "toggle" && id) {
    const flag = FLAGS.find((f) => f.id === id);
    if (flag) {
      flag.enabled = !flag.enabled;
      flag.updatedAt = new Date().toISOString();
      return NextResponse.json({ ok: true, flag });
    }
  }
  if (action === "update" && id) {
    const flag = FLAGS.find((f) => f.id === id);
    if (flag) {
      if (typeof enabled === "boolean") flag.enabled = enabled;
      if (typeof rolloutPercent === "number") flag.rolloutPercent = rolloutPercent;
      if (planOverrides) flag.planOverrides = planOverrides;
      flag.updatedAt = new Date().toISOString();
      return NextResponse.json({ ok: true, flag });
    }
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
