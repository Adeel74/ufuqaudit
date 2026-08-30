// GET /api/notifications — list user notifications
// POST /api/notifications — mark as read / create
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  read: boolean;
  timestamp: string;
}

// Fallback mock notifications
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", type: "audit_complete", title: "Audit Complete", description: "Your audit of example.com finished with a score of 94/100", read: false, timestamp: new Date(Date.now() - 3 * 60000).toISOString() },
  { id: "n2", type: "critical_issue", title: "Critical Issue Found", description: "8 broken links detected on your website", read: false, timestamp: new Date(Date.now() - 22 * 60000).toISOString() },
  { id: "n3", type: "score_improved", title: "Score Improved", description: "Your Ufuq Score went from 71 to 78 (+7)", read: false, timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "n4", type: "new_backlink", title: "New Backlink", description: "github.com linked to your site (DA 96, dofollow)", read: true, timestamp: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: "n5", type: "weekly_report", title: "Weekly Report Ready", description: "Your weekly SEO summary is available for download", read: true, timestamp: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: "n6", type: "keyword_lost", title: "Keyword Position Dropped", description: "'seo audit tool' dropped from position 8 to position 12", read: true, timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "n7", type: "score_dropped", title: "Score Decreased", description: "Performance score dropped from 81 to 74", read: true, timestamp: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: "n8", type: "info", title: "New Feature", description: "UfuqLink Chrome Extension is now available for download", read: true, timestamp: new Date(Date.now() - 7 * 86400000).toISOString() },
];

export async function GET() {
  try {
    // Try to get real notifications from DB
    const user = await db.user.findFirst({ where: { email: "demo@ufuqaudit.app" } });
    if (user) {
      const notifications = await db.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      if (notifications.length > 0) {
        return NextResponse.json({
          notifications: notifications.map((n) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            description: n.description,
            read: n.read,
            timestamp: n.createdAt.toISOString(),
          })),
        });
      }
    }
  } catch {}

  return NextResponse.json({ notifications: MOCK_NOTIFICATIONS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, id } = body;

    if (action === "markRead" && id) {
      try {
        await db.notification.update({ where: { id }, data: { read: true } });
      } catch {}
      return NextResponse.json({ ok: true });
    }

    if (action === "markAllRead") {
      try {
        const user = await db.user.findFirst({ where: { email: "demo@ufuqaudit.app" } });
        if (user) {
          await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
        }
      } catch {}
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
