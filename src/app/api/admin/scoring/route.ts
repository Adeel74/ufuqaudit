// GET/POST /api/admin/scoring — SEO scoring weights management
import { NextRequest, NextResponse } from "next/server";

interface ScoreWeights {
  technical: number;
  content: number;
  performance: number;
  aeo: number;
  geo: number;
  security: number;
}

let WEIGHTS: ScoreWeights = {
  technical: 25,
  content: 20,
  performance: 15,
  aeo: 15,
  geo: 15,
  security: 10,
};

export async function GET() {
  return NextResponse.json({
    weights: WEIGHTS,
    total: Object.values(WEIGHTS).reduce((s, v) => s + v, 0),
    categories: [
      { key: "technical", label: "Technical SEO", weight: WEIGHTS.technical, icon: "Cog", color: "#6366f1" },
      { key: "content", label: "Content SEO", weight: WEIGHTS.content, icon: "FileText", color: "#10b981" },
      { key: "performance", label: "Performance", weight: WEIGHTS.performance, icon: "Gauge", color: "#f59e0b" },
      { key: "aeo", label: "AEO", weight: WEIGHTS.aeo, icon: "MessageSquare", color: "#8b5cf6" },
      { key: "geo", label: "GEO / AI Visibility", weight: WEIGHTS.geo, icon: "Brain", color: "#ec4899" },
      { key: "security", label: "Security", weight: WEIGHTS.security, icon: "Shield", color: "#06b6d4" },
    ],
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { weights } = body;
  if (!weights) return NextResponse.json({ error: "weights required" }, { status: 400 });

  // Normalize weights to sum to 100
  const sum = Object.values(weights).reduce((s: number, v: any) => s + Number(v), 0);
  if (sum === 0) return NextResponse.json({ error: "Weights cannot all be 0" }, { status: 400 });

  const normalized: ScoreWeights = {
    technical: Math.round((Number(weights.technical) / sum) * 100),
    content: Math.round((Number(weights.content) / sum) * 100),
    performance: Math.round((Number(weights.performance) / sum) * 100),
    aeo: Math.round((Number(weights.aeo) / sum) * 100),
    geo: Math.round((Number(weights.geo) / sum) * 100),
    security: Math.round((Number(weights.security) / sum) * 100),
  };

  WEIGHTS = normalized;
  return NextResponse.json({ ok: true, weights: WEIGHTS });
}
