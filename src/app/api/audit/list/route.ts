import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const user = await db.user.findFirst({ where: { email: "demo@ufuqaudit.app" } });
  if (!user) return NextResponse.json({ audits: [] });
  const audits = await db.audit.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ audits });
}
