// POST /api/auth/demo-admin — create or return the demo admin user
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    let admin = await db.user.findFirst({ where: { email: "admin@ufuqaudit.app" } });
    if (!admin) {
      admin = await db.user.create({
        data: { email: "admin@ufuqaudit.app", name: "Super Admin", role: "admin", plan: "agency" },
      });
    } else if (admin.role !== "admin" || admin.plan !== "agency") {
      admin = await db.user.update({
        where: { id: admin.id },
        data: { role: "admin", plan: "agency", name: "Super Admin" },
      });
    }

    let demoUser = await db.user.findFirst({ where: { email: "demo@ufuqaudit.app" } });
    if (!demoUser) {
      demoUser = await db.user.create({
        data: { email: "demo@ufuqaudit.app", name: "Demo User", role: "admin", plan: "pro" },
      });
    }

    return NextResponse.json({
      ok: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        plan: admin.plan,
      },
      credentials: {
        email: "admin@ufuqaudit.app",
        note: "Demo admin account — no password required. Click 'Sign in as Admin' on the landing page.",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}

export async function GET() {
  const admin = await db.user.findFirst({ where: { email: "admin@ufuqaudit.app" } });
  if (!admin) return NextResponse.json({ exists: false });
  return NextResponse.json({
    exists: true,
    admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role, plan: admin.plan },
  });
}
