import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const user = await db.user.findFirst({ where: { email: "demo@ufuqaudit.app" } });
  if (!user) return NextResponse.json({ projects: [] });
  const projects = await db.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { audits: true } } },
  });
  return NextResponse.json({ projects });
}
