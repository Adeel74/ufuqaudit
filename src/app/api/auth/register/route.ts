// POST /api/auth/register — create a new user account
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || email.split("@")[0],
        passwordHash: hashPassword(password),
        role: "user",
        plan: "free",
        status: "active",
      },
    });

    const token = await createSession(user.id, req);

    // Log registration
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "user.registered",
        entity: "user",
        entityId: user.id,
        details: `New user registered: ${user.email}`,
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      },
    }).catch(() => {});

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
      },
      token,
    });

    // Set cookie
    response.cookies.set("ufuq_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Registration failed" }, { status: 500 });
  }
}
