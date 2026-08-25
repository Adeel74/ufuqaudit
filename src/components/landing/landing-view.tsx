"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GaugeCircle, Sparkles, ShieldCheck, Brain, Gauge, FileText,
  ArrowRight, CheckCircle2, Zap, AlertOctagon, Lightbulb, Eye, Bot,
  ChevronRight, Star, TrendingUp, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { ScoreRing } from "@/components/dashboard/score-ui";
import { OnboardingWizard } from "@/components/landing/onboarding-wizard";

export function LandingView() {
  const { setView, setCurrentAudit, login, user } = useAppStore();
  const [url, setUrl] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [onboardingOpen, setOnboardingOpen] = React.useState(false);

  const signInAsAdmin = async () => {
    try {
      const res = await fetch("/api/auth/demo-admin", { method: "POST" });
      const data = await res.json();
      if (data?.admin) {
        login(data.admin.email, data.admin.name, data.admin.role, data.admin.plan);
        toast.success(`Signed in as ${data.admin.name}`, {
          description: `${data.admin.email} · ${data.admin.plan.toUpperCase()} plan`,
        });
        setView("admin");
      }
    } catch {
      toast.error("Failed to sign in as admin");
    }
  };

  const runAudit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!url.trim()) {
      toast.error("Please enter a website URL");
      return;
    }
    setRunning(true);
    setView("audit-progress");
    try {
      const res = await fetch("/api/audit/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Audit failed");
      setCurrentAudit(data);
      // If user is logged in (has real auth), go to dashboard. Otherwise show public results.
      if (user && user.email !== "demo@ufuqaudit.app") {
        setView("dashboard");
      } else {
        setView("public-result");
      }
      toast.success(`Audit complete — Ufuq Score ${data.overallScore}/100`);
    } catch (err: any) {
      toast.error(err?.message || "Audit failed");
      setView("landing");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background gradient + grid */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 via-teal-50/30 to-background dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-background" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-teal-400/20 blur-3xl" />

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-12 sm:pb-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered SEO · AEO · GEO · Performance Audit
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
              Find what's hurting your website.
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Understand why. Get the fix.
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              UfuqAudit crawls your site across <strong>Technical SEO, Content, AEO, GEO/AI Visibility, Performance & Security</strong> — then hands you a prioritized action plan with AI-generated fixes you can copy-paste.
            </p>

            {/* Audit input */}
            <form onSubmit={runAudit} className="mt-8 mx-auto max-w-xl flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <GaugeCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="pl-11 h-12 text-base shadow-sm"
                  disabled={running}
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-6 text-base shadow-md" disabled={running}>
                {running ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2" /> Auditing…</>
                ) : (
                  <>Run Free Audit <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </form>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> No signup needed</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 50 URLs free</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Results in 10s</span>
            </div>
          </div>

          {/* Sample preview card */}
          <div className="mt-12 mx-auto max-w-4xl">
            <PreviewCard onTry={() => { setUrl("https://example.com"); }} />
          </div>
        </div>
      </section>

      {/* Logos / stats strip */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { n: "216+", l: "Audit checks" },
              { n: "6", l: "Audit engines" },
              { n: "4", l: "AI answer engines" },
              { n: "10s", l: "Avg audit time" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{s.n}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engines */}
      <EnginesSection />

      {/* How it works */}
      <HowItWorks />

      {/* Differentiator */}
      <Differentiator />

      {/* Features grid */}
      <FeaturesGrid />

      {/* Pricing teaser */}
      <PricingTeaser onView={() => setView("pricing")} />

      {/* CTA */}
      <FinalCTA onRun={() => { setUrl(""); window.scrollTo({ top: 0, behavior: "smooth" }); }} onWizard={() => setOnboardingOpen(true)} onAdmin={signInAsAdmin} />

      <OnboardingWizard open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />
    </div>
  );
}

function PreviewCard({ onTry }: { onTry: () => void }) {
  return (
    <div className="relative rounded-2xl border bg-card shadow-xl overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-9 bg-muted/50 border-b flex items-center px-4 gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <div className="mx-auto text-xs text-muted-foreground">ufuqaudit.app/dashboard</div>
      </div>
      <div className="pt-10 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col items-center justify-center gap-2 md:border-r md:pr-6">
          <ScoreRing value={78} size={120} label="Ufuq Score" />
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <TrendingUp className="w-3 h-3" /> +6 from last audit
          </div>
        </div>
        <div className="space-y-2 md:border-r md:pr-6">
          <div className="text-xs uppercase text-muted-foreground font-semibold mb-2">Category scores</div>
          {[
            { l: "Technical SEO", v: 86, c: "#6366f1" },
            { l: "Content", v: 74, c: "#10b981" },
            { l: "Performance", v: 81, c: "#f59e0b" },
            { l: "AEO", v: 68, c: "#8b5cf6" },
            { l: "GEO", v: 59, c: "#ec4899" },
            { l: "Security", v: 92, c: "#06b6d4" },
          ].map((s) => (
            <div key={s.l} className="flex items-center gap-2 text-xs">
              <span className="w-24 truncate">{s.l}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${s.v}%`, backgroundColor: s.c }} />
              </div>
              <span className="w-7 text-right font-mono">{s.v}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="text-xs uppercase text-muted-foreground font-semibold mb-2">Top priorities</div>
          {[
            { i: AlertOctagon, c: "text-red-600", t: "7 Critical issues" },
            { i: AlertOctagon, c: "text-orange-600", t: "24 Errors" },
            { i: AlertOctagon, c: "text-amber-600", t: "41 Warnings" },
            { i: Lightbulb, c: "text-emerald-600", t: "18 Opportunities" },
          ].map((p, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <p.i className={`w-3.5 h-3.5 ${p.c}`} />
              <span>{p.t}</span>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs uppercase text-muted-foreground font-semibold mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-violet-500" /> AI Action Plan
            </div>
            <div className="text-xs text-muted-foreground">Fix 12 broken internal links → improve 8 titles → add Organization schema…</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EnginesSection() {
  const engines = [
    { icon: Gauge, name: "Technical SEO", desc: "Crawlability, indexability, canonicals, redirects, robots.txt, sitemap.", color: "#6366f1" },
    { icon: FileText, name: "Content SEO", desc: "Titles, headings, content depth, duplicates, E-E-A-T signals.", color: "#10b981" },
    { icon: Brain, name: "AEO", desc: "Answer Engine Optimization — direct answers, FAQs, entity clarity.", color: "#8b5cf6" },
    { icon: Bot, name: "GEO / AI Visibility", desc: "AI crawler access, citation readiness, authority signals.", color: "#ec4899" },
    { icon: Gauge, name: "Performance", desc: "Core Web Vitals — LCP, INP, CLS, TTFB, page weight.", color: "#f59e0b" },
    { icon: ShieldCheck, name: "Security", desc: "HTTPS, HSTS, CSP, security headers, mixed content.", color: "#06b6d4" },
  ];
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold">Six audit engines. One score.</h2>
          <p className="mt-3 text-muted-foreground">UfuqAudit doesn't just check SEO — it covers the full spectrum from traditional search to AI answer engines.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {engines.map((e) => (
            <div key={e.name} className="group rounded-xl border bg-card p-6 hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${e.color}20`, color: e.color }}>
                <e.icon className="w-5.5 h-5.5" />
              </div>
              <h3 className="font-semibold text-lg">{e.name}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Enter your URL", d: "Drop your website URL. We crawl it, fetch robots.txt, sitemap and render your pages.", i: GaugeCircle },
    { n: "02", t: "Run 200+ checks", d: "Six engines analyze technical SEO, content, performance, AEO, GEO and security.", i: Eye },
    { n: "03", t: "Get prioritized plan", d: "Issues ranked by severity & impact, plus an AI-generated action plan.", i: ListPriority },
    { n: "04", t: "Apply AI fixes", d: "Copy-paste ready meta tags, schema, FAQ, alt text — generated for your pages.", i: Sparkles },
  ];
  return (
    <section className="py-16 sm:py-24 bg-muted/30 border-y">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold">From URL to action plan in 4 steps</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-xl bg-card border p-6">
              <div className="text-3xl font-bold text-muted-foreground/30">{s.n}</div>
              <s.i className="w-6 h-6 text-emerald-600 mt-2" />
              <h3 className="font-semibold mt-3">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Differentiator() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-400 text-xs font-medium mb-4">
              <Bot className="w-3.5 h-3.5" /> The AEO / GEO difference
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Your site is optimized for Google.
              <span className="block text-muted-foreground">Is it ready for ChatGPT, Claude & Perplexity?</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Most tools stop at traditional SEO. UfuqAudit measures your readiness for AI answer engines — checking crawler access, answer extraction, entity clarity, citation worthiness and authority signals.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "AI Crawler access (GPTBot, ClaudeBot, PerplexityBot)",
                "Direct-answer & FAQ structure detection",
                "Entity clarity, author credentials, original data",
                "Citation-worthy passage scoring",
                "AI Visibility score (ChatGPT / Claude / Perplexity / Google)",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-muted-foreground">AI Visibility</div>
                <div className="text-3xl font-bold">59 <span className="text-base text-muted-foreground font-normal">/ 100</span></div>
              </div>
              <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-pink-600" />
              </div>
            </div>
            <div className="space-y-3">
              {[
                { l: "ChatGPT readiness", v: 71, c: "#10b981" },
                { l: "Claude readiness", v: 65, c: "#f59e0b" },
                { l: "Perplexity readiness", v: 54, c: "#f97316" },
                { l: "Google AI readiness", v: 67, c: "#10b981" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="flex justify-between text-xs mb-1"><span>{s.l}</span><span className="font-mono">{s.v}</span></div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.v}%`, backgroundColor: s.c }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
              <Lock className="w-3 h-3 inline mr-1" />
              We measure readiness signals — we don't claim to rank you in ChatGPT.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  const features = [
    { i: Zap, t: "Instant crawl", d: "Real crawler fetches your HTML, robots & sitemap, then renders each page." },
    { i: AlertOctagon, t: "Severity prioritization", d: "Critical · Error · Warning · Opportunity. Tackle what matters first." },
    { i: Sparkles, t: "AI-generated fixes", d: "Meta tags, H1, schema, FAQ, alt text — copy-paste ready for your pages." },
    { i: TrendingUp, t: "Historical tracking", d: "Watch your score climb audit after audit. Schedule recurring crawls." },
    { i: FileText, t: "White-label reports", d: "Add your logo, brand & contact. Export PDF for clients." },
    { i: ShieldCheck, t: "Security check", d: "HTTPS, HSTS, CSP, mixed content — keep users & crawlers safe." },
  ];
  return (
    <section className="py-16 sm:py-24 bg-muted/30 border-y">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold">Everything you'd expect — plus what others miss</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.t} className="rounded-xl border bg-card p-6">
              <f.i className="w-6 h-6 text-emerald-600 mb-3" />
              <h3 className="font-semibold">{f.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingTeaser({ onView }: { onView: () => void }) {
  const tiers = [
    { n: "Free", p: "$0", f: "1 audit / month · 50 URLs · basic checks" },
    { n: "Starter", p: "$19", f: "1,000 URLs · AEO + GEO · AI fixes", pop: true },
    { n: "Pro", p: "$49", f: "10,000 URLs · GSC · scheduled audits" },
    { n: "Agency", p: "$99", f: "50,000 URLs · white-label · API" },
  ];
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold">Simple pricing</h2>
          <p className="mt-3 text-muted-foreground">Start free. Upgrade when you need more URLs, GSC, or white-label reports.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((t) => (
            <div key={t.n} className={`relative rounded-xl border bg-card p-6 ${t.pop ? "border-emerald-500 shadow-lg ring-1 ring-emerald-500/20" : ""}`}>
              {t.pop && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase">
                  Popular
                </span>
              )}
              <div className="text-sm font-semibold text-muted-foreground">{t.n}</div>
              <div className="mt-2 text-3xl font-bold">{t.p}<span className="text-base text-muted-foreground font-normal">/mo</span></div>
              <div className="mt-3 text-xs text-muted-foreground min-h-[40px]">{t.f}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={onView}>Compare all features <ChevronRight className="w-4 h-4 ml-1" /></Button>
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ onRun, onWizard, onAdmin }: { onRun: () => void; onWizard: () => void; onAdmin: () => void }) {
  const { setView } = useAppStore();
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-10 sm:p-16 text-center text-white">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="relative">
            <Star className="w-8 h-8 mx-auto mb-4 opacity-80" />
            <h2 className="text-3xl sm:text-4xl font-bold">Audit your website in the next 10 seconds</h2>
            <p className="mt-3 text-white/80 max-w-xl mx-auto">No credit card. No signup. Just enter your URL and see your score.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-emerald-700 hover:bg-white/90" onClick={onRun}>
                Run Free Audit <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 hover:text-white" onClick={onWizard}>
                <Sparkles className="w-4 h-4 mr-1" /> Guided Setup
              </Button>
              <Button size="lg" variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white" onClick={() => setView("pricing")}>
                View Pricing
              </Button>
            </div>
            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-xs text-white/60 mb-3">Are you an administrator?</p>
              <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={onAdmin}>
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Sign in as Super Admin
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// local icon import fallback
import { ListChecks as ListPriority } from "lucide-react";
