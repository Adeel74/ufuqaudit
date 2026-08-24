// POST /api/auth/logout — destroy session
import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookie = req.headers.get("cookie") || "";
    const token = authHeader?.replace("Bearer ", "") || cookie.match(/ufuq_session=([^;]+)/)?.[1];

    if (token) {
      await deleteSession(token);
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.delete("ufuq_session");
    return response;
  } catch {
    return NextResponse.json({ ok: true });
  }
}
