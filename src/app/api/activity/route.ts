// GET /api/activity — mock team activity feed
import { NextResponse } from "next/server";

interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  targetType: string;
  targetName: string;
  description: string;
  timestamp: string;
  category: "audit" | "report" | "keyword" | "backlink" | "team" | "settings" | "integration";
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const USERS = [
  { name: "Sarah Chen", email: "sarah@northwind.agency", avatar: "SC" },
  { name: "Mike Rodriguez", email: "mike@brightlabs.io", avatar: "MR" },
  { name: "Amir Hassan", email: "amir@pixelcraft.co", avatar: "AH" },
  { name: "Lena Petrova", email: "lena@growthflow.com", avatar: "LP" },
  { name: "Demo User", email: "demo@ufuqaudit.app", avatar: "DU" },
];

const ACTIONS: Omit<ActivityItem, "id" | "userId" | "userName" | "userAvatar" | "timestamp">[] = [
  { action: "ran_audit", targetType: "audit", targetName: "stripe.com", description: "ran a full audit on stripe.com — score 92/100", category: "audit" },
  { action: "generated_report", targetType: "report", targetName: "Executive Summary", description: "generated an Executive Summary PDF for vercel.com", category: "report" },
  { action: "added_keyword", targetType: "keyword", targetName: "aeo optimization", description: "added keyword \"aeo optimization\" to tracking", category: "keyword" },
  { action: "found_backlink", targetType: "backlink", targetName: "github.com", description: "discovered a new dofollow backlink from github.com (DA 96)", category: "backlink" },
  { action: "invited_member", targetType: "team", targetName: "Amir Hassan", description: "invited amir@pixelcraft.co as a team member", category: "team" },
  { action: "scheduled_audit", targetType: "schedule", targetName: "shopify.com", description: "scheduled a weekly audit for shopify.com (Mondays at 09:00)", category: "audit" },
  { action: "connected_integration", targetType: "integration", targetName: "Google Search Console", description: "connected Google Search Console integration", category: "integration" },
  { action: "shared_portal", targetType: "portal", targetName: "Acme Corp", description: "shared a branded audit portal link with Acme Corp", category: "report" },
  { action: "fixed_issue", targetType: "issue", targetName: "Missing meta description", description: "marked \"Missing meta description\" as fixed on /about page", category: "audit" },
  { action: "updated_settings", targetType: "settings", targetName: "Notification preferences", description: "updated email notification preferences", category: "settings" },
  { action: "ran_audit", targetType: "audit", targetName: "example.com", description: "ran a full audit on example.com — score 94/100", category: "audit" },
  { action: "lost_backlink", targetType: "backlink", targetName: "framer.com", description: "lost a backlink from framer.com (was DA 71)", category: "backlink" },
  { action: "keyword_improved", targetType: "keyword", targetName: "schema markup generator", description: "keyword \"schema markup generator\" moved from position 8 to position 3", category: "keyword" },
  { action: "created_schedule", targetType: "schedule", targetName: "notion.so", description: "created a monthly audit schedule for notion.so", category: "audit" },
  { action: "generated_report", targetType: "report", targetName: "AEO/GEO Report", description: "generated an AEO/GEO audit report for shopify.com", category: "report" },
];

export async function GET() {
  const now = Date.now();
  const activities: ActivityItem[] = ACTIONS.map((a, i) => {
    const user = USERS[i % USERS.length];
    const minutesAgo = (i + 1) * 37 + (hashStr(a.action) % 30);
    return {
      id: `act_${i + 1}`,
      userId: user.email,
      userName: user.name,
      userAvatar: user.avatar,
      ...a,
      timestamp: new Date(now - minutesAgo * 60000).toISOString(),
    };
  });

  return NextResponse.json({ activities, total: activities.length });
}
