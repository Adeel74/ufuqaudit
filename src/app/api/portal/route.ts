// GET/POST /api/portal — list + create shareable client portal links
import { NextRequest, NextResponse } from "next/server";

interface PortalLink {
  id: string;
  token: string;
  clientName: string;
  clientEmail: string;
  auditUrl: string;
  overallScore: number;
  createdAt: string;
  expiresAt: string | null;
  views: number;
  lastViewedAt: string | null;
  branding: {
    agencyName: string;
    primaryColor: string;
    logoUrl: string | null;
  };
}

function genToken(): string {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
}

const PORTAL_LINKS: PortalLink[] = [
  {
    id: "pl_1",
    token: "abc123xyz789",
    clientName: "Acme Corp",
    clientEmail: "john@acme.com",
    auditUrl: "https://example.com",
    overallScore: 94,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 25 * 86400000).toISOString(),
    views: 7,
    lastViewedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    branding: { agencyName: "Northwind Digital", primaryColor: "#10b981", logoUrl: null },
  },
  {
    id: "pl_2",
    token: "def456uvw012",
    clientName: "Globex Inc",
    clientEmail: "sarah@globex.com",
    auditUrl: "https://stripe.com",
    overallScore: 92,
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    expiresAt: null,
    views: 14,
    lastViewedAt: new Date(Date.now() - 86400000).toISOString(),
    branding: { agencyName: "Northwind Digital", primaryColor: "#10b981", logoUrl: null },
  },
  {
    id: "pl_3",
    token: "ghi789rst345",
    clientName: "Initech",
    clientEmail: "peter@initech.com",
    auditUrl: "https://shopify.com",
    overallScore: 76,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    views: 3,
    lastViewedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    branding: { agencyName: "Northwind Digital", primaryColor: "#10b981", logoUrl: null },
  },
];

export async function GET() {
  return NextResponse.json({ links: PORTAL_LINKS });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { clientName, clientEmail, auditUrl, overallScore, expiresInDays, agencyName, primaryColor } = body;
  if (!clientName || !auditUrl) {
    return NextResponse.json({ error: "clientName and auditUrl required" }, { status: 400 });
  }

  const link: PortalLink = {
    id: `pl_${Date.now()}`,
    token: genToken(),
    clientName,
    clientEmail: clientEmail || "",
    auditUrl,
    overallScore: overallScore || 0,
    createdAt: new Date().toISOString(),
    expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : null,
    views: 0,
    lastViewedAt: null,
    branding: {
      agencyName: agencyName || "UfuqAudit",
      primaryColor: primaryColor || "#10b981",
      logoUrl: null,
    },
  };
  PORTAL_LINKS.unshift(link);
  return NextResponse.json({ link });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const idx = PORTAL_LINKS.findIndex((l) => l.id === id);
  if (idx >= 0) PORTAL_LINKS.splice(idx, 1);
  return NextResponse.json({ ok: true });
}
