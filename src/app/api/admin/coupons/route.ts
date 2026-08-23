// GET /api/admin/coupons — coupon & promotion management
import { NextResponse } from "next/server";

interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "free_trial" | "free_months";
  value: number;
  description: string;
  status: "active" | "expired" | "disabled";
  conditions: {
    newUsersOnly: boolean;
    specificPlans: string[];
    expirationDate: string | null;
    usageLimit: number;
    used: number;
  };
  createdAt: string;
}

const COUPONS: Coupon[] = [
  { id: "cpn_1", code: "WELCOME20", type: "percentage", value: 20, description: "20% off any plan for new users", status: "active", conditions: { newUsersOnly: true, specificPlans: ["starter", "pro"], expirationDate: new Date(Date.now() + 30 * 86400000).toISOString(), usageLimit: 100, used: 43 }, createdAt: new Date(Date.now() - 15 * 86400000).toISOString() },
  { id: "cpn_2", code: "BLACKFRIDAY", type: "percentage", value: 50, description: "Black Friday — 50% off annual plans", status: "active", conditions: { newUsersOnly: false, specificPlans: ["pro", "agency"], expirationDate: new Date(Date.now() + 7 * 86400000).toISOString(), usageLimit: 500, used: 127 }, createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "cpn_3", code: "FREEMONTH", type: "free_months", value: 1, description: "First month free on any paid plan", status: "active", conditions: { newUsersOnly: true, specificPlans: ["starter", "pro", "agency"], expirationDate: null, usageLimit: 1000, used: 289 }, createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: "cpn_4", code: "TRIAL14", type: "free_trial", value: 14, description: "14-day extended trial", status: "active", conditions: { newUsersOnly: true, specificPlans: ["pro", "agency"], expirationDate: null, usageLimit: 200, used: 67 }, createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: "cpn_5", code: "FLAT49", type: "fixed", value: 10, description: "$10 off first payment", status: "active", conditions: { newUsersOnly: true, specificPlans: ["starter", "pro"], expirationDate: new Date(Date.now() + 60 * 86400000).toISOString(), usageLimit: 100, used: 12 }, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: "cpn_6", code: "SUMMER24", type: "percentage", value: 25, description: "Summer 2024 — 25% off", status: "expired", conditions: { newUsersOnly: false, specificPlans: ["starter", "pro", "agency"], expirationDate: new Date(Date.now() - 10 * 86400000).toISOString(), usageLimit: 300, used: 287 }, createdAt: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: "cpn_7", code: "AGENCY50", type: "percentage", value: 50, description: "50% off Agency plan — limited", status: "disabled", conditions: { newUsersOnly: true, specificPlans: ["agency"], expirationDate: new Date(Date.now() + 14 * 86400000).toISOString(), usageLimit: 50, used: 50 }, createdAt: new Date(Date.now() - 20 * 86400000).toISOString() },
];

export async function GET() {
  return NextResponse.json({
    coupons: COUPONS,
    stats: {
      total: COUPONS.length,
      active: COUPONS.filter((c) => c.status === "active").length,
      expired: COUPONS.filter((c) => c.status === "expired").length,
      disabled: COUPONS.filter((c) => c.status === "disabled").length,
      totalRedemptions: COUPONS.reduce((s, c) => s + c.conditions.used, 0),
      totalDiscountGiven: 0, // would compute from transactions
    },
  });
}
