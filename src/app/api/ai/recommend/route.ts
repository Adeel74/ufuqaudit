import { NextRequest, NextResponse } from "next/server";
import { generateFix, type AiFixInput } from "@/lib/ai";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { issueType, issueTitle, pageUrl, pageTitle, brandName } = body as AiFixInput;
    if (!issueType) return NextResponse.json({ error: "issueType required" }, { status: 400 });

    const input: AiFixInput = { issueType, issueTitle: issueTitle || "", pageUrl, pageTitle, brandName };
    const result = await generateFix(input);

    try {
      const user = await db.user.findFirst({ where: { email: "demo@ufuqaudit.app" } });
      if (user) {
        const audit = await db.audit.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
        if (audit) {
          await db.recommendation.create({
            data: {
              auditId: audit.id,
              issueType,
              pageUrl: pageUrl ?? null,
              context: JSON.stringify(input).slice(0, 500),
              suggestion: result.suggestion.slice(0, 1000),
              model: result.model,
            },
          });
        }
      }
    } catch {}

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "AI failed" }, { status: 500 });
  }
}
