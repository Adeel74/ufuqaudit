"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BookOpen, Rocket, Search, Brain, Bot, Plug, CreditCard, FileBarChart,
  Wrench, ChevronRight, Terminal, ArrowRight, Lightbulb, Copy,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DOC_SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    description: "Run your first audit in under a minute",
    pages: [
      { title: "Quick Start", content: "Enter your website URL on the home page and click 'Run Free Audit'. UfuqAudit will crawl your site, analyze 200+ signals across 6 engines, and return a prioritized action plan with AI-generated fixes — all in about 10 seconds.\n\nNo signup required for the free audit. Create an account to save your audit history, schedule recurring audits, and access advanced features like competitor comparison and white-label reports." },
      { title: "Understanding Your Score", content: "Your Ufuq Score (0-100) is a weighted average of 6 category scores:\n\n- Technical SEO (25%) - crawlability, indexability, redirects, canonicals\n- Content SEO (20%) - titles, headings, word count, content depth\n- Performance (15%) - Core Web Vitals (LCP, INP, CLS, TTFB)\n- AEO (15%) - Answer Engine Optimization readiness\n- GEO (15%) - AI visibility & citation readiness\n- Security (10%) - HTTPS, headers, mixed content\n\nCritical issues have the highest score impact. Fix them first." },
      { title: "Audit History & Trends", content: "Every audit is saved to your history. Track your score over time, see which categories improved, and compare audits side-by-side. Use scheduled audits (Pro plan) to automate weekly or monthly monitoring.\n\nThe trend chart shows your progress - aim for a steady upward curve as you fix issues." },
    ],
  },
  {
    id: "seo-audits",
    title: "SEO Audits",
    icon: Search,
    description: "Technical SEO, on-page, content & internal links",
    pages: [
      { title: "Technical SEO Checks", content: "UfuqAudit checks 15+ technical SEO signals:\n\n- robots.txt existence, syntax, and AI crawler rules\n- XML sitemap presence and validity\n- HTTPS enforcement and redirect chains\n- Canonical tag detection and consistency\n- noindex/nofollow directives\n- URL structure, trailing slashes, uppercase\n- HTTP status codes (200/301/302/404/5xx)\n- Crawl depth and URL parameter issues\n\nEach check includes a severity (Critical/Error/Warning/Opportunity), score impact, and a specific fix recommendation." },
      { title: "On-Page SEO", content: "30+ on-page checks cover:\n\n- Title tag presence, length (50-60 chars), duplicates\n- Meta description presence, length (140-160 chars)\n- H1 presence, hierarchy, duplicates\n- H2 structure and heading order\n- Image alt text coverage\n- Open Graph and Twitter Card tags\n- Viewport meta and HTML lang attributes\n- Canonical self-references\n- Favicon and OG image\n\nUse the Page Editor to fix issues directly with AI-generated suggestions." },
      { title: "Internal Linking", content: "Internal link analysis covers:\n\n- Orphan pages (pages with few internal links)\n- Broken internal links\n- Click depth from homepage\n- Anchor text quality and diversity\n- Link equity distribution\n- Silo structure opportunities\n\nUse the Link Graph visualization to see your site architecture as an interactive node-edge graph." },
    ],
  },
  {
    id: "aeo",
    title: "AEO - Answer Engine Optimization",
    icon: Brain,
    description: "Get cited by ChatGPT, Claude & Perplexity",
    pages: [
      { title: "What is AEO?", content: "Answer Engine Optimization (AEO) is the practice of structuring your content so AI answer engines (ChatGPT, Claude, Perplexity, Google AI Overviews) can extract and cite your answers.\n\nUnlike traditional SEO which targets search engine result pages, AEO targets AI-generated answers. Key signals include:\n\n- Direct, concise answers (40-55 words)\n- Question-based H2/H3 headings\n- FAQ sections with FAQPage schema\n- Clear entity definitions\n- Author credentials and E-E-A-T signals\n- Citation-worthy passages with statistics" },
      { title: "AEO Score Breakdown", content: "Your AEO score is composed of 5 sub-scores:\n\n- Answer Readiness - does your content have direct, citable answers?\n- Question Coverage - do you cover common user questions?\n- Entity Clarity - are your entities well-defined with schema?\n- Citation Readiness - is your content structured for AI citation?\n- Schema Markup - do you have FAQPage, Article, and Organization schema?\n\nEach sub-score reconciles to match your overall AEO score." },
    ],
  },
  {
    id: "geo",
    title: "GEO / AI Visibility",
    icon: Bot,
    description: "AI visibility signals & readiness",
    pages: [
      { title: "AI Visibility Score", content: "GEO (Generative Engine Optimization) measures your site's readiness for AI answer engines. UfuqAudit checks:\n\n- AI Crawler access (GPTBot, ClaudeBot, PerplexityBot, Google-Extended)\n- Entity clarity (Organization + WebSite schema)\n- Author authority signals\n- Original research and data\n- Source attribution and citations\n- Brand identity consistency\n- Topical authority\n\nImportant: We measure readiness signals - we don't claim to rank you in ChatGPT. AI visibility is an emerging field and no tool can guarantee AI rankings." },
    ],
  },
  {
    id: "api",
    title: "API Reference",
    icon: Terminal,
    description: "Build with the UfuqAudit API",
    pages: [
      { title: "Authentication", content: "All API requests require an API key passed in the Authorization header:\n\nAUTH_HEADER: Authorization: Bearer ufa_live_your_api_key\n\nGenerate API keys from Settings - API Keys or from the Admin Portal - API Keys section.\n\nRate limits: 1000 requests/hour (Pro plan), 50000 requests/hour (Agency plan). Rate limit headers are included in every response." },
      { title: "Run an Audit", content: "METHOD: POST /api/v1/audits\nCONTENT_TYPE: application/json\n\nBODY:\nurl: https://example.com\ndepth: 50\nengines: [technical, content, performance, aeo, geo, security]\n\nRESPONSE:\nid: audit_abc123\nstatus: running\nurl: https://example.com\nestimated_time: 10\n\nPoll GET /api/v1/audits/{id} until status is done." },
      { title: "Get Audit Results", content: "METHOD: GET /api/v1/audits/{id}\n\nReturns the full audit result including:\n\n- overallScore (0-100)\n- scores per category\n- pages array with per-page data\n- issues array with severity, category, recommendation\n- aiActionPlan - prioritized fix list\n- summary - AI-generated executive summary" },
      { title: "Webhooks", content: "Configure webhooks to receive real-time events:\n\n- audit.started\n- audit.completed\n- audit.failed\n- audit.issue.critical\n- user.created\n- payment.received\n- subscription.cancelled\n\nWebhook payloads are signed with your webhook secret using HMAC-SHA256." },
    ],
  },
  {
    id: "integrations",
    title: "Integrations",
    icon: Plug,
    description: "Connect GSC, GA4, Slack & more",
    pages: [
      { title: "Google Search Console", content: "Connect GSC (Pro plan+) to see real search data alongside your audit scores:\n\n- Clicks, impressions, CTR, and average position\n- Top queries and pages\n- Country and device breakdown\n- Indexing status via URL Inspection\n\nUfuqAudit cross-references your crawl data with GSC data to surface opportunities like 'your page is technically indexable but Google isn't showing it' - combining crawler insight with real Google data." },
      { title: "Slack & Discord Notifications", content: "Get real-time notifications when:\n\n- An audit completes\n- A critical issue is detected\n- Your score improves or drops\n- A scheduled audit runs\n\nConfigure webhooks from Settings - Integrations. Each channel can be configured with specific event filters." },
    ],
  },
  {
    id: "billing",
    title: "Billing & Plans",
    icon: CreditCard,
    description: "Plans, upgrades, invoices & refunds",
    pages: [
      { title: "Pricing Plans", content: "UfuqAudit offers 4 plans:\n\n- Free - 1 project, 50 URLs, 1 audit/month, basic checks\n- Starter ($19/mo) - 5 projects, 1000 URLs, AEO+GEO, AI recommendations\n- Professional ($49/mo) - 20 projects, 10000 URLs, GSC, scheduled audits, white-label\n- Agency ($99/mo) - 50 projects, 50000 URLs, client management, API, team members\n\nAnnual billing saves 17%. Upgrade or downgrade anytime - prorated billing." },
      { title: "Invoices & Refunds", content: "All invoices are available from Settings - Billing. Download PDF invoices for tax purposes.\n\nRefund policy: 14-day money-back guarantee on all paid plans. Contact support@ufuqaudit.app for refunds.\n\nFailed payments: you'll be notified via email. Your account stays active for 7 days during the grace period before being downgraded." },
    ],
  },
  {
    id: "reports",
    title: "Reports & White-Label",
    icon: FileBarChart,
    description: "PDF reports, client portal & branding",
    pages: [
      { title: "PDF Reports", content: "Generate branded PDF reports from any audit:\n\n- Executive Summary - 1-page overview with score, top wins, risks\n- Technical SEO Report - detailed crawl + indexability + schema\n- AEO/GEO Report - AI visibility analysis\n- Full Audit - comprehensive report with all categories\n- White-Label Custom - your logo, colors, and contact info\n\nReports can be emailed directly to clients from the Email Reports view." },
      { title: "Client Portal", content: "Create shareable branded audit links for clients:\n\n1. Go to Client Portal - Create Link\n2. Enter client name, email, and audit URL\n3. Choose brand color and agency name\n4. Set expiration (7/30/90 days or never)\n5. Share the /portal/{token} link\n\nClients see a branded read-only audit report with your agency's logo, colors, and contact CTA - no login required." },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: Wrench,
    description: "Common issues & solutions",
    pages: [
      { title: "Audit Failed or Timed Out", content: "If your audit fails:\n\n1. Check the URL is accessible (try opening it in a browser)\n2. Ensure robots.txt isn't blocking UfuqAuditBot\n3. Large sites (>10000 URLs) may take longer - try a smaller crawl depth\n4. JavaScript-heavy sites may need 'Render JavaScript' enabled in Crawl Settings\n5. If the issue persists, try again in 5 minutes or contact support\n\nFailed audits don't count against your monthly limit." },
      { title: "Score Didn't Change After Fixes", content: "If you fixed issues but your score didn't improve:\n\n1. Re-run the audit - scores only update on new audits\n2. Check if the fixes were actually applied (use the Page Editor to verify)\n3. Some checks (like Core Web Vitals) use field data that updates slowly\n4. Review the Issues list - ensure the fixed issues are marked as 'Fixed'\n5. Use Audit History to compare before/after scores" },
    ],
  },
];

export function DocsView() {
  const { setView } = useAppStore();
  const [activeSection, setActiveSection] = React.useState(DOC_SECTIONS[0].id);
  const [activePage, setActivePage] = React.useState(0);
  const [search, setSearch] = React.useState("");

  const section = DOC_SECTIONS.find((s) => s.id === activeSection) || DOC_SECTIONS[0];
  const page = section.pages[activePage] || section.pages[0];

  const filteredSections = search.trim()
    ? DOC_SECTIONS.map((s) => ({
        ...s,
        pages: s.pages.filter((p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.content.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((s) => s.pages.length > 0)
    : DOC_SECTIONS;

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-emerald-50/50 to-background dark:from-emerald-950/10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-medium mb-4">
            <BookOpen className="w-3.5 h-3.5" /> Documentation
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">UfuqAudit Documentation</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">Everything you need to master SEO, AEO, GEO, and AI-powered website auditing.</p>
          <div className="mt-6 max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documentation..."
              className="w-full pl-9 pr-4 h-10 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar nav */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              {filteredSections.map((s) => (
                <div key={s.id}>
                  <button
                    onClick={() => { setActiveSection(s.id); setActivePage(0); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      activeSection === s.id ? "bg-emerald-500/10 text-emerald-700" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <s.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{s.title}</span>
                  </button>
                  {activeSection === s.id && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l pl-3">
                      {s.pages.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActivePage(idx)}
                          className={cn(
                            "block w-full text-left text-xs py-1.5 px-2 rounded transition-colors truncate",
                            activePage === idx ? "text-emerald-600 font-medium" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {p.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </aside>

          {/* Mobile section selector */}
          <div className="lg:hidden mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
              {filteredSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setActiveSection(s.id); setActivePage(0); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                    activeSection === s.id ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  <s.icon className="w-3.5 h-3.5" />
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <main className="min-w-0">
            <Card className="p-6 sm:p-8">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                <button onClick={() => setView("docs")} className="hover:text-foreground">Docs</button>
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => { setActiveSection(section.id); setActivePage(0); }} className="hover:text-foreground">{section.title}</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">{page.title}</span>
              </div>

              {/* Section header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <section.icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{page.title}</h2>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
              </div>

              {/* Page content */}
              <div className="space-y-3">
                {page.content.split("\n").map((line, i) => {
                  if (line.startsWith("- ")) {
                    return <li key={i} className="ml-4 text-sm leading-relaxed list-disc text-muted-foreground">{line.slice(2)}</li>;
                  }
                  if (line.trim() === "") return <div key={i} className="h-2" />;
                  if (line.includes(":") && line.split(":")[0].length < 20 && !line.startsWith("http")) {
                    // Key-value style line
                    const [key, ...rest] = line.split(":");
                    return (
                      <p key={i} className="text-sm leading-relaxed">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{key}</code>
                        {rest.length > 0 ? ":" + rest.join(":") : ""}
                      </p>
                    );
                  }
                  return <p key={i} className="text-sm leading-relaxed text-muted-foreground">{line}</p>;
                })}
              </div>

              {/* Page navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activePage === 0 && section === DOC_SECTIONS[0]}
                  onClick={() => {
                    if (activePage > 0) {
                      setActivePage(activePage - 1);
                    } else {
                      const secIdx = DOC_SECTIONS.findIndex((s) => s.id === activeSection);
                      if (secIdx > 0) {
                        const prev = DOC_SECTIONS[secIdx - 1];
                        setActiveSection(prev.id);
                        setActivePage(prev.pages.length - 1);
                      }
                    }
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">{activePage + 1} / {section.pages.length}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activePage === section.pages.length - 1 && section === DOC_SECTIONS[DOC_SECTIONS.length - 1]}
                  onClick={() => {
                    if (activePage < section.pages.length - 1) {
                      setActivePage(activePage + 1);
                    } else {
                      const secIdx = DOC_SECTIONS.findIndex((s) => s.id === activeSection);
                      if (secIdx < DOC_SECTIONS.length - 1) {
                        const next = DOC_SECTIONS[secIdx + 1];
                        setActiveSection(next.id);
                        setActivePage(0);
                      }
                    }
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Next
                </Button>
              </div>
            </Card>

            {/* Help CTA */}
            <Card className="p-5 mt-6 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/10 border-emerald-200/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Need more help?</h3>
                  <p className="text-xs text-muted-foreground mt-1">Our AI assistant can answer any question about your audit, SEO, AEO, or GEO.</p>
                  <Button size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setView("ai-chat")}>
                    Ask AI Assistant <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
