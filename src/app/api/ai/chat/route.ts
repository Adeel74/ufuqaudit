// POST /api/ai/chat — conversational AI assistant grounded in the current audit
import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZai() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages, auditId, url } = body as { messages: ChatMessage[]; auditId?: string; url?: string };
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    // Build audit context if we have an auditId or url
    let auditContext = "";
    if (auditId) {
      const audit = await db.audit.findUnique({
        where: { id: auditId },
        include: { issues: { take: 20, orderBy: { severity: "asc" } } },
      });
      if (audit) {
        auditContext = `CURRENT AUDIT CONTEXT:
URL: ${audit.url}
Ufuq Score: ${audit.overallScore}/100
Technical: ${audit.technicalScore} | Content: ${audit.contentScore} | Performance: ${audit.performanceScore} | AEO: ${audit.aeoScore} | GEO: ${audit.geoScore} | Security: ${audit.securityScore}
Pages crawled: ${audit.pagesCrawled}
Issues: ${audit.issuesCount} total (${audit.criticalCount} critical, ${audit.errorCount} errors, ${audit.warningCount} warnings, ${audit.opportunityCount} opportunities)
${audit.summary ? `Summary: ${audit.summary}` : ""}
Top issues:
${audit.issues.map((i) => `- [${i.severity}] ${i.title}${i.recommendation ? ` → ${i.recommendation}` : ""}`).join("\n")}
`;
      }
    }

    const systemPrompt = `You are UfuqAudit's AI assistant — an expert in SEO, AEO (Answer Engine Optimization), GEO (AI visibility), Core Web Vitals, structured data, and website security. You help users understand their audit results and fix issues.

${auditContext ? auditContext + "\n" : ""}When the user asks about their audit, reference the specific scores and issues above. When they ask general SEO/AEO/GEO questions, give actionable, concrete advice. Keep answers under 200 words unless the user explicitly asks for detail. Use bullet points for step-by-step fixes. Never invent scores or issues not in the context.`;

    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      thinking: { type: "disabled" },
    });

    const content = completion.choices?.[0]?.message?.content?.trim() || "";
    if (!content) throw new Error("Empty AI response");

    return NextResponse.json({
      reply: content,
      model: "z-ai-llm",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "AI chat failed", reply: "I'm having trouble responding right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
