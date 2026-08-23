"use client";

import * as React from "react";
import {
  useAudit, ViewHeader, EmptyAudit, SeverityBadge, CategoryChip,
} from "@/components/dashboard/shared";
import type { AuditResult, IssueData, Category } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Sparkles, Wand2, Loader2, Copy, Check, ChevronDown, ChevronRight,
  AlertOctagon, CheckCircle2,
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

function genKey(issue: IssueData): string {
  return `${issue.issueType}|${issue.title}|${issue.pageUrl ?? ""}`;
}

interface CacheEntry {
  loading: boolean;
  suggestion?: string;
  model?: string;
  error?: string;
}

interface IssueTypeGroup {
  type: string;
  issues: IssueData[];
  representative: IssueData;
}

interface CategoryGroup {
  cat: Category;
  types: IssueTypeGroup[];
}

export function AiRecommendationsView() {
  const audit = useAudit();
  const [cache, setCache] = React.useState<Record<string, CacheEntry>>({});
  const [openKey, setOpenKey] = React.useState<string | null>(null);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = React.useState(false);
  const [bulkProgress, setBulkProgress] = React.useState({
    current: 0,
    total: 0,
  });

  if (!audit) return <EmptyAudit msg="Run an audit to see AI recommendations." />;

  // Capture narrowed type so async closures keep the non-null type.
  const a = audit;

  const issues: (IssueData & { _id: string })[] = a.issues.map((it, i) => ({
    ...it,
    _id: it.id || `issue-${i}`,
  }));

  // Group by category, then by issueType
  const groups: CategoryGroup[] = ALL_CATEGORIES.map((cat) => {
    const inCat = issues.filter((i) => i.category === cat);
    if (inCat.length === 0) return null;
    const byType = new Map<string, IssueData[]>();
    for (const issue of inCat) {
      const arr = byType.get(issue.issueType) ?? [];
      arr.push(issue);
      byType.set(issue.issueType, arr);
    }
    const types: IssueTypeGroup[] = [...byType.entries()].map(
      ([type, issueList]) => ({
        type,
        issues: issueList,
        representative: issueList[0],
      }),
    );
    return { cat, types };
  }).filter((g): g is CategoryGroup => g !== null);

  async function generateOne(issue: IssueData): Promise<CacheEntry> {
    const key = genKey(issue);
    const existing = cache[key];
    if (existing?.suggestion) {
      // Already cached — just open
      setOpenKey(openKey === key ? null : key);
      return existing;
    }
    if (existing?.loading) return existing;

    setCache((s) => ({ ...s, [key]: { loading: true } }));
    setOpenKey(key);

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
      const entry: CacheEntry = {
        loading: false,
        suggestion: data.suggestion as string,
        model: data.model as string | undefined,
      };
      setCache((s) => ({ ...s, [key]: entry }));
      return entry;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "AI failed";
      const entry: CacheEntry = { loading: false, error: msg };
      setCache((s) => ({ ...s, [key]: entry }));
      return entry;
    }
  }

  async function generateAllCritical() {
    const critical = issues.filter((i) => i.severity === "critical");
    if (critical.length === 0) {
      toast.info("No critical issues found — great work!");
      return;
    }
    setBulkRunning(true);
    setBulkProgress({ current: 0, total: critical.length });
    toast.info(`Generating fixes for ${critical.length} critical issues…`);
    let success = 0;
    for (let i = 0; i < critical.length; i++) {
      const issue = critical[i];
      // Skip if already cached
      const key = genKey(issue);
      if (!cache[key]?.suggestion) {
        await generateOne(issue);
      } else {
        // Still ensure it's expanded
        setOpenKey(key);
      }
      success++;
      setBulkProgress({ current: i + 1, total: critical.length });
    }
    setBulkRunning(false);
    toast.success(`Generated ${success} critical fixes`);
  }

  async function copySuggestion(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedKey((c) => (c === key ? null : c)), 1500);
    } catch {
      toast.error("Copy failed");
    }
  }

  const criticalCount = audit.counts.critical;
  const bulkPct = bulkProgress.total
    ? Math.round((bulkProgress.current / bulkProgress.total) * 100)
    : 0;

  if (issues.length === 0) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="AI Recommendations"
          subtitle="Generate copy-paste fixes for every issue"
          icon={Sparkles}
        />
        <Card className="p-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-lg">No issues to fix</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Your audit didn&apos;t find any issues. Run a deeper crawl or come
            back after your next audit.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="AI Recommendations"
        subtitle="Generate copy-paste fixes for every issue"
        icon={Sparkles}
        actions={
          <Button
            onClick={generateAllCritical}
            disabled={bulkRunning || criticalCount === 0}
            size="sm"
          >
            {bulkRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Wand2 className="w-3.5 h-3.5" />
            )}
            Generate all critical fixes
            {criticalCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
                {criticalCount}
              </span>
            )}
          </Button>
        }
      />

      {/* Intro card */}
      <Card className="p-5 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-background border-emerald-500/20">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">
              Ready-to-paste AI fixes
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              UfuqAudit&apos;s AI generates ready-to-paste fixes — meta tags,
              H1, JSON-LD schema, FAQ, alt text, robots.txt snippets — based on
              your actual audit findings. Click <strong>Generate</strong> on
              any issue type, or run all critical fixes at once.
            </p>
          </div>
        </div>
        {bulkRunning && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>
                Generating {bulkProgress.current} of {bulkProgress.total}…
              </span>
              <span className="font-medium tabular-nums">{bulkPct}%</span>
            </div>
            <Progress value={bulkPct} className="h-1.5" />
          </div>
        )}
      </Card>

      {/* Issue type list grouped by category */}
      <div className={cn(SCROLLBAR_CLS, "space-y-6")}>
        {groups.map((group) => {
          const meta = CATEGORY_META[group.cat];
          return (
            <div key={group.cat}>
              {/* Section header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <CategoryChip category={group.cat} />
                <span className="text-xs text-muted-foreground">
                  {group.types.length} issue
                  {group.types.length === 1 ? "" : " types"} ·{" "}
                  {group.types.reduce((s, t) => s + t.issues.length, 0)} pages
                  affected
                </span>
                <div
                  className="ml-auto h-px flex-1 ml-3"
                  style={{ backgroundColor: `${meta.color}20` }}
                />
              </div>

              <div className="space-y-2.5">
                {group.types.map((t) => {
                  const key = genKey(t.representative);
                  const entry = cache[key];
                  const isOpen = openKey === key;
                  return (
                    <Card key={group.cat + ":" + t.type} className="p-0 overflow-hidden">
                      <div className="flex items-start gap-3 p-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <SeverityBadge
                              severity={t.representative.severity}
                            />
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs font-semibold tabular-nums">
                              ×{t.issues.length}
                            </span>
                          </div>
                          <div className="font-medium text-sm leading-snug">
                            {t.representative.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {t.representative.description}
                          </div>
                          {t.representative.pageUrl && (
                            <div className="text-[11px] text-muted-foreground/80 mt-1 truncate max-w-[400px]">
                              {t.representative.pageUrl}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={entry?.suggestion ? "outline" : "default"}
                          onClick={() => generateOne(t.representative)}
                          disabled={entry?.loading}
                          className="shrink-0"
                        >
                          {entry?.loading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : entry?.suggestion ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          {entry?.suggestion ? "View" : "Generate"}
                        </Button>
                      </div>

                      {isOpen && entry?.suggestion && (
                        <div className="px-4 pb-4 pt-2 border-t bg-muted/20">
                          <div className="rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                            <div className="flex items-center justify-between mb-2 gap-2">
                              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                AI Recommendation
                                {entry.model && (
                                  <span className="text-[10px] text-muted-foreground font-normal">
                                    · {entry.model}
                                  </span>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  copySuggestion(entry.suggestion!, key)
                                }
                              >
                                {copiedKey === key ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                {copiedKey === key ? "Copied" : "Copy"}
                              </Button>
                            </div>
                            <pre className="text-xs whitespace-pre-wrap break-words font-mono leading-relaxed text-foreground/90">
                              {entry.suggestion}
                            </pre>
                          </div>
                        </div>
                      )}

                      {isOpen && entry?.error && (
                        <div className="px-4 pb-4 pt-2 border-t bg-red-50/40 dark:bg-red-950/10 text-xs text-red-700 dark:text-red-400">
                          {entry.error}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
