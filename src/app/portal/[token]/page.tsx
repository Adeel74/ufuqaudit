"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2, AlertOctagon, AlertTriangle, AlertCircle, Lightbulb,
  ShieldCheck, Gauge, Brain, FileText, Sparkles, Lock, ExternalLink,
  TrendingUp, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PortalData {
  link: {
    clientName: string;
    auditUrl: string;
    overallScore: number;
    branding: { agencyName: string; primaryColor: string; logoUrl: string | null };
    createdAt: string;
    expiresAt: string | null;
  };
  audit: {
    overallScore: number;
    scores: { technical: number; content: number; performance: number; aeo: number; geo: number; security: number };
    counts: { critical: number; error: number; warning: number; opportunity: number };
    pagesCrawled: number;
    summary: string;
    topIssues: { category: string; severity: string; title: string; description: string; recommendation: string | null }[];
    aiActionPlan: string[];
  };
}

const CATEGORIES = [
  { key: "technical", label: "Technical SEO", icon: Gauge },
  { key: "content", label: "Content SEO", icon: FileText },
  { key: "performance", label: "Performance", icon: Gauge },
  { key: "aeo", label: "AEO", icon: Brain },
  { key: "geo", label: "GEO / AI Visibility", icon: Sparkles },
  { key: "security", label: "Security", icon: ShieldCheck },
] as const;

function scoreColor(v: number) {
  return v >= 80 ? "#10b981" : v >= 60 ? "#f59e0b" : v >= 40 ? "#f97316" : "#ef4444";
}

export default function PortalPage() {
  const params = useParams<{ token: string }>();
  const [data, setData] = React.useState<PortalData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!params?.token) return;
    fetch(`/api/portal/${params.token}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json?.error || "Failed to load");
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params?.token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your audit report…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
        <Card className="max-w-md p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <Lock className="w-7 h-7 text-red-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">Link unavailable</h1>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <p className="text-xs text-muted-foreground">Please contact your agency if you believe this is an error.</p>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { link, audit } = data;
  const brand = link.branding.primaryColor;

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Branded header */}
      <header className="border-b" style={{ backgroundColor: `${brand}08`, borderColor: `${brand}30` }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: brand }}>
                {link.branding.agencyName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-lg leading-tight">{link.branding.agencyName}</div>
                <div className="text-xs text-muted-foreground">Website Audit Report</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Prepared for</div>
              <div className="font-semibold text-sm">{link.clientName}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        {/* Score hero */}
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Score ring */}
            <div className="relative inline-flex items-center justify-center" style={{ width: 140, height: 140 }}>
              <svg width={140} height={140} className="-rotate-90">
                <circle cx={70} cy={70} r={62} fill="none" stroke="currentColor" className="text-muted" strokeWidth={10} />
                <circle
                  cx={70}
                  cy={70}
                  r={62}
                  fill="none"
                  stroke={scoreColor(audit.overallScore)}
                  strokeWidth={10}
                  strokeDasharray={2 * Math.PI * 62}
                  strokeDashoffset={2 * Math.PI * 62 - (audit.overallScore / 100) * (2 * Math.PI * 62)}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${scoreColor(audit.overallScore)}40)` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold tabular-nums" style={{ color: scoreColor(audit.overallScore) }}>{audit.overallScore}</span>
                <span className="text-[10px] text-muted-foreground">Ufuq Score / 100</span>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold mb-2">Your Website Health Report</h1>
              <p className="text-sm text-muted-foreground mb-3">
                <a href={link.auditUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline" style={{ color: brand }}>
                  {link.auditUrl.replace(/^https?:\/\//, "")} <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              {audit.summary && <p className="text-sm text-muted-foreground leading-relaxed">{audit.summary}</p>}
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(link.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                <span>·</span>
                <span>{audit.pagesCrawled} pages crawled</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Category scores */}
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Category Scores</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CATEGORIES.map((c) => {
              const v = audit.scores[c.key];
              const Icon = c.icon;
              return (
                <div key={c.key} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" style={{ color: brand }} />
                    <span className="text-xs font-medium text-muted-foreground">{c.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold tabular-nums" style={{ color: scoreColor(v) }}>{v}</span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: brand }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Issue summary */}
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Issues Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Critical", count: audit.counts.critical, color: "#ef4444", icon: AlertOctagon },
              { label: "Errors", count: audit.counts.error, color: "#f97316", icon: AlertTriangle },
              { label: "Warnings", count: audit.counts.warning, color: "#f59e0b", icon: AlertCircle },
              { label: "Opportunities", count: audit.counts.opportunity, color: "#10b981", icon: Lightbulb },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border p-4 text-center">
                <s.icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: s.color }} />
                <div className="text-2xl font-bold tabular-nums" style={{ color: s.color }}>{s.count}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top issues */}
        {audit.topIssues.length > 0 && (
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Top Issues Found</h2>
            <div className="space-y-3">
              {audit.topIssues.map((issue, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="pt-0.5">
                    {issue.severity === "critical" ? <AlertOctagon className="w-4 h-4 text-red-500" /> :
                     issue.severity === "error" ? <AlertTriangle className="w-4 h-4 text-orange-500" /> :
                     issue.severity === "warning" ? <AlertCircle className="w-4 h-4 text-amber-500" /> :
                     <Lightbulb className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{issue.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{issue.description}</p>
                    {issue.recommendation && (
                      <p className="text-xs mt-1.5 p-2 rounded-md bg-muted/50" style={{ color: brand }}>
                        <strong>Fix:</strong> {issue.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Action plan */}
        {audit.aiActionPlan.length > 0 && (
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: brand }} />
              Recommended Action Plan
            </h2>
            <ol className="space-y-2.5">
              {audit.aiActionPlan.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold" style={{ backgroundColor: brand }}>
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed pt-0.5">{p}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {/* CTA */}
        <Card className="p-6 text-center" style={{ backgroundColor: `${brand}05`, borderColor: `${brand}30` }}>
          <CheckCircle2 className="w-8 h-8 mx-auto mb-3" style={{ color: brand }} />
          <h2 className="font-bold text-lg mb-1">Want a deeper dive?</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Contact {link.branding.agencyName} for a full audit walkthrough, prioritized fixes, and ongoing monitoring.
          </p>
          <Button style={{ backgroundColor: brand, color: "white" }} className="hover:opacity-90">
            Contact {link.branding.agencyName}
          </Button>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t mt-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {link.branding.agencyName} · Powered by UfuqAudit</span>
          {link.expiresAt && (
            <span>Link expires {new Date(link.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          )}
        </div>
      </footer>
    </div>
  );
}
