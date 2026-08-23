// GET /api/admin/organizations — list all organizations/workspaces
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const ORG_DATA = [
  { name: "Northwind Digital", domain: "northwind.agency", industry: "Digital Marketing", country: "United States", members: 8, plan: "agency", status: "active" },
  { name: "Bright Labs", domain: "brightlabs.io", industry: "Web Development", country: "United Kingdom", members: 5, plan: "pro", status: "active" },
  { name: "PixelCraft Co", domain: "pixelcraft.co", industry: "Design Agency", country: "Pakistan", members: 12, plan: "agency", status: "active" },
  { name: "GrowthFlow", domain: "growthflow.com", industry: "SaaS", country: "Germany", members: 3, plan: "starter", status: "active" },
  { name: "Acme Corp", domain: "acme.com", industry: "E-commerce", country: "United States", members: 6, plan: "pro", status: "suspended" },
  { name: "Globex Inc", domain: "globex.com", industry: "Technology", country: "Canada", members: 2, plan: "free", status: "active" },
  { name: "Initech", domain: "initech.com", industry: "Software", country: "United States", members: 4, plan: "starter", status: "active" },
  { name: "Umbrella LLC", domain: "umbrella.com", industry: "Consulting", country: "Australia", members: 1, plan: "free", status: "active" },
];

export async function GET() {
  const now = Date.now();
  const orgs = ORG_DATA.map((o, i) => {
    const seed = hashStr(o.name);
    const projects = 1 + (seed % 20);
    const websites = 1 + (seed % 15);
    const audits = 5 + (seed % 120);
    const apiRequests = 100 + (seed % 8000);
    const aiTokens = 1000 + (seed % 50000);
    const createdAt = new Date(now - (30 + (seed % 300)) * 86400000).toISOString();
    const lastActive = new Date(now - (seed % 7) * 86400000).toISOString();
    return {
      id: `org_${i + 1}`,
      ...o,
      projects,
      websites,
      audits,
      apiRequests,
      aiTokens,
      createdAt,
      lastActive,
    };
  });

  return NextResponse.json({
    orgs,
    stats: {
      total: orgs.length,
      active: orgs.filter((o) => o.status === "active").length,
      suspended: orgs.filter((o) => o.status === "suspended").length,
      totalMembers: orgs.reduce((s, o) => s + o.members, 0),
      totalProjects: orgs.reduce((s, o) => s + o.projects, 0),
      totalWebsites: orgs.reduce((s, o) => s + o.websites, 0),
      totalAudits: orgs.reduce((s, o) => s + o.audits, 0),
    },
  });
}
