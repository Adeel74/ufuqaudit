// GET/POST /api/admin/webhooks — webhook management + logs
import { NextRequest, NextResponse } from "next/server";

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  status: "active" | "disabled";
  createdAt: string;
  lastTriggered: string | null;
  totalDelivered: number;
  totalFailed: number;
}

interface WebhookLog {
  id: string;
  webhookId: string;
  webhookName: string;
  event: string;
  endpoint: string;
  status: number;
  responseTime: number;
  retryCount: number;
  timestamp: string;
}

const WEBHOOKS: Webhook[] = [
  { id: "wh_1", name: "Slack — Audit Complete", url: "https://hooks.slack.com/services/T0/B0/xxx", events: ["audit.completed", "audit.failed"], secret: "whsec_••••2a8f", status: "active", createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), lastTriggered: new Date(Date.now() - 3600000).toISOString(), totalDelivered: 1432, totalFailed: 8 },
  { id: "wh_2", name: "Zapier — New User", url: "https://hooks.zapier.com/hooks/catch/123456/abc789", events: ["user.created"], secret: "whsec_••••9b3c", status: "active", createdAt: new Date(Date.now() - 60 * 86400000).toISOString(), lastTriggered: new Date(Date.now() - 7200000).toISOString(), totalDelivered: 892, totalFailed: 3 },
  { id: "wh_3", name: "Custom — Payment Webhook", url: "https://api.myapp.com/webhooks/ufuqaudit", events: ["payment.received", "payment.failed", "subscription.cancelled"], secret: "whsec_••••7d1e", status: "active", createdAt: new Date(Date.now() - 90 * 86400000).toISOString(), lastTriggered: new Date(Date.now() - 1800000).toISOString(), totalDelivered: 2341, totalFailed: 12 },
  { id: "wh_4", name: "Discord — Critical Issues", url: "https://discord.com/api/webhooks/123/abc", events: ["audit.issue.critical"], secret: "whsec_••••5f2a", status: "disabled", createdAt: new Date(Date.now() - 45 * 86400000).toISOString(), lastTriggered: new Date(Date.now() - 86400000).toISOString(), totalDelivered: 234, totalFailed: 45 },
];

const LOGS: WebhookLog[] = [
  { id: "log_1", webhookId: "wh_1", webhookName: "Slack — Audit Complete", event: "audit.completed", endpoint: "hooks.slack.com", status: 200, responseTime: 234, retryCount: 0, timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: "log_2", webhookId: "wh_3", webhookName: "Custom — Payment Webhook", event: "payment.received", endpoint: "api.myapp.com", status: 200, responseTime: 89, retryCount: 0, timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: "log_3", webhookId: "wh_2", webhookName: "Zapier — New User", event: "user.created", endpoint: "hooks.zapier.com", status: 200, responseTime: 412, retryCount: 0, timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: "log_4", webhookId: "wh_3", webhookName: "Custom — Payment Webhook", event: "payment.failed", endpoint: "api.myapp.com", status: 500, responseTime: 5000, retryCount: 3, timestamp: new Date(Date.now() - 10800000).toISOString() },
  { id: "log_5", webhookId: "wh_1", webhookName: "Slack — Audit Complete", event: "audit.failed", endpoint: "hooks.slack.com", status: 200, responseTime: 198, retryCount: 0, timestamp: new Date(Date.now() - 14400000).toISOString() },
  { id: "log_6", webhookId: "wh_4", webhookName: "Discord — Critical Issues", event: "audit.issue.critical", endpoint: "discord.com", status: 401, responseTime: 120, retryCount: 2, timestamp: new Date(Date.now() - 86400000).toISOString() },
];

const AVAILABLE_EVENTS = [
  "user.created", "user.deleted", "user.suspended",
  "subscription.created", "subscription.cancelled", "subscription.upgraded",
  "payment.received", "payment.failed", "payment.refunded",
  "audit.started", "audit.completed", "audit.failed",
  "audit.issue.critical", "audit.issue.detected",
  "api.key.generated", "api.key.revoked", "api.limit.exceeded",
  "integration.connected", "integration.disconnected",
];

export async function GET() {
  return NextResponse.json({
    webhooks: WEBHOOKS,
    logs: LOGS,
    availableEvents: AVAILABLE_EVENTS,
    stats: {
      total: WEBHOOKS.length,
      active: WEBHOOKS.filter((w) => w.status === "active").length,
      disabled: WEBHOOKS.filter((w) => w.status === "disabled").length,
      totalDelivered: WEBHOOKS.reduce((s, w) => s + w.totalDelivered, 0),
      totalFailed: WEBHOOKS.reduce((s, w) => s + w.totalFailed, 0),
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, url, events, secret } = body;
  if (!name || !url) return NextResponse.json({ error: "name and url required" }, { status: 400 });

  const wh: Webhook = {
    id: `wh_${Date.now()}`,
    name, url, events: events || [], secret: secret || `whsec_${Math.random().toString(36).slice(2, 10)}`,
    status: "active", createdAt: new Date().toISOString(), lastTriggered: null, totalDelivered: 0, totalFailed: 0,
  };
  WEBHOOKS.unshift(wh);
  return NextResponse.json({ webhook: wh });
}
