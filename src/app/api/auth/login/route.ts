import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  let user = await db.user.findFirst({ where: { email } });
  if (!user) user = await db.user.create({ data: { email, name: email.split("@")[0], role: "admin", plan: "pro" } });
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan } });
}
