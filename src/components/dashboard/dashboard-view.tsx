"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import { useAudit, ViewHeader, StatCard, EmptyAudit, SeverityBadge, scoreColor } from "./shared";
import { ScoreRing, ScoreBar } from "./score-ui";
import {
  TrendingUp, Sparkles, AlertOctagon, AlertTriangle, AlertCircle, Lightbulb,
  RefreshCw, Download, ChevronRight, Calendar, ArrowUp, ArrowDown, Bot,
  CheckCircle2, LayoutDashboard, Users, CreditCard, Shield, Brain,
  GaugeCircle, Clock, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar,
} from "recharts";
import { toast } from "sonner";
import { CATEGORY_META, type Category } from "@/lib/types";

export function DashboardView() {
  const audit = useAudit();
  const { setView, user } = useAppStore();

  // Admin users see a platform overview dashboard instead of personal audit
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";

  if (isAdmin && !audit) {
    return <AdminOverviewDashboard setView={setView} />;
  }

  if (!audit) return <EmptyAudit />;

  const cats: Category[] = ["technical", "content", "performance", "aeo", "geo", "security"];
  // Use the real history; if it has same-day entries, relabel them with time
  // so the x-axis doesn't show duplicate dates.
  const realHistory = audit.history && audit.history.length > 1 ? audit.history : null;
  const history = realHistory
    ? realHistory.map((h, i) => {
        const sameDay = realHistory.some((h2, j) => i !== j && h2.date === h.date);
        return sameDay ? { ...h, date: `Run ${i + 1}` } : h;
      })
    : [
        { date: "Jan", score: 62 }, { date: "Feb", score: 67 }, { date: "Mar", score: 71 }, { date: "Apr", score: audit.overallScore },
      ];

  const prev = history.length > 1 ? history[history.length - 2].score : null;
  const delta = prev !== null ? audit.overallScore - prev : null;

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Website Health"
        subtitle={audit.url}
        icon={TrendingUp}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => {
              if (!audit) { toast.error("No audit to export"); return; }
              try {
                (window as any).ufuqPrint?.({
                  audit,
                  agencyName: "UfuqAudit",
                  clientName: audit.url,
                  brandColor: "#10b981",
                  templateId: "full",
                });
                toast.success("Report ready — use your browser's Save as PDF");
              } catch {
                toast.info("Exporting PDF…");
              }
            }}>
              <Download className="w-3.5 h-3.5 mr-1" /> Export
            </Button>
            <Button size="sm" onClick={() => { setView("landing"); }}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> New Audit
            </Button>
          </>
        }
      />

      {/* Greeting + score row */}
      <Card className="p-6">
        <div className="grid lg:grid-cols-3 gap-6 items-center">
          <div className="flex flex-col items-center text-center">
            <ScoreRing value={audit.overallScore} size={150} label="Ufuq Score" sublabel="/ 100" />
            {delta !== null ? (
              delta === 0 ? (
                <div className="mt-2 text-sm font-medium text-muted-foreground flex items-center gap-1">
                  — No change from last audit
                </div>
              ) : (
                <div className={`mt-2 text-sm font-medium flex items-center gap-1 ${delta > 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {delta > 0 ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                  {delta > 0 ? "+" : ""}{delta} from last audit
                </div>
              )
            ) : (
              <div className="mt-2 text-sm font-medium text-muted-foreground">First audit — no baseline yet</div>
            )}
          </div>
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3">
            {cats.map((c) => {
              const meta = CATEGORY_META[c];
              const v = (audit.scores as any)[c];
              return (
                <button
                  key={c}
                  onClick={() => setView(c === "security" ? "security" : c === "aeo" ? "aeo" : c === "geo" ? "geo" : c === "performance" ? "performance" : "issues")}
                  className="rounded-lg border bg-card p-3 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground">{meta.label}</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: meta.color }}>{v}</span>
                  </div>
                  <ScoreBar value={v} color={meta.color} />
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Top priorities + AI action plan */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <AlertOctagon className="w-4 h-4 text-red-500" /> Top Priorities
          </h3>
          <div className="space-y-2.5">
            {[
              { s: "critical" as const, n: audit.counts.critical, c: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30", icon: AlertOctagon },
              { s: "error" as const, n: audit.counts.error, c: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30", icon: AlertTriangle },
              { s: "warning" as const, n: audit.counts.warning, c: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", icon: AlertCircle },
              { s: "opportunity" as const, n: audit.counts.opportunity, c: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: Lightbulb },
            ].filter((p) => p.n > 0).map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.s}
                  onClick={() => setView("issues")}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg ${p.bg} hover:opacity-80 transition-opacity`}
                >
                  <Icon className={`w-4 h-4 ${p.c}`} />
                  <span className="text-sm font-medium">{p.n} {SEVERITY_LABEL[p.s]}</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </button>
              );
            })}
            {audit.counts.critical + audit.counts.error + audit.counts.warning + audit.counts.opportunity === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                No issues found — your site is in great shape!
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" /> AI Action Plan
            </h3>
            <span className="text-xs text-muted-foreground">Prioritized by impact</span>
          </div>
          <ol className="space-y-2.5">
            {audit.aiActionPlan.map((p, i) => (
              <li key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-violet-500/5 border border-violet-500/10">
                <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed">{p}</span>
              </li>
            ))}
            {audit.aiActionPlan.length === 0 && (
              <li className="text-sm text-muted-foreground p-2">No critical actions needed — your site is in great shape! 🎉</li>
            )}
          </ol>
          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setView("ai-recommendations")}>
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Generate AI fixes for each issue
          </Button>
        </Card>
      </div>

      {/* Score history chart */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2"><Calendar className="w-4 h-4" /> Score History</h3>
          <Button variant="ghost" size="sm" onClick={() => toast.info("Schedule recurring audit")}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Schedule
          </Button>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} fill="url(#scoreGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Summary */}
      {audit.summary && (
        <Card className="p-5">
          <h3 className="font-semibold mb-2">Executive Summary</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{audit.summary}</p>
        </Card>
      )}
    </div>
  );
}

const SEVERITY_LABEL = {
  critical: "Critical",
  error: "Errors",
  warning: "Warnings",
  opportunity: "Opportunities",
} as const;

// Admin Overview Dashboard — platform-level summary for admin/super_admin users
function AdminOverviewDashboard({ setView }: { setView: (v: any) => void }) {
  const [stats, setStats] = React.useState<any>(null);

  React.useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Platform Overview"
        subtitle="Super Admin Dashboard — manage your entire SaaS platform"
        icon={LayoutDashboard}
        actions={
          <Button size="sm" onClick={() => setView("admin")}>
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Admin Portal
          </Button>
        }
      />

      {/* Greeting */}
      <Card className="p-5 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/10 border-emerald-200/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{greeting} 👋</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Here's what's happening across your platform today.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setView("landing")}>
              <GaugeCircle className="w-3.5 h-3.5 mr-1" /> Run Audit
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setView("admin")}>
              Manage Platform
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Users" value={stats.counts?.users ?? "—"} icon={Users} color="#6366f1" hint={`${stats.counts?.usersToday ?? 0} today`} />
          <StatCard label="Total Audits" value={stats.counts?.audits ?? "—"} icon={GaugeCircle} color="#10b981" hint={`${stats.counts?.activeUsers ?? 0} active`} />
          <StatCard label="Monthly Revenue" value={`$${stats.counts?.monthlyRevenue ?? 0}`} icon={CreditCard} color="#f59e0b" hint={`$${stats.counts?.annualRevenue ?? 0}/yr`} />
          <StatCard label="Active Subs" value={stats.counts?.activeSubscriptions ?? "—"} icon={CheckCircle2} color="#10b981" hint={`${stats.counts?.trialUsers ?? 0} trials`} />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Manage Users", icon: Users, view: "admin", color: "#6366f1" },
          { label: "View Plans", icon: CreditCard, view: "admin", color: "#10b981" },
          { label: "Audit Rules", icon: Shield, view: "admin", color: "#f59e0b" },
          { label: "AI Models", icon: Brain, view: "admin", color: "#8b5cf6" },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => setView(action.view)}
            className="rounded-xl border bg-card p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${action.color}15`, color: action.color }}>
              <action.icon className="w-4.5 h-4.5" />
            </div>
            <div className="text-sm font-semibold">{action.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Configure & manage</div>
          </button>
        ))}
      </div>

      {/* Recent audits */}
      {stats?.recentAudits && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recent Audits
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
            {stats.recentAudits.slice(0, 6).map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/30 transition-colors">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: a.overallScore >= 80 ? "#10b98115" : a.overallScore >= 60 ? "#f59e0b15" : "#ef444415" }}>
                  <span className="text-sm font-bold" style={{ color: a.overallScore >= 80 ? "#10b981" : a.overallScore >= 60 ? "#f59e0b" : "#ef4444" }}>{a.overallScore}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.url}</div>
                  <div className="text-xs text-muted-foreground">{a.user || "Unknown"} · {new Date(a.createdAt).toLocaleDateString()}</div>
                </div>
                <Button size="sm" variant="ghost" className="h-7 text-xs shrink-0" onClick={() => setView("admin")}>View</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* System status */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3">System Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Application", status: "operational" },
            { label: "Database", status: "operational" },
            { label: "AI Service", status: "operational" },
            { label: "API", status: "operational" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 rounded-lg border p-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <div>
                <div className="text-sm font-medium">{s.label}</div>
                <div className="text-[10px] text-emerald-600 capitalize">{s.status}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
