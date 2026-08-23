import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, name, role, plan } = body;
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  const user = await db.user.create({ data: { email, name: name || null, role: role || "user", plan: plan || "free" } });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { id, role, plan } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const user = await db.user.update({ where: { id }, data: { role, plan } });
  return NextResponse.json({ user });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
