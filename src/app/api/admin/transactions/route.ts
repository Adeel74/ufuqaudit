// GET /api/admin/transactions — billing transactions
import { NextResponse } from "next/server";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const PROVIDERS = ["Stripe", "Stripe", "Stripe", "Paddle", "Stripe", "PayPal", "Stripe", "Stripe"];
const STATUSES = ["paid", "paid", "paid", "pending", "paid", "failed", "paid", "refunded"] as const;

export async function GET() {
  const now = Date.now();
  const transactions = Array.from({ length: 20 }, (_, i) => {
    const seed = hashStr(`tx_${i}_${PROVIDERS[i % PROVIDERS.length]}`);
    const amount = [0, 19, 49, 99, 490, 990][seed % 6];
    const currency = "USD";
    const status = STATUSES[i % STATUSES.length];
    const user = ["Sarah Chen", "Mike Rodriguez", "Amir Hassan", "Lena Petrova", "John Smith", "Emma Wilson", "David Kim", "Olivia Brown"][i % 8];
    const email = ["sarah@northwind.agency", "mike@brightlabs.io", "amir@pixelcraft.co", "lena@growthflow.com", "john@acme.com", "emma@globex.com", "david@initech.com", "olivia@umbrella.com"][i % 8];
    const org = ["Northwind Digital", "Bright Labs", "PixelCraft Co", "GrowthFlow", "Acme Corp", "Globex Inc", "Initech", "Umbrella LLC"][i % 8];
    const plan = ["Free", "Starter", "Professional", "Agency"][seed % 4];
    const provider = PROVIDERS[i % PROVIDERS.length];
    const date = new Date(now - (i * 3 + 1) * 86400000).toISOString();
    return {
      id: `tx_${String(i + 1).padStart(4, "0")}`,
      user, email, org, plan, amount, currency, provider, status, date,
    };
  });

  const totalRevenue = transactions.filter((t) => t.status === "paid").reduce((s, t) => s + t.amount, 0);
  const refunds = transactions.filter((t) => t.status === "refunded").reduce((s, t) => s + t.amount, 0);
  const failed = transactions.filter((t) => t.status === "failed").length;

  return NextResponse.json({
    transactions,
    stats: {
      total: transactions.length,
      totalRevenue,
      refunds,
      failed,
      netRevenue: totalRevenue - refunds,
      mrr: Math.round(totalRevenue / 6), // approx monthly
    },
  });
}
