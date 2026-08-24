"use client";

import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  GaugeCircle, Brain, Bot, Gauge, Shield, Sparkles, FileText,
  Search, Link2, PenLine, Network, CalendarClock, Share2, Mail,
  BarChart3, Activity, Terminal, FileEdit, SlidersHorizontal, ArrowRight,
} from "lucide-react";

const FEATURES = [
  { icon: GaugeCircle, name: "Real Crawler", desc: "Fetches HTML, robots.txt, sitemap. 200+ signals analyzed.", color: "#6366f1" },
  { icon: Brain, name: "AEO Scoring", desc: "Answer Engine Optimization readiness for ChatGPT, Claude, Perplexity.", color: "#8b5cf6" },
  { icon: Bot, name: "GEO / AI Visibility", desc: "AI crawler access, citation readiness, entity clarity signals.", color: "#ec4899" },
  { icon: Gauge, name: "Core Web Vitals", desc: "LCP, INP, CLS, TTFB, FCP with pass/warn/fail thresholds.", color: "#f59e0b" },
  { icon: Shield, name: "Security Checks", desc: "HTTPS, HSTS, CSP, X-Frame-Options, mixed content.", color: "#06b6d4" },
  { icon: Sparkles, name: "AI Fixes", desc: "Generate meta tags, schema, FAQ, H1 — copy-paste ready.", color: "#10b981" },
  { icon: Search, name: "Keyword Tracking", desc: "Monitor positions, SERP features, trend sparklines.", color: "#10b981" },
  { icon: Link2, name: "Backlink Monitor", desc: "Track incoming links, domain authority, anchor distribution.", color: "#6366f1" },
  { icon: PenLine, name: "Content Analyzer", desc: "Readability (Flesch), keyword density, content checks.", color: "#8b5cf6" },
  { icon: Network, name: "Link Graph", desc: "Interactive SVG node-edge graph of internal link structure.", color: "#ec4899" },
  { icon: CalendarClock, name: "Scheduled Audits", desc: "Automate weekly/monthly recurring audits with notifications.", color: "#f59e0b" },
  { icon: Share2, name: "Client Portal", desc: "Shareable branded audit links — no login required for clients.", color: "#06b6d4" },
  { icon: BarChart3, name: "Search Console", desc: "GSC integration: clicks, impressions, CTR, position, queries.", color: "#10b981" },
  { icon: Mail, name: "Email Reports", desc: "Send branded audit reports directly to clients via email.", color: "#8b5cf6" },
  { icon: Activity, name: "Activity Feed", desc: "Team collaboration timeline with 8 event types.", color: "#ec4899" },
  { icon: Terminal, name: "API Docs", desc: "10 documented endpoints + interactive API key management.", color: "#f59e0b" },
  { icon: FileEdit, name: "Page Editor", desc: "Edit meta tags with live SERP preview + AI generation.", color: "#06b6d4" },
  { icon: SlidersHorizontal, name: "Crawl Settings", desc: "Configure depth, engines, user agent, exclude paths.", color: "#10b981" },
];

export function FeaturesPage() {
  const { setView } = useAppStore();
  return (
    <div>
      <section className="border-b bg-gradient-to-b from-emerald-50/50 to-background dark:from-emerald-950/10 py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Features
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">Everything you need to <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">audit, fix & monitor</span></h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">18 powerful features across SEO, AEO, GEO, performance, security, and team collaboration.</p>
          <Button size="lg" className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setView("landing")}>
            Run Free Audit <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <Card key={f.name} className="p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${f.color}15`, color: f.color }}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">{f.name}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function AboutPage() {
  const { setView } = useAppStore();
  return (
    <div>
      <section className="border-b bg-gradient-to-b from-emerald-50/50 to-background dark:from-emerald-950/10 py-16">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold">About UfuqAudit</h1>
          <p className="mt-4 text-lg text-muted-foreground">AI-powered website audit for the AI search era. We don't just check SEO — we cover the full spectrum from traditional search to AI answer engines.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-3">Our Mission</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">UfuqAudit was built to bridge the gap between traditional SEO tools and the emerging world of AI answer engines. While most tools stop at checking meta tags and Core Web Vitals, we measure your readiness for ChatGPT, Claude, and Perplexity — because being optimized for Google is no longer enough.</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-3">What Makes Us Different</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3"><span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">1</span><span className="text-sm"><strong>AEO + GEO first:</strong> We're the only audit tool that measures Answer Engine Optimization and AI visibility as primary categories, not afterthoughts.</span></li>
              <li className="flex items-start gap-3"><span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">2</span><span className="text-sm"><strong>AI-powered fixes:</strong> Don't just tell you what's wrong — generate the fix. Meta tags, schema, FAQ, H1, all copy-paste ready.</span></li>
              <li className="flex items-start gap-3"><span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">3</span><span className="text-sm"><strong>Action plans, not issue lists:</strong> "You have 37 issues. Here are the 7 that matter most, why they matter, and which pages to fix first."</span></li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-3">Contact</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Email: hello@ufuqaudit.app</p>
              <p>Support: support@ufuqaudit.app</p>
              <p>Twitter: @UfuqAudit</p>
            </div>
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setView("landing")}>Get Started</Button>
          </Card>
        </div>
      </section>
    </div>
  );
}

export function BlogPublicPage() {
  const { setView } = useAppStore();
  const posts = [
    { title: "The Complete Guide to AEO: Answer Engine Optimization in 2024", category: "AEO", date: "5 days ago", author: "Sarah Chen", excerpt: "Everything you need to know about optimizing for AI answer engines.", color: "#8b5cf6" },
    { title: "GEO vs SEO: What's Different and Why It Matters", category: "GEO", date: "12 days ago", author: "Amir Hassan", excerpt: "Understand the key differences between traditional SEO and GEO.", color: "#ec4899" },
    { title: "10 Technical SEO Checks You Can't Afford to Miss", category: "Technical SEO", date: "20 days ago", author: "Mike Rodriguez", excerpt: "Critical technical SEO issues that hurt your rankings.", color: "#6366f1" },
    { title: "Internal Linking Strategy: Build Your SEO Silo", category: "Technical SEO", date: "35 days ago", author: "Mike Rodriguez", excerpt: "How to structure internal links for maximum SEO impact.", color: "#6366f1" },
  ];
  return (
    <div>
      <section className="border-b bg-gradient-to-b from-emerald-50/50 to-background dark:from-emerald-950/10 py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold">UfuqAudit Blog</h1>
          <p className="mt-4 text-lg text-muted-foreground">SEO, AEO & GEO insights from our team.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 grid sm:grid-cols-2 gap-6">
          {posts.map((p) => (
            <Card key={p.title} className="p-5 hover:shadow-md transition-all cursor-pointer" >
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium mb-3" style={{ backgroundColor: `${p.color}15`, color: p.color }}>
                {p.category}
              </div>
              <h3 className="font-semibold text-lg leading-snug">{p.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{p.excerpt}</p>
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <span>{p.author}</span>
                <span>·</span>
                <span>{p.date}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
