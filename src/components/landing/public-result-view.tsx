"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import { ScoreRing, ScoreBar } from "@/components/dashboard/score-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  GaugeCircle, ArrowRight, Lock, CheckCircle2, AlertOctagon,
  AlertTriangle, AlertCircle, Lightbulb, Sparkles, TrendingUp,
  Shield, Brain, Gauge, FileText,
} from "lucide-react";
import { CATEGORY_META, type Category } from "@/lib/types";

export function PublicResultView() {
  const { currentAudit, setView } = useAppStore();

  if (!currentAudit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <GaugeCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="font-bold text-lg">No audit results</h2>
          <p className="text-sm text-muted-foreground mt-1">Run an audit to see your results.</p>
          <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setView("landing")}>Run Audit</Button>
        </Card>
      </div>
    );
  }

  const audit = currentAudit;
  const cats: Category[] = ["technical", "content", "performance", "aeo", "geo", "security"];
  const visibleIssues = audit.issues.filter((i) => i.severity === "critical" || i.severity === "error").slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      {/* Public nav bar */}
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => setView("landing")} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
              <GaugeCircle className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">UfuqAudit</span>
          </button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setView("register")}>
            Create Free Account <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 flex-1 space-y-6">
        {/* Score hero */}
        <Card className="p-6 sm:p-8 text-center bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/10 border-emerald-200/50">
          <div className="flex flex-col items-center">
            <ScoreRing value={audit.overallScore} size={140} label="Ufuq Score" sublabel="/ 100" />
            <h1 className="text-2xl font-bold mt-4">Your Website Health Report</h1>
            <p className="text-sm text-muted-foreground mt-1">
              <a href={audit.url} target="_blank" rel="noreferrer" className="hover:underline">{audit.url}</a>
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>{audit.pagesCrawled} pages crawled</span>
              <span>·</span>
              <span>{audit.issues.length} issues found</span>
            </div>
          </div>
        </Card>

        {/* Category scores */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cats.map((c) => {
            const meta = CATEGORY_META[c];
            const v = (audit.scores as any)[c] as number;
            return (
              <Card key={c} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">{meta.label}</span>
                  <span className="text-lg font-bold tabular-nums" style={{ color: meta.color }}>{v}</span>
                </div>
                <ScoreBar value={v} color={meta.color} />
              </Card>
            );
          })}
        </div>

        {/* Issue summary */}
        <Card className="p-5">
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
                <div className="text-[10px] text-muted-foreground uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top issues (limited for guests) */}
        {visibleIssues.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Top Issues</h2>
              <span className="text-xs text-muted-foreground">{visibleIssues.length} of {audit.issues.length} shown</span>
            </div>
            <div className="space-y-3">
              {visibleIssues.map((issue, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                  {issue.severity === "critical" ? <AlertOctagon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> :
                   issue.severity === "error" ? <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" /> :
                   <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{issue.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{issue.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Blurred remaining issues */}
            {audit.issues.length > 5 && (
              <div className="mt-4 relative">
                <div className="space-y-2 blur-sm pointer-events-none select-none">
                  {audit.issues.slice(5, 10).map((issue, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                      <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="h-3 bg-muted rounded w-3/4 mb-1" />
                        <div className="h-2 bg-muted rounded w-full" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center bg-card border rounded-xl p-4 shadow-lg">
                    <Lock className="w-6 h-6 mx-auto text-emerald-600 mb-2" />
                    <p className="text-sm font-medium">{audit.issues.length - 5} more issues</p>
                    <p className="text-xs text-muted-foreground mb-3">Create a free account to see all issues + AI fixes</p>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setView("register")}>
                      Unlock Full Report <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* AI Action Plan preview (limited) */}
        {audit.aiActionPlan.length > 0 && (
          <Card className="p-5">
            <h2 className="font-semibold flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-violet-500" /> AI Action Plan
            </h2>
            <ol className="space-y-2">
              {audit.aiActionPlan.slice(0, 2).map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="text-muted-foreground">{p}</span>
                </li>
              ))}
            </ol>
            {audit.aiActionPlan.length > 2 && (
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="text-xs text-muted-foreground">+ {audit.aiActionPlan.length - 2} more recommendations</span>
                <Button size="sm" variant="outline" onClick={() => setView("register")}>
                  <Lock className="w-3 h-3 mr-1" /> Unlock
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* CTA */}
        <Card className="p-6 sm:p-8 bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-80" />
          <h2 className="text-2xl font-bold">Get the full picture</h2>
          <p className="mt-2 text-white/80 max-w-md mx-auto">
            Create a free account to see all {audit.issues.length} issues, AI-generated fixes, visual page previews, competitor analysis, and scheduled audits.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-emerald-700 hover:bg-white/90" onClick={() => setView("register")}>
              Create Free Account <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10" onClick={() => setView("login")}>
              Sign In
            </Button>
          </div>
          <p className="text-xs text-white/60 mt-4">No credit card required · 50 URLs free · Cancel anytime</p>
        </Card>
      </main>
    </div>
  );
}
