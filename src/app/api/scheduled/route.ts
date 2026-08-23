// GET/POST /api/scheduled — list + create scheduled audit jobs
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface ScheduledJob {
  id: string;
  url: string;
  frequency: "weekly" | "biweekly" | "monthly";
  dayOfWeek: number; // 0-6
  timeOfDay: string; // "09:00"
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string;
  lastScore: number | null;
  notifyEmail: string;
  createdAt: string;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function computeNextRun(frequency: string, dayOfWeek: number, timeOfDay: string): Date {
  const now = new Date();
  const [hh, mm] = timeOfDay.split(":").map(Number);
  const next = new Date(now);
  next.setHours(hh, mm, 0, 0);

  if (frequency === "weekly") {
    const diff = (dayOfWeek - now.getDay() + 7) % 7;
    next.setDate(now.getDate() + diff);
    if (diff === 0 && next <= now) next.setDate(next.getDate() + 7);
  } else if (frequency === "biweekly") {
    const diff = (dayOfWeek - now.getDay() + 7) % 7;
    next.setDate(now.getDate() + diff + (diff === 0 && next <= now ? 14 : 7));
  } else {
    // monthly: same day-of-week in ~30 days
    next.setDate(now.getDate() + 30);
  }
  return next;
}

// In-memory store (would be DB in production)
const SCHEDULED: ScheduledJob[] = [
  {
    id: "sch_1",
    url: "https://example.com",
    frequency: "weekly",
    dayOfWeek: 1,
    timeOfDay: "09:00",
    enabled: true,
    lastRunAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    nextRunAt: computeNextRun("weekly", 1, "09:00").toISOString(),
    lastScore: 94,
    notifyEmail: "demo@ufuqaudit.app",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "sch_2",
    url: "https://stripe.com",
    frequency: "monthly",
    dayOfWeek: 3,
    timeOfDay: "14:00",
    enabled: true,
    lastRunAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    nextRunAt: computeNextRun("monthly", 3, "14:00").toISOString(),
    lastScore: 92,
    notifyEmail: "demo@ufuqaudit.app",
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: "sch_3",
    url: "https://shopify.com",
    frequency: "biweekly",
    dayOfWeek: 5,
    timeOfDay: "10:30",
    enabled: false,
    lastRunAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    nextRunAt: computeNextRun("biweekly", 5, "10:30").toISOString(),
    lastScore: 76,
    notifyEmail: "demo@ufuqaudit.app",
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({ schedules: SCHEDULED });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { url, frequency, dayOfWeek, timeOfDay, notifyEmail } = body;
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const job: ScheduledJob = {
    id: `sch_${hashStr(url + Date.now())}`,
    url,
    frequency: frequency || "weekly",
    dayOfWeek: dayOfWeek ?? 1,
    timeOfDay: timeOfDay || "09:00",
    enabled: true,
    lastRunAt: null,
    nextRunAt: computeNextRun(frequency || "weekly", dayOfWeek ?? 1, timeOfDay || "09:00").toISOString(),
    lastScore: null,
    notifyEmail: notifyEmail || "demo@ufuqaudit.app",
    createdAt: new Date().toISOString(),
  };
  SCHEDULED.unshift(job);
  return NextResponse.json({ schedule: job });
}
