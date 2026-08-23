// GET /api/admin/subscriptions — list all subscriptions
import { NextResponse } from "next/server";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const SUB_DATA = [
  { user: "Sarah Chen", email: "sarah@northwind.agency", org: "Northwind Digital", plan: "Agency", amount: 99, cycle: "monthly" },
  { user: "Mike Rodriguez", email: "mike@brightlabs.io", org: "Bright Labs", plan: "Professional", amount: 49, cycle: "monthly" },
  { user: "Amir Hassan", email: "amir@pixelcraft.co", org: "PixelCraft Co", plan: "Agency", amount: 99, cycle: "yearly" },
  { user: "Lena Petrova", email: "lena@growthflow.com", org: "GrowthFlow", plan: "Starter", amount: 19, cycle: "monthly" },
  { user: "John Smith", email: "john@acme.com", org: "Acme Corp", plan: "Professional", amount: 49, cycle: "monthly" },
  { user: "Emma Wilson", email: "emma@globex.com", org: "Globex Inc", plan: "Free", amount: 0, cycle: "—" },
  { user: "David Kim", email: "david@initech.com", org: "Initech", plan: "Starter", amount: 19, cycle: "yearly" },
  { user: "Olivia Brown", email: "olivia@umbrella.com", org: "Umbrella LLC", plan: "Free", amount: 0, cycle: "—" },
  { user: "James Lee", email: "james@techcorp.com", org: "TechCorp", plan: "Professional", amount: 49, cycle: "monthly" },
  { user: "Sophia Chen", email: "sophia@dataviz.io", org: "DataViz", plan: "Agency", amount: 99, cycle: "yearly" },
];

const STATUSES = ["trial", "active", "active", "active", "past_due", "active", "active", "active", "cancelled", "active"] as const;

export async function GET() {
  const now = Date.now();
  const subs = SUB_DATA.map((s, i) => {
    const seed = hashStr(s.email);
    const status = STATUSES[i];
    const createdAt = new Date(now - (30 + (seed % 300)) * 86400000).toISOString();
    const renewalDate = new Date(now + (1 + (seed % 30)) * 86400000).toISOString();
    return {
      id: `sub_${i + 1}`,
      ...s,
      status,
      createdAt,
      renewalDate,
      trialEnds: status === "trial" ? new Date(now + (1 + (seed % 7)) * 86400000).toISOString() : null,
    };
  });

  return NextResponse.json({
    subs,
    stats: {
      total: subs.length,
      active: subs.filter((s) => s.status === "active").length,
      trial: subs.filter((s) => s.status === "trial").length,
      pastDue: subs.filter((s) => s.status === "past_due").length,
      cancelled: subs.filter((s) => s.status === "cancelled").length,
      mrr: subs.filter((s) => s.status === "active" && s.cycle === "monthly").reduce((sum, s) => sum + s.amount, 0),
      arr: subs.filter((s) => s.status === "active" && s.cycle === "yearly").reduce((sum, s) => sum + s.amount, 0),
    },
  });
}
