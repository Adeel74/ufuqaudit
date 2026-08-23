import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const integrations = await db.integration.findMany();
  return NextResponse.json({ integrations });
}

export async function POST(req: Request) {
  const { provider, status, userId } = await req.json().catch(() => ({}));
  if (!provider) return NextResponse.json({ error: "provider required" }, { status: 400 });
  const integration = await db.integration.create({ data: { provider, status: status || "connected", userId: userId || "system" } });
  return NextResponse.json({ integration });
}
