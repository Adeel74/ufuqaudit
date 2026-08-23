// GET/POST /api/admin/announcements — platform announcement management
import { NextRequest, NextResponse } from "next/server";

interface Announcement {
  id: string;
  title: string;
  description: string;
  type: "info" | "success" | "warning" | "maintenance";
  audience: "all" | "free" | "starter" | "pro" | "agency" | "trial";
  channels: { dashboard: boolean; email: boolean; popup: boolean };
  status: "active" | "scheduled" | "ended";
  startDate: string;
  endDate: string;
  ctaLabel: string;
  ctaHref: string;
  createdAt: string;
  views: number;
  clicks: number;
}

const ANNOUNCEMENTS: Announcement[] = [
  { id: "ann_1", title: "AEO scoring is now live!", description: "We've added Answer Engine Optimization scoring to all audits. See how ready your content is for ChatGPT, Claude & Perplexity.", type: "success", audience: "all", channels: { dashboard: true, email: true, popup: false }, status: "active", startDate: new Date(Date.now() - 2 * 86400000).toISOString(), endDate: new Date(Date.now() + 12 * 86400000).toISOString(), ctaLabel: "Try AEO audit", ctaHref: "/dashboard", createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), views: 4521, clicks: 892 },
  { id: "ann_2", title: "Scheduled maintenance — Sunday 2-4 AM UTC", description: "Brief downtime for database optimization. Audits may be delayed during this window.", type: "maintenance", audience: "all", channels: { dashboard: true, email: false, popup: false }, status: "scheduled", startDate: new Date(Date.now() + 2 * 86400000).toISOString(), endDate: new Date(Date.now() + 2.25 * 86400000).toISOString(), ctaLabel: "Learn more", ctaHref: "#", createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), views: 0, clicks: 0 },
  { id: "ann_3", title: "Pro plan now includes GSC integration", description: "Connect Google Search Console to see real search data alongside your audit scores.", type: "info", audience: "pro", channels: { dashboard: true, email: true, popup: true }, status: "active", startDate: new Date(Date.now() - 7 * 86400000).toISOString(), endDate: new Date(Date.now() + 7 * 86400000).toISOString(), ctaLabel: "Connect GSC", ctaHref: "/integrations", createdAt: new Date(Date.now() - 8 * 86400000).toISOString(), views: 2103, clicks: 543 },
  { id: "ann_4", title: "Trial ending soon? Get 20% off", description: "Upgrade before your trial ends and get 20% off your first 3 months with code TRIAL20.", type: "warning", audience: "trial", channels: { dashboard: true, email: true, popup: false }, status: "active", startDate: new Date(Date.now() - 5 * 86400000).toISOString(), endDate: new Date(Date.now() + 5 * 86400000).toISOString(), ctaLabel: "Upgrade now", ctaHref: "/billing", createdAt: new Date(Date.now() - 6 * 86400000).toISOString(), views: 1876, clicks: 421 },
  { id: "ann_5", title: "New: AI Blog Generator (Beta)", description: "Generate SEO-optimized blog posts with AI. Available on Agency plans.", type: "info", audience: "agency", channels: { dashboard: true, email: false, popup: false }, status: "ended", startDate: new Date(Date.now() - 30 * 86400000).toISOString(), endDate: new Date(Date.now() - 10 * 86400000).toISOString(), ctaLabel: "Try it", ctaHref: "/blog", createdAt: new Date(Date.now() - 35 * 86400000).toISOString(), views: 3210, clicks: 678 },
];

export async function GET() {
  return NextResponse.json({
    announcements: ANNOUNCEMENTS,
    stats: {
      total: ANNOUNCEMENTS.length,
      active: ANNOUNCEMENTS.filter((a) => a.status === "active").length,
      scheduled: ANNOUNCEMENTS.filter((a) => a.status === "scheduled").length,
      ended: ANNOUNCEMENTS.filter((a) => a.status === "ended").length,
      totalViews: ANNOUNCEMENTS.reduce((s, a) => s + a.views, 0),
      totalClicks: ANNOUNCEMENTS.reduce((s, a) => s + a.clicks, 0),
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { title, description, type, audience, channels, startDate, endDate, ctaLabel, ctaHref } = body;
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const ann: Announcement = {
    id: `ann_${Date.now()}`,
    title, description: description || "", type: type || "info", audience: audience || "all",
    channels: channels || { dashboard: true, email: false, popup: false },
    status: "scheduled", startDate: startDate || new Date().toISOString(),
    endDate: endDate || new Date(Date.now() + 7 * 86400000).toISOString(),
    ctaLabel: ctaLabel || "Learn more", ctaHref: ctaHref || "#",
    createdAt: new Date().toISOString(), views: 0, clicks: 0,
  };
  ANNOUNCEMENTS.unshift(ann);
  return NextResponse.json({ announcement: ann });
}
