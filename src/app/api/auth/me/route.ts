// GET /api/auth/me — get current authenticated user
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        status: user.status,
        avatar: user.avatar,
        bio: user.bio,
        timezone: user.timezone,
        lastLoginAt: user.lastLoginAt,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
