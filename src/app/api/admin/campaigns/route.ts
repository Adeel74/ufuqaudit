// GET /api/admin/campaigns — email marketing campaigns
import { NextResponse } from "next/server";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface Campaign {
  id: string;
  name: string;
  type: "newsletter" | "promotional" | "onboarding" | "announcement";
  subject: string;
  audience: string;
  status: "sent" | "scheduled" | "draft" | "sending";
  recipients: number;
  opens: number;
  clicks: number;
  bounceRate: number;
  unsubscribes: number;
  sentAt: string | null;
  createdAt: string;
}

const CAMPAIGNS: Campaign[] = [
  { id: "camp_1", name: "Weekly SEO Tips — Issue #12", type: "newsletter", subject: "5 SEO fixes you can make today", audience: "All subscribers", status: "sent", recipients: 4532, opens: 2189, clicks: 432, bounceRate: 1.2, unsubscribes: 8, sentAt: new Date(Date.now() - 3 * 86400000).toISOString(), createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: "camp_2", name: "Pro Plan Discount", type: "promotional", subject: "Get 20% off Pro — this week only", audience: "Free + Starter users", status: "sent", recipients: 2841, opens: 1543, clicks: 318, bounceRate: 0.8, unsubscribes: 12, sentAt: new Date(Date.now() - 10 * 86400000).toISOString(), createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
  { id: "camp_3", name: "New User Onboarding", type: "onboarding", subject: "Welcome to UfuqAudit — get started", audience: "New signups (7 days)", status: "sending", recipients: 156, opens: 89, clicks: 34, bounceRate: 0, unsubscribes: 0, sentAt: null, createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "camp_4", name: "AEO Feature Launch", type: "announcement", subject: "New: AEO scoring is here!", audience: "All active users", status: "scheduled", recipients: 3421, opens: 0, clicks: 0, bounceRate: 0, unsubscribes: 0, sentAt: null, createdAt: new Date(Date.now() - 0.5 * 86400000).toISOString() },
  { id: "camp_5", name: "Re-engagement — Inactive Users", type: "promotional", subject: "We miss you — here's 50% off", audience: "Inactive (30 days)", status: "draft", recipients: 892, opens: 0, clicks: 0, bounceRate: 0, unsubscribes: 0, sentAt: null, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "camp_6", name: "Weekly SEO Tips — Issue #11", type: "newsletter", subject: "Schema markup made simple", audience: "All subscribers", status: "sent", recipients: 4401, opens: 2134, clicks: 398, bounceRate: 1.5, unsubscribes: 10, sentAt: new Date(Date.now() - 17 * 86400000).toISOString(), createdAt: new Date(Date.now() - 21 * 86400000).toISOString() },
];

const TEMPLATES = [
  { id: "tpl_1", name: "Welcome Email", category: "onboarding", lastUsed: "2 days ago" },
  { id: "tpl_2", name: "Email Verification", category: "auth", lastUsed: "1 hour ago" },
  { id: "tpl_3", name: "Password Reset", category: "auth", lastUsed: "5 hours ago" },
  { id: "tpl_4", name: "Subscription Activated", category: "billing", lastUsed: "3 days ago" },
  { id: "tpl_5", name: "Payment Successful", category: "billing", lastUsed: "1 day ago" },
  { id: "tpl_6", name: "Payment Failed", category: "billing", lastUsed: "2 days ago" },
  { id: "tpl_7", name: "Audit Completed", category: "audit", lastUsed: "1 hour ago" },
  { id: "tpl_8", name: "Trial Ending", category: "billing", lastUsed: "6 hours ago" },
  { id: "tpl_9", name: "Usage Limit Reached", category: "system", lastUsed: "1 day ago" },
  { id: "tpl_10", name: "Weekly Newsletter", category: "marketing", lastUsed: "3 days ago" },
];

export async function GET() {
  const totalSent = CAMPAIGNS.filter((c) => c.status === "sent").length;
  const totalRecipients = CAMPAIGNS.filter((c) => c.status === "sent").reduce((s, c) => s + c.recipients, 0);
  const totalOpens = CAMPAIGNS.filter((c) => c.status === "sent").reduce((s, c) => s + c.opens, 0);
  const totalClicks = CAMPAIGNS.filter((c) => c.status === "sent").reduce((s, c) => s + c.clicks, 0);
  const avgOpenRate = Math.round((totalOpens / totalRecipients) * 1000) / 10;
  const avgCtr = Math.round((totalClicks / totalRecipients) * 1000) / 10;

  return NextResponse.json({
    campaigns: CAMPAIGNS,
    templates: TEMPLATES,
    stats: {
      total: CAMPAIGNS.length,
      sent: totalSent,
      scheduled: CAMPAIGNS.filter((c) => c.status === "scheduled").length,
      drafts: CAMPAIGNS.filter((c) => c.status === "draft").length,
      totalRecipients,
      avgOpenRate,
      avgCtr,
    },
  });
}
