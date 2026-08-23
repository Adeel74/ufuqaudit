// GET /api/admin/affiliates — referral/affiliate dashboard
import { NextResponse } from "next/server";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  status: "active" | "pending" | "suspended";
  referralCode: string;
  clicks: number;
  signups: number;
  paidCustomers: number;
  revenue: number;
  commissionRate: number;
  commissionEarned: number;
  pendingPayout: number;
  paidOut: number;
  joinedAt: string;
}

const AFFILIATES: Affiliate[] = [
  { id: "aff_1", name: "Sarah Chen", email: "sarah@northwind.agency", status: "active", referralCode: "SARAH20", clicks: 1240, signups: 89, paidCustomers: 23, revenue: 4380, commissionRate: 20, commissionEarned: 876, pendingPayout: 234, paidOut: 642, joinedAt: new Date(Date.now() - 120 * 86400000).toISOString() },
  { id: "aff_2", name: "Amir Hassan", email: "amir@pixelcraft.co", status: "active", referralCode: "AMIR15", clicks: 832, signups: 54, paidCustomers: 18, revenue: 3120, commissionRate: 15, commissionEarned: 468, pendingPayout: 180, paidOut: 288, joinedAt: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: "aff_3", name: "Mike Rodriguez", email: "mike@brightlabs.io", status: "active", referralCode: "MIKE25", clicks: 421, signups: 31, paidCustomers: 12, revenue: 1980, commissionRate: 25, commissionEarned: 495, pendingPayout: 165, paidOut: 330, joinedAt: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: "aff_4", name: "Lena Petrova", email: "lena@growthflow.com", status: "pending", referralCode: "LENA20", clicks: 87, signups: 5, paidCustomers: 1, revenue: 49, commissionRate: 20, commissionEarned: 9.8, pendingPayout: 9.8, paidOut: 0, joinedAt: new Date(Date.now() - 15 * 86400000).toISOString() },
  { id: "aff_5", name: "John Smith", email: "john@acme.com", status: "suspended", referralCode: "JOHN10", clicks: 234, signups: 12, paidCustomers: 3, revenue: 147, commissionRate: 10, commissionEarned: 14.7, pendingPayout: 0, paidOut: 14.7, joinedAt: new Date(Date.now() - 180 * 86400000).toISOString() },
];

export async function GET() {
  const totalClicks = AFFILIATES.reduce((s, a) => s + a.clicks, 0);
  const totalSignups = AFFILIATES.reduce((s, a) => s + a.signups, 0);
  const totalPaid = AFFILIATES.reduce((s, a) => s + a.paidCustomers, 0);
  const totalRevenue = AFFILIATES.reduce((s, a) => s + a.revenue, 0);
  const totalCommission = AFFILIATES.reduce((s, a) => s + a.commissionEarned, 0);
  const pendingPayouts = AFFILIATES.reduce((s, a) => s + a.pendingPayout, 0);

  return NextResponse.json({
    affiliates: AFFILIATES,
    stats: {
      total: AFFILIATES.length,
      active: AFFILIATES.filter((a) => a.status === "active").length,
      pending: AFFILIATES.filter((a) => a.status === "pending").length,
      suspended: AFFILIATES.filter((a) => a.status === "suspended").length,
      totalClicks,
      totalSignups,
      totalPaid,
      totalRevenue,
      totalCommission: Math.round(totalCommission * 100) / 100,
      pendingPayouts: Math.round(pendingPayouts * 100) / 100,
      conversionRate: Math.round((totalPaid / totalSignups) * 1000) / 10,
    },
    settings: {
      defaultCommission: 20,
      cookieDuration: 30,
      minPayout: 50,
    },
  });
}
