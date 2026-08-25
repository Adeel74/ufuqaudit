"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import { ViewHeader, StatCard, scoreColor } from "@/components/dashboard/shared";
import { ScoreRing } from "@/components/dashboard/score-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileSearch, Search, Eye, Download, ChevronRight, Loader2, Calendar,
  AlertOctagon, AlertTriangle, CheckCircle2, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AuditRow {
  id: string;
  url: string;
  user: string;
  userName: string;
  overallScore: number;
  status: string;
  scores: { technical: number; content: number; performance: number; aeo: number; geo: number; security: number };
  pagesCrawled: number;
  issuesCount: number;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  opportunityCount: number;
  summary: string | null;
  createdAt: string;
  pageUrls: string[];
}

export function AllAuditsView() {
  const { setView, setCurrentAudit } = useAppStore();
  const [audits, setAudits] = React.useState<AuditRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [scoreFilter, setScoreFilter] = React.useState("all");

  React.useEffect(() => {
    fetch("/api/all-audits")
      .then((r) => r.json())
      .then((d) => { setAudits(d.audits || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = audits.filter((a) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!a.url.toLowerCase().includes(q) && !a.user.toLowerCase().includes(q) && !a.userName.toLowerCase().includes(q)) return false;
    }
    if (scoreFilter === "high" && a.overallScore < 80) return false;
    if (scoreFilter === "medium" && (a.overallScore < 60 || a.overallScore >= 80)) return false;
    if (scoreFilter === "low" && a.overallScore >= 60) return false;
    return true;
  });

  const loadAudit = async (id: string) => {
    toast.info("Loading audit…");
    try {
      const res = await fetch(`/api/audit/get?id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setCurrentAudit(data);
      setView("complete-report");
      toast.success("Audit loaded");
    } catch (e: any) {
      toast.error(e?.message || "Failed to load audit");
    }
  };

  const totalScore = audits.length ? Math.round(audits.reduce((s, a) => s + a.overallScore, 0) / audits.length) : 0;

  return (
    <div className="space-y-6">
      <ViewHeader
        title="All Audits"
        subtitle="Complete audit history across all your projects"
        icon={FileSearch}
        actions={
          <Button variant="outline" size="sm" onClick={() => setView("landing")}>
            <Search className="w-3.5 h-3.5 mr-1" /> New Audit
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Audits" value={audits.length} icon={FileSearch} color="#6366f1" />
        <StatCard label="Avg Score" value={totalScore} icon={CheckCircle2} color="#10b981" />
        <StatCard label="Total Issues" value={audits.reduce((s, a) => s + a.issuesCount, 0)} icon={AlertTriangle} color="#f59e0b" />
        <StatCard label="Critical Issues" value={audits.reduce((s, a) => s + a.criticalCount, 0)} icon={AlertOctagon} color="#ef4444" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by URL or user..." className="pl-9 h-9" />
        </div>
        <Select value={scoreFilter} onValueChange={setScoreFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scores</SelectItem>
            <SelectItem value="high">High (80+)</SelectItem>
            <SelectItem value="medium">Medium (60-79)</SelectItem>
            <SelectItem value="low">Low (&lt;60)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Audits table */}
      <Card className="p-0 overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="min-w-[200px]">URL</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Critical</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No audits found</TableCell></TableRow>
                ) : (
                  filtered.map((a) => (
                    <TableRow key={a.id} className="cursor-pointer hover:bg-accent/40" onClick={() => loadAudit(a.id)}>
                      <TableCell>
                        <div className="font-medium text-sm truncate max-w-[200px]" title={a.url}>{a.url.replace(/^https?:\/\//, "")}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{a.summary || a.id}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-lg font-bold" style={{ color: scoreColor(a.overallScore) }}>{a.overallScore}</span>
                      </TableCell>
                      <TableCell className="text-sm">{a.pagesCrawled}</TableCell>
                      <TableCell className="text-sm">{a.issuesCount}</TableCell>
                      <TableCell>
                        {a.criticalCount > 0 ? (
                          <Badge variant="outline" className="text-red-600 bg-red-50 dark:bg-red-950/30">{a.criticalCount}</Badge>
                        ) : <span className="text-xs text-muted-foreground">0</span>}
                      </TableCell>
                      <TableCell className="text-sm truncate max-w-[120px]" title={a.user}>{a.userName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="h-7">
                          <Eye className="w-3.5 h-3.5" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}

// Complete Report view — single-page full audit report
export function CompleteReportView() {
  const { currentAudit, setView } = useAppStore();

  if (!currentAudit) {
    return (
      <div className="space-y-6">
        <ViewHeader title="Complete Report" subtitle="Full audit report" icon={FileSearch} />
        <Card className="p-10 text-center">
          <FileSearch className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No audit loaded. Select an audit from the All Audits page.</p>
          <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setView("all-audits")}>Browse Audits</Button>
        </Card>
      </div>
    );
  }

  const audit = currentAudit;
  const cats = [
    { key: "technical" as const, label: "Technical SEO", color: "#6366f1" },
    { key: "content" as const, label: "Content SEO", color: "#10b981" },
    { key: "performance" as const, label: "Performance", color: "#f59e0b" },
    { key: "aeo" as const, label: "AEO", color: "#8b5cf6" },
    { key: "geo" as const, label: "GEO / AI Visibility", color: "#ec4899" },
    { key: "security" as const, label: "Security", color: "#06b6d4" },
  ];

  const issueGroups = {
    critical: audit.issues.filter((i) => i.severity === "critical"),
    error: audit.issues.filter((i) => i.severity === "error"),
    warning: audit.issues.filter((i) => i.severity === "warning"),
    opportunity: audit.issues.filter((i) => i.severity === "opportunity"),
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Complete Audit Report"
        subtitle={audit.url}
        icon={FileSearch}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setView("all-audits")}>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> All Audits
            </Button>
            <Button size="sm" onClick={() => setView("dashboard")}>
              Dashboard <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        }
      />

      {/* Score hero */}
      <Card className="p-6 sm:p-8">
        <div className="grid lg:grid-cols-3 gap-6 items-center">
          <div className="flex flex-col items-center text-center">
            <ScoreRing value={audit.overallScore} size={150} label="Ufuq Score" sublabel="/ 100" />
          </div>
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-2">Audit Summary</h2>
            {audit.summary && <p className="text-sm text-muted-foreground leading-relaxed mb-4">{audit.summary}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Critical", count: audit.counts.critical, color: "#ef4444", icon: AlertOctagon },
                { label: "Errors", count: audit.counts.error, color: "#f97316", icon: AlertTriangle },
                { label: "Warnings", count: audit.counts.warning, color: "#f59e0b", icon: AlertTriangle },
                { label: "Opportunities", count: audit.counts.opportunity, color: "#10b981", icon: CheckCircle2 },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border p-3 text-center">
                  <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
                  <div className="text-xl font-bold" style={{ color: s.color }}>{s.count}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              {audit.pagesCrawled} pages crawled · {audit.issues.length} total issues
            </div>
          </div>
        </div>
      </Card>

      {/* Category scores */}
      <Card className="p-5">
        <h3 className="font-semibold mb-4">Category Scores</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cats.map((c) => {
            const v = (audit.scores as any)[c.key] as number;
            return (
              <button
                key={c.key}
                onClick={() => setView(c.key === "security" ? "security" : c.key === "aeo" ? "aeo" : c.key === "geo" ? "geo" : c.key === "performance" ? "performance" : "issues")}
                className="rounded-lg border bg-card p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">{c.label}</span>
                  <span className="text-lg font-bold" style={{ color: c.color }}>{v}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: c.color }} />
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Issues by severity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {Object.entries(issueGroups).map(([severity, issues]) => {
          const meta = {
            critical: { label: "Critical Issues", color: "#ef4444", icon: AlertOctagon },
            error: { label: "Errors", color: "#f97316", icon: AlertTriangle },
            warning: { label: "Warnings", color: "#f59e0b", icon: AlertTriangle },
            opportunity: { label: "Opportunities", color: "#10b981", icon: CheckCircle2 },
          }[severity] || { label: severity, color: "#64748b", icon: AlertTriangle };

          return (
            <Card key={severity} className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <meta.icon className="w-4 h-4" style={{ color: meta.color }} />
                {meta.label} ({issues.length})
              </h3>
              {issues.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No {meta.label.toLowerCase()} found</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
                  {issues.map((issue, i) => (
                    <div key={i} className="rounded-lg border p-2.5 hover:bg-muted/30 transition-colors">
                      <div className="text-sm font-medium">{issue.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{issue.description}</div>
                      {issue.recommendation && (
                        <div className="text-xs mt-1 p-1.5 rounded bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
                          <strong>Fix:</strong> {issue.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* AI Action Plan */}
      {audit.aiActionPlan.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-violet-500" /> AI Action Plan
          </h3>
          <ol className="space-y-2.5">
            {audit.aiActionPlan.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-sm leading-relaxed">{p}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Quick navigation */}
      <Card className="p-5">
        <h3 className="font-semibold mb-4">Explore Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Issues", view: "issues" },
            { label: "Pages", view: "pages" },
            { label: "Visual Preview", view: "visual-preview" },
            { label: "Link Graph", view: "link-graph" },
            { label: "Page Editor", view: "page-editor" },
            { label: "AI Chat", view: "ai-chat" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setView(item.view as any)}
              className="rounded-lg border p-3 text-center hover:bg-muted/30 transition-colors"
            >
              <div className="text-sm font-medium">{item.label}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Need to import Sparkles
import { Sparkles } from "lucide-react";
