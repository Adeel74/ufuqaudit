"use client";

import * as React from "react";
import {
  useAudit, ViewHeader, EmptyAudit, StatCard, SeverityBadge, CategoryChip,
} from "@/components/dashboard/shared";
import type { AuditResult, IssueData, Severity, Category } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ListChecks, Search, Filter, ChevronDown, ChevronRight, Copy, Check,
  Loader2, Sparkles, Link as LinkIcon,
  AlertOctagon, AlertTriangle, AlertCircle, Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SCROLLBAR_CLS =
  "max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent pr-1";

const ALL_CATEGORIES: Category[] = [
  "technical", "content", "performance", "aeo", "geo", "security",
  "on_page", "internal_links", "schema",
];

function brandFromUrl(url: string): string | undefined {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const seg = host.split(".")[0];
    return seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : undefined;
  } catch {
    return undefined;
  }
}

function pageTitleForIssue(audit: AuditResult, issue: IssueData): string | undefined {
  if (issue.pageUrl) {
    const p = audit.pages.find((pg) => pg.url === issue.pageUrl);
    if (p?.title) return p.title;
    if (p?.h1) return p.h1;
    try {
      const u = new URL(issue.pageUrl);
      const seg = u.pathname.split("/").filter(Boolean).pop();
      if (seg) {
        return decodeURIComponent(seg)
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

interface AiState {
  loading: boolean;
  suggestion?: string;
  model?: string;
  error?: string;
}

export function IssuesView() {
  const audit = useAudit();
  const [search, setSearch] = React.useState("");
  const [severity, setSeverity] = React.useState<"all" | Severity>("all");
  const [category, setCategory] = React.useState<"all" | Category>("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [aiByIssue, setAiByIssue] = React.useState<Record<string, AiState>>({});
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!audit) return <EmptyAudit msg="Run an audit to see issues." />;

  // Capture narrowed type so async closures keep the non-null type.
  const a = audit;

  // Assign stable IDs to issues (in case the backend didn't supply one).
  const issues: (IssueData & { _id: string })[] = a.issues.map((it, i) => ({
    ...it,
    _id: it.id || `issue-${i}`,
  }));

  const filtered = issues.filter((it) => {
    if (severity !== "all" && it.severity !== severity) return false;
    if (category !== "all" && it.category !== category) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (
        !it.title.toLowerCase().includes(q) &&
        !it.description.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  async function generateAi(issue: IssueData & { _id: string }) {
    const id = issue._id;
    if (aiByIssue[id]?.suggestion || aiByIssue[id]?.loading) return;
    setAiByIssue((s) => ({ ...s, [id]: { loading: true } }));
    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueType: issue.issueType,
          issueTitle: issue.title,
          pageUrl: issue.pageUrl,
          pageTitle: pageTitleForIssue(a, issue),
          brandName: brandFromUrl(a.url),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "AI request failed");
      }
      setAiByIssue((s) => ({
        ...s,
        [id]: {
          loading: false,
          suggestion: data.suggestion as string,
          model: data.model as string | undefined,
        },
      }));
      toast.success("AI fix generated");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "AI failed";
      setAiByIssue((s) => ({ ...s, [id]: { loading: false, error: msg } }));
      toast.error(msg);
    }
  }

  async function copySuggestion(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Issues"
        subtitle={`${filtered.length} of ${issues.length} issues · ${audit.url}`}
        icon={ListChecks}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info("Exporting issues as CSV…")
            }
          >
            <ChevronRight className="w-3.5 h-3.5" /> Export
          </Button>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Critical"
          value={audit.counts.critical}
          color="#dc2626"
          icon={AlertOctagon}
          hint="Needs immediate fix"
        />
        <StatCard
          label="Errors"
          value={audit.counts.error}
          color="#ea580c"
          icon={AlertTriangle}
          hint="Breaks UX or indexing"
        />
        <StatCard
          label="Warnings"
          value={audit.counts.warning}
          color="#d97706"
          icon={AlertCircle}
          hint="Should be improved"
        />
        <StatCard
          label="Opportunities"
          value={audit.counts.opportunity}
          color="#059669"
          icon={Lightbulb}
          hint="Quick wins available"
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search issues by title or description…"
              className="pl-9"
            />
          </div>
          <Select
            value={severity}
            onValueChange={(v) => setSeverity(v as "all" | Severity)}
          >
            <SelectTrigger className="w-full sm:w-44">
              <Filter className="w-3.5 h-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="opportunity">Opportunity</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as "all" | Category)}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {ALL_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_META[c].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Issue list */}
      <div className={cn(SCROLLBAR_CLS, "space-y-3")}>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground">
            No issues match your filters.
          </div>
        ) : (
          filtered.map((it) => {
            const isOpen = expandedId === it._id;
            const ai = aiByIssue[it._id];
            return (
              <Card key={it._id} className="p-0 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : it._id)}
                  className="w-full text-left p-4 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <SeverityBadge severity={it.severity} />
                        <CategoryChip category={it.category} />
                        <ImpactBadge impact={it.impact} />
                      </div>
                      <div className="font-medium text-sm leading-snug">
                        {it.title}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {it.description}
                      </div>
                      {it.pageUrl && (
                        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                          <LinkIcon className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[320px]">
                            {it.pageUrl}
                          </span>
                        </div>
                      )}
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground mt-1" />
                    ) : (
                      <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground mt-1" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-3 space-y-4 border-t bg-muted/20">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Why it matters
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {it.description}
                      </p>
                    </div>
                    {it.recommendation && (
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          How to fix
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {it.recommendation}
                        </p>
                      </div>
                    )}
                    <div className="pt-1">
                      <Button
                        size="sm"
                        onClick={() => generateAi(it)}
                        disabled={ai?.loading}
                      >
                        {ai?.loading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        Generate AI Fix
                      </Button>
                      {ai?.error && (
                        <div className="text-xs text-red-600 mt-2">
                          {ai.error}
                        </div>
                      )}
                      {ai?.suggestion && (
                        <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              AI Recommendation
                              {ai.model && (
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  · {ai.model}
                                </span>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                copySuggestion(ai.suggestion!, it._id)
                              }
                            >
                              {copiedId === it._id ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              {copiedId === it._id ? "Copied" : "Copy"}
                            </Button>
                          </div>
                          <pre className="text-xs whitespace-pre-wrap break-words font-mono leading-relaxed text-foreground/90">
                            {ai.suggestion}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function ImpactBadge({ impact }: { impact: "high" | "medium" | "low" }) {
  const styles: Record<string, string> = {
    high: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    low: "bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide",
        styles[impact],
      )}
    >
      {impact} impact
    </span>
  );
}
