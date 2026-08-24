// GET/POST /api/admin/tickets — support ticket management
import { NextRequest, NextResponse } from "next/server";

interface Ticket {
  id: string;
  subject: string;
  user: string;
  email: string;
  org: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "pending" | "in_progress" | "resolved" | "closed";
  category: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  messages: { from: "user" | "agent"; text: string; timestamp: string }[];
}

const TICKETS: Ticket[] = [
  {
    id: "tk_1", subject: "Audit not completing for large site", user: "Sarah Chen", email: "sarah@northwind.agency", org: "Northwind Digital",
    priority: "high", status: "in_progress", category: "Bug", assignedTo: "Support Team",
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    messages: [
      { from: "user", text: "My audit for stripe.com has been running for 10 minutes. Is this normal?", timestamp: new Date(Date.now() - 3 * 3600000).toISOString() },
      { from: "agent", text: "Hi Sarah! For sites with 1000+ URLs, the crawl can take up to 2-3 minutes. Can you share the audit ID?", timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
      { from: "user", text: "The ID is audit_abc123. It just completed — score 92/100!", timestamp: new Date(Date.now() - 1 * 3600000).toISOString() },
    ],
  },
  {
    id: "tk_2", subject: "How do I export a white-label report?", user: "Amir Hassan", email: "amir@pixelcraft.co", org: "PixelCraft Co",
    priority: "medium", status: "open", category: "How-to", assignedTo: null,
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    messages: [
      { from: "user", text: "I want to send a branded audit report to my client. How do I set up white-label?", timestamp: new Date(Date.now() - 6 * 3600000).toISOString() },
    ],
  },
  {
    id: "tk_3", subject: "GSC integration not connecting", user: "Mike Rodriguez", email: "mike@brightlabs.io", org: "Bright Labs",
    priority: "urgent", status: "open", category: "Integration", assignedTo: null,
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    messages: [
      { from: "user", text: "I keep getting an OAuth error when trying to connect Google Search Console. Error code: GSC_AUTH_403.", timestamp: new Date(Date.now() - 1 * 3600000).toISOString() },
    ],
  },
  {
    id: "tk_4", subject: "Upgrade from Pro to Agency", user: "Lena Petrova", email: "lena@growthflow.com", org: "GrowthFlow",
    priority: "low", status: "resolved", category: "Billing", assignedTo: "Billing Team",
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    messages: [
      { from: "user", text: "I want to upgrade from Pro to Agency plan. Will my billing be prorated?", timestamp: new Date(Date.now() - 48 * 3600000).toISOString() },
      { from: "agent", text: "Yes! You'll be charged the prorated difference immediately and your next billing date stays the same. I've upgraded your account to Agency.", timestamp: new Date(Date.now() - 47 * 3600000).toISOString() },
      { from: "user", text: "Perfect, thank you! I can see the Agency features now.", timestamp: new Date(Date.now() - 24 * 3600000).toISOString() },
    ],
  },
  {
    id: "tk_5", subject: "Feature request: WordPress plugin", user: "John Smith", email: "john@acme.com", org: "Acme Corp",
    priority: "low", status: "pending", category: "Feature Request", assignedTo: "Product Team",
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    messages: [
      { from: "user", text: "It would be great to have a WordPress plugin that auto-audits posts before publishing.", timestamp: new Date(Date.now() - 72 * 3600000).toISOString() },
      { from: "agent", text: "Great idea! We've added this to our roadmap for Q3. I'll update you when there's progress.", timestamp: new Date(Date.now() - 48 * 3600000).toISOString() },
    ],
  },
  {
    id: "tk_6", subject: "API rate limit exceeded", user: "Emma Wilson", email: "emma@globex.com", org: "Globex Inc",
    priority: "medium", status: "closed", category: "API", assignedTo: "Dev Team",
    createdAt: new Date(Date.now() - 120 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 96 * 3600000).toISOString(),
    messages: [
      { from: "user", text: "I'm getting 429 errors on my API calls. I'm on the Pro plan.", timestamp: new Date(Date.now() - 120 * 3600000).toISOString() },
      { from: "agent", text: "Your rate limit is 1000 requests/hour on Pro. You were at 1050. I've added a 10% buffer to your account. Consider upgrading to Agency for 50000/hour.", timestamp: new Date(Date.now() - 118 * 3600000).toISOString() },
      { from: "user", text: "Thanks for the buffer! I'll optimize my calls.", timestamp: new Date(Date.now() - 96 * 3600000).toISOString() },
    ],
  },
];

export async function GET() {
  return NextResponse.json({
    tickets: TICKETS,
    stats: {
      total: TICKETS.length,
      open: TICKETS.filter((t) => t.status === "open").length,
      inProgress: TICKETS.filter((t) => t.status === "in_progress").length,
      pending: TICKETS.filter((t) => t.status === "pending").length,
      resolved: TICKETS.filter((t) => t.status === "resolved").length,
      closed: TICKETS.filter((t) => t.status === "closed").length,
      urgent: TICKETS.filter((t) => t.priority === "urgent").length,
      avgResponseTime: "2.4h",
    },
  });
}
