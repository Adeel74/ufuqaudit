// POST /api/email/send — mock email send endpoint
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { to, subject, message, auditId, includeReport } = body;

    if (!to || !subject) {
      return NextResponse.json({ error: "to and subject are required" }, { status: 400 });
    }

    // Simulate email send delay
    await new Promise((r) => setTimeout(r, 800));

    return NextResponse.json({
      ok: true,
      sent: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      to,
      subject,
      timestamp: new Date().toISOString(),
      includeReport: !!includeReport,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Send failed" }, { status: 500 });
  }
}
