"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import {
  GaugeCircle, Search, Globe, ShieldCheck, Brain, Gauge, Bot,
  FileText, CheckCircle2, AlertOctagon,
} from "lucide-react";
import { ScoreRing } from "@/components/dashboard/score-ui";

const STEPS = [
  { id: "crawl", label: "Crawling pages", icon: Globe, c: "#6366f1" },
  { id: "technical", label: "Technical SEO checks", icon: GaugeCircle, c: "#6366f1" },
  { id: "content", label: "Content analysis", icon: FileText, c: "#10b981" },
  { id: "performance", label: "Performance metrics", icon: Gauge, c: "#f59e0b" },
  { id: "aeo", label: "AEO answer readiness", icon: Brain, c: "#8b5cf6" },
  { id: "geo", label: "GEO / AI visibility", icon: Bot, c: "#ec4899" },
  { id: "security", label: "Security headers", icon: ShieldCheck, c: "#06b6d4" },
  { id: "score", label: "Computing Ufuq Score", icon: CheckCircle2, c: "#10b981" },
];

export function AuditProgressView() {
  const { currentAudit, setView } = useAppStore();
  const [step, setStep] = React.useState(0);
  const [score, setScore] = React.useState(0);

  React.useEffect(() => {
    const iv = setInterval(() => {
      setStep((s) => Math.min(STEPS.length - 1, s + 1));
    }, 650);
    return () => clearInterval(iv);
  }, []);

  React.useEffect(() => {
    const target = currentAudit?.overallScore || 72;
    const iv = setInterval(() => {
      setScore((s) => {
        if (s >= target) { clearInterval(iv); return target; }
        return s + Math.max(1, Math.floor((target - s) / 6));
      });
    }, 80);
    return () => clearInterval(iv);
  }, [currentAudit?.overallScore]);

  // When audit becomes ready, auto-jump after a beat
  React.useEffect(() => {
    if (currentAudit && step >= STEPS.length - 1 && score >= (currentAudit.overallScore - 1)) {
      const t = setTimeout(() => setView("dashboard"), 900);
      return () => clearTimeout(t);
    }
  }, [currentAudit, step, score, setView]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 via-teal-50/30 to-background dark:from-emerald-950/20 dark:to-background" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-teal-400/20 blur-3xl" />

      <div className="relative w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white mb-4">
            <GaugeCircle className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Auditing your website…</h1>
          <p className="mt-2 text-sm text-muted-foreground" suppressHydrationWarning>
            {currentAudit?.url ? `Scanning ${currentAudit.url}` : "Crawling pages, running checks, scoring engines"}
          </p>
        </div>

        {/* Score ring */}
        <div className="flex justify-center mb-8">
          <ScoreRing value={score} size={160} stroke={14} label="Ufuq Score" />
        </div>

        {/* Steps */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            {STEPS.map((s, idx) => {
              const state = idx < step ? "done" : idx === step ? "active" : "pending";
              return (
                <div key={s.id} className={`flex items-center gap-3 p-2 rounded-md transition-all ${state === "active" ? "bg-emerald-500/5" : ""}`}>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      state === "done" ? "bg-emerald-500 text-white" :
                      state === "active" ? "border-2 border-emerald-500 text-emerald-500" :
                      "bg-muted text-muted-foreground"
                    }`}
                  >
                    {state === "done" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : state === "active" ? (
                      <span className="w-2.5 h-2.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <s.icon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className={`text-sm ${state === "pending" ? "text-muted-foreground" : "font-medium"}`}>{s.label}</span>
                  {state === "done" && <span className="ml-auto text-xs text-emerald-600 font-medium">✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tip */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <AlertOctagon className="w-3.5 h-3.5 inline mr-1" />
          We're checking 200+ signals across 6 engines. This usually takes 8–12 seconds.
        </div>
      </div>
    </div>
  );
}
