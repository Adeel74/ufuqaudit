// UfuqAudit AI service — wraps z-ai-web-dev-sdk LLM for fix recommendations.
// Backend only.

import ZAI from "z-ai-web-dev-sdk";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZai() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

export interface AiFixInput {
  issueType: string;
  issueTitle: string;
  pageUrl?: string;
  pageTitle?: string;
  brandName?: string;
}

export interface AiFixResult {
  suggestion: string;
  rationale?: string;
  model: string;
}

// Issue-type specific prompt builders
function buildPrompt(input: AiFixInput): { system: string; user: string } {
  const { issueType, issueTitle, pageUrl, pageTitle, brandName } = input;
  const brand = brandName || "the brand";
  const ctx = [
    pageUrl ? `Page URL: ${pageUrl}` : "",
    pageTitle ? `Page topic/title: ${pageTitle}` : "",
    `Brand name: ${brand}`,
  ].filter(Boolean).join("\n");

  const system = `You are UfuqAudit's AI SEO/AEO/GEO fix engine. You produce concise, copy-ready fixes for website audit issues. Never ask questions — return a direct, ready-to-paste recommendation. Keep it under 220 characters when it is meta/title/snippet content. For prose, keep it under 80 words. No preamble.`;

  let user = "";
  switch (issueType) {
    case "missing_meta_description":
      user = `Write a unique, compelling 140–160 character meta description for this page. Include a benefit and a soft CTA. ${ctx}`;
      break;
    case "missing_title":
      user = `Write a 50–60 character <title> for this page. Front-load the primary topic and end with the brand name. ${ctx}`;
      break;
    case "title_too_long":
      user = `Rewrite this title to fit 50–60 characters while keeping the topic and brand. ${ctx}\nCurrent title: ${issueTitle}`;
      break;
    case "missing_h1":
      user = `Suggest a single, descriptive H1 (under 60 chars) for this page that contains the primary topic. ${ctx}`;
      break;
    case "schema_missing":
      user = `Produce ready-to-paste JSON-LD for Organization + WebSite schema for ${brand}. Use https://schema.org, fill placeholders with ${brand} and ${pageUrl || "https://example.com"}. Return only the JSON-LD block.`;
      break;
    case "faq_schema_missing":
    case "no_faq_format":
      user = `Write 4 FAQ Q&A pairs in FAQPage JSON-LD format for this page. Each answer ≤ 55 words, directly answers the question. ${ctx}`;
      break;
    case "ai_crawler_blocked":
      user = `Provide the exact robots.txt snippet to allow GPTBot, ClaudeBot, PerplexityBot, Google-Extended and CCBot. Plain text only.`;
      break;
    case "no_https":
      user = `Give a 3-step migration checklist to move a site from HTTP to HTTPS with a 301 redirect and HSTS header. Plain bullets, ≤ 80 words total.`;
      break;
    case "page_noindex":
      user = `Explain in one line where the noindex tag likely lives and the exact HTML/meta to remove. Plain text.`;
      break;
    case "missing_viewport":
      user = `Return the exact <meta> viewport tag HTML to add to the <head>. Plain text only.`;
      break;
    case "image_alt_missing":
      user = `Give a 1-line rule for writing good alt text + one example. ≤ 60 words.`;
      break;
    case "slow_lcp":
      user = `Produce a prioritized 5-bullet checklist to improve LCP under 2.5s. ≤ 100 words total.`;
      break;
    case "large_page_weight":
      user = `List 5 concrete ways to reduce page weight (KB). ≤ 100 words.`;
      break;
    case "weak_entity_signals":
      user = `Recommend 4 concrete actions to strengthen entity/brand signals for AI answer engines (About page, Organization schema, NAP, knowledge panel). ≤ 120 words.`;
      break;
    case "missing_author_credentials":
      user = `Suggest an author bio template (≤ 60 words) with placeholders for credentials, publications, and original research.`;
      break;
    case "weak_citation_readiness":
      user = `Give 4 structural changes to make content more citation-worthy for AI engines. ≤ 100 words.`;
      break;
    default:
      user = `For the audit issue "${issueTitle}", give a single concrete, copy-ready fix. ${ctx}`;
  }

  return { system, user };
}

function fallbackFor(input: AiFixInput): string {
  switch (input.issueType) {
    case "missing_meta_description":
      return `Discover ${input.brandName || "expert"} ${input.pageTitle ? input.pageTitle.toLowerCase() : "solutions"} — practical, results-driven services that help your business grow. Get a free audit today.`;
    case "missing_title":
      return `${input.pageTitle || "Services"} | ${input.brandName || "UfuqTechs"}`;
    case "missing_h1":
      return `${input.pageTitle || "Professional Services"} That Drive Real Growth`;
    case "missing_viewport":
      return `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`;
    default:
      return "See the recommendation in the issue details.";
  }
}

export async function generateFix(input: AiFixInput): Promise<AiFixResult> {
  const { system, user } = buildPrompt(input);
  try {
    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: system },
        { role: "user", content: user },
      ],
      thinking: { type: "disabled" },
    });
    const content = completion.choices?.[0]?.message?.content?.trim() || "";
    if (!content) throw new Error("Empty AI response");
    return { suggestion: content, model: "z-ai-llm" };
  } catch (err) {
    return {
      suggestion: fallbackFor(input),
      rationale: "Generated locally as a fallback (AI service unavailable).",
      model: "fallback",
    };
  }
}

export async function generateAuditSummary(scores: {
  overall: number;
  technical: number;
  content: number;
  performance: number;
  aeo: number;
  geo: number;
  security: number;
}, url: string, counts: { critical: number; error: number; warning: number; opportunity: number }): Promise<string> {
  try {
    const zai = await getZai();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content:
            "You are UfuqAudit's reporting engine. Write a 2-sentence executive summary of an SEO/AEO/GEO audit. First sentence: overall health and biggest strength. Second sentence: the highest-impact opportunity. No fluff, no preamble, ≤ 60 words.",
        },
        {
          role: "user",
          content: `URL: ${url}\nOverall score: ${scores.overall}/100\nTechnical: ${scores.technical} | Content: ${scores.content} | Performance: ${scores.performance} | AEO: ${scores.aeo} | GEO: ${scores.geo} | Security: ${scores.security}\nIssues: ${counts.critical} critical, ${counts.error} errors, ${counts.warning} warnings, ${counts.opportunity} opportunities.`,
        },
      ],
      thinking: { type: "disabled" },
    });
    return completion.choices?.[0]?.message?.content?.trim() || "";
  } catch {
    return `Overall health is ${scores.overall}/100. Focus on the ${counts.critical} critical issues first to unlock the largest score improvement.`;
  }
}
