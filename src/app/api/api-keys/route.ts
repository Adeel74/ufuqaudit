// GET/POST /api/api-keys — list + create API keys
import { NextRequest, NextResponse } from "next/server";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string | null;
  requests: number;
  status: "active" | "revoked";
}

function genKey(): string {
  const prefix = "ufa_live_";
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return prefix + Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const KEYS: ApiKey[] = [
  {
    id: "key_1",
    name: "Production API",
    key: "ufa_live_••••••••••••••••••••••••••••••2a8f",
    created: new Date(Date.now() - 45 * 86400000).toISOString(),
    lastUsed: new Date(Date.now() - 2 * 3600000).toISOString(),
    requests: 15482,
    status: "active",
  },
  {
    id: "key_2",
    name: "Development",
    key: "ufa_live_••••••••••••••••••••••••••••••7b3c",
    created: new Date(Date.now() - 12 * 86400000).toISOString(),
    lastUsed: new Date(Date.now() - 86400000).toISOString(),
    requests: 342,
    status: "active",
  },
  {
    id: "key_3",
    name: "Webhook Integration",
    key: "ufa_live_••••••••••••••••••••••••••••••9d1e",
    created: new Date(Date.now() - 90 * 86400000).toISOString(),
    lastUsed: null,
    requests: 0,
    status: "revoked",
  },
];

export async function GET() {
  return NextResponse.json({ keys: KEYS });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = (body?.name || "").toString().trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const fullKey = genKey();
  const newKey: ApiKey = {
    id: `key_${Date.now()}`,
    name,
    key: fullKey, // Return full key only once
    created: new Date().toISOString(),
    lastUsed: null,
    requests: 0,
    status: "active",
  };
  KEYS.unshift(newKey);
  return NextResponse.json({ key: newKey, fullKey });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const idx = KEYS.findIndex((k) => k.id === id);
  if (idx >= 0) KEYS[idx].status = "revoked";
  return NextResponse.json({ ok: true });
}
