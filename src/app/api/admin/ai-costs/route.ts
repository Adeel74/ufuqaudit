// GET /api/admin/ai-costs — AI cost analytics
import { NextResponse } from "next/server";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export async function GET() {
  // 30-day AI cost trend
  const dailyCost = Array.from({ length: 30 }, (_, i) => {
    const seed = hashStr("ai_day_" + i);
    const tokens = 5000 + (seed % 50000);
    const cost = Math.round(tokens * 0.00002 * 100) / 100;
    return {
      date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tokens,
      cost,
    };
  });

  // Cost per model
  const costPerModel = [
    { model: "glm-5.2 (Z.ai)", tokens: 432189, cost: 432.19, color: "#10b981" },
    { model: "gpt-4o (OpenAI)", tokens: 128453, cost: 192.68, color: "#6366f1" },
    { model: "gpt-4o-mini (OpenAI)", tokens: 892431, cost: 53.55, color: "#8b5cf6" },
    { model: "claude-3-5-sonnet (Anthropic)", tokens: 0, cost: 0, color: "#ec4899" },
  ];

  // Cost per feature
  const costPerFeature = [
    { feature: "AI Recommendations", tokens: 312456, cost: 187.47 },
    { feature: "Meta Tag Generation", tokens: 421893, cost: 42.19 },
    { feature: "FAQ Generation", tokens: 189432, cost: 113.66 },
    { feature: "Schema Generation", tokens: 87432, cost: 8.74 },
    { feature: "Content Brief", tokens: 234567, cost: 210.21 },
    { feature: "AEO Recommendations", tokens: 156789, cost: 94.07 },
    { feature: "GEO Recommendations", tokens: 98432, cost: 58.91 },
  ];

  // Top users by AI cost
  const topUsers = [
    { user: "Sarah Chen", email: "sarah@northwind.agency", org: "Northwind Digital", tokens: 128432, cost: 128.43 },
    { user: "Amir Hassan", email: "amir@pixelcraft.co", org: "PixelCraft Co", tokens: 98421, cost: 98.42 },
    { user: "Mike Rodriguez", email: "mike@brightlabs.io", org: "Bright Labs", tokens: 67432, cost: 67.43 },
    { user: "Lena Petrova", email: "lena@growthflow.com", org: "GrowthFlow", tokens: 45189, cost: 45.19 },
    { user: "John Smith", email: "john@acme.com", org: "Acme Corp", tokens: 32876, cost: 32.88 },
  ];

  const totalTokens = costPerModel.reduce((s, m) => s + m.tokens, 0);
  const totalCost = costPerModel.reduce((s, m) => s + m.cost, 0);
  const monthlyBudget = 1000;
  const budgetUsed = Math.round((totalCost / monthlyBudget) * 100);

  return NextResponse.json({
    summary: {
      totalTokens,
      totalCost: Math.round(totalCost * 100) / 100,
      monthlyBudget,
      budgetUsed,
      budgetRemaining: Math.round((monthlyBudget - totalCost) * 100) / 100,
      requests: 3452,
      avgCostPerRequest: Math.round((totalCost / 3452) * 100) / 100,
    },
    dailyCost,
    costPerModel,
    costPerFeature,
    topUsers,
  });
}
