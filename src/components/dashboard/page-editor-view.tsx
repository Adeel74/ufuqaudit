"use client";

import * as React from "react";
import {
  useAudit, ViewHeader, EmptyAudit,
} from "@/components/dashboard/shared";
import { useAppStore } from "@/lib/store";
import type { PageData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileEdit, Search, Sparkles, Loader2, Save, RotateCcw,
  Globe, AlertCircle, ExternalLink, Image as ImageIcon,
  CheckCircle2, AlertTriangle, XCircle, FileText, Hash,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------- Types ----------
type AiIssueType =
  | "missing_title"
  | "title_too_long"
  | "missing_meta_description"
  | "desc_too_long"
  | "missing_h1";

interface PageEditState {
  title: string;
  metaDescription: string;
  h1: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
}

interface AiRecommendResponse {
  suggestion: string;
  model?: string;
}

interface AiRecommendError {
  error?: string;
}

// ---------- Constants ----------
const EMERALD_BTN = "bg-emerald-600 hover:bg-emerald-700 text-white";

const SCROLLBAR_CLS =
  "max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent";

// Title length buckets
function titleCounterCls(n: number): string {
  if (n === 0) return "text-muted-foreground";
  if (n >= 30 && n <= 60) return "text-emerald-600 dark:text-emerald-400";
  if (n > 70) return "text-red-600 dark:text-red-400";
  return "text-amber-600 dark:text-amber-400";
}

// Description length buckets
function descCounterCls(n: number): string {
  if (n === 0) return "text-muted-foreground";
  if (n >= 120 && n <= 160) return "text-emerald-600 dark:text-emerald-400";
  if (n > 170) return "text-red-600 dark:text-red-400";
  return "text-amber-600 dark:text-amber-400";
}

// ---------- Helpers ----------
function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

function truncateUrl(u: string, n = 36): string {
  const stripped = u.replace(/^https?:\/\//, "");
  if (stripped.length <= n) return stripped;
  return stripped.slice(0, n - 1) + "…";
}

function pagePath(u: string): string {
  try {
    const url = new URL(u);
    const host = url.hostname.replace(/^www\./, "");
    const path = url.pathname === "/" ? "" : url.pathname;
    return `${host}${path}`;
  } catch {
    return u;
  }
}

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

function fromPage(p: PageData): PageEditState {
  return {
    title: p.title ?? "",
    metaDescription: p.metaDescription ?? "",
    h1: p.h1 ?? "",
    canonical: p.url, // default canonical = page URL when none provided
    ogTitle: p.title ?? "",
    ogDescription: p.metaDescription ?? "",
  };
}

// Compute a live SEO score (0–100) based on the edited values.
function computeSeoScore(s: PageEditState): { score: number; label: "Good" | "Needs work" | "Poor"; color: string } {
  let score = 0;

  // Title: up to 25 points
  const tLen = s.title.length;
  if (tLen >= 30 && tLen <= 60) score += 25;
  else if (tLen > 0 && tLen < 30) score += 12;
  else if (tLen > 60 && tLen <= 70) score += 12;
  else if (tLen > 70) score += 4;

  // Description: up to 25 points
  const dLen = s.metaDescription.length;
  if (dLen >= 120 && dLen <= 160) score += 25;
  else if (dLen > 0 && dLen < 120) score += 12;
  else if (dLen > 160 && dLen <= 170) score += 12;
  else if (dLen > 170) score += 4;

  // H1: up to 25 points
  if (s.h1.trim().length > 0) score += 25;

  // Canonical: up to 25 points
  if (s.canonical.trim().length > 0) {
    try {
      new URL(s.canonical);
      score += 25;
    } catch {
      score += 10; // present but not a URL
    }
  }

  const label: "Good" | "Needs work" | "Poor" =
    score >= 80 ? "Good" : score >= 50 ? "Needs work" : "Poor";
  const color =
    score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  return { score, label, color };
}

// Decide whether to show the "Generate with AI" button on a given field,
// and which issueType to send.
function titleIssue(s: PageEditState): AiIssueType | null {
  if (s.title.trim().length === 0) return "missing_title";
  if (s.title.length > 60) return "title_too_long";
  return null;
}

function descIssue(s: PageEditState): AiIssueType | null {
  if (s.metaDescription.trim().length === 0) return "missing_meta_description";
  if (s.metaDescription.length > 160) return "desc_too_long";
  return null;
}

function h1Issue(s: PageEditState): AiIssueType | null {
  if (s.h1.trim().length === 0) return "missing_h1";
  return null;
}

// =================== Component ===================
export function PageEditorView() {
  const audit = useAudit();
  const setView = useAppStore((s) => s.setView);

  const pages: PageData[] = audit?.pages ?? [];

  const [search, setSearch] = React.useState("");
  const [selectedUrl, setSelectedUrl] = React.useState<string | null>(
    pages[0]?.url ?? null,
  );
  const [draft, setDraft] = React.useState<PageEditState | null>(null);
  const [original, setOriginal] = React.useState<PageEditState | null>(null);

  // Per-field AI loading flags
  const [loadingField, setLoadingField] = React.useState<
    null | "title" | "metaDescription" | "h1"
  >(null);

  // Reselect first page when audit changes
  React.useEffect(() => {
    if (pages.length > 0) {
      const stillExists = pages.some((p) => p.url === selectedUrl);
      if (!stillExists) setSelectedUrl(pages[0].url);
    } else {
      setSelectedUrl(null);
    }
  }, [audit?.id]);

  // Load selected page into draft
  React.useEffect(() => {
    if (!audit) return;
    const page = pages.find((p) => p.url === selectedUrl);
    if (page) {
      const st = fromPage(page);
      setDraft(st);
      setOriginal(st);
    } else {
      setDraft(null);
      setOriginal(null);
    }
  }, [selectedUrl, audit?.id]);

  if (!audit) return <EmptyAudit msg="Run an audit to edit your pages." />;

  if (pages.length === 0) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="Page Editor"
          subtitle="Edit on-page SEO with live preview"
          icon={FileEdit}
        />
        <Card className="p-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
            <FileText className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No pages were crawled in this audit.
          </p>
        </Card>
      </div>
    );
  }

  const filtered = pages.filter((p) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      p.url.toLowerCase().includes(q) ||
      (p.title ?? "").toLowerCase().includes(q) ||
      (p.h1 ?? "").toLowerCase().includes(q)
    );
  });

  const selectedPage = pages.find((p) => p.url === selectedUrl) ?? null;
  const brand = brandFromUrl(audit.url);

  const isDirty =
    draft && original
      ? JSON.stringify(draft) !== JSON.stringify(original)
      : false;

  function update<K extends keyof PageEditState>(key: K, value: PageEditState[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function generateAi(
    field: "title" | "metaDescription" | "h1",
    issueType: AiIssueType,
  ) {
    if (!selectedPage || !draft) return;
    setLoadingField(field);
    try {
      const r = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueType,
          issueTitle:
            issueType === "missing_title"
              ? "Missing page title"
              : issueType === "title_too_long"
                ? "Page title is too long"
                : issueType === "missing_meta_description"
                  ? "Missing meta description"
                  : issueType === "desc_too_long"
                    ? "Meta description is too long"
                    : "Missing H1 heading",
          pageUrl: selectedPage.url,
          pageTitle: draft.title || selectedPage.title || undefined,
          brandName: brand,
        }),
      });
      const data = (await r.json().catch(() => ({}))) as
        | AiRecommendResponse
        | AiRecommendError;
      if (!r.ok) {
        throw new Error(
          ("error" in data && data.error) || `HTTP ${r.status}`,
        );
      }
      const suggestion = (data as AiRecommendResponse).suggestion;
      if (!suggestion) throw new Error("Empty AI response");
      update(field, suggestion);
      toast.success("AI suggestion applied", {
        description: `Generated via ${(data as AiRecommendResponse).model ?? "AI"}`,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "AI failed";
      toast.error(msg);
    } finally {
      setLoadingField(null);
    }
  }

  function onSave() {
    if (!draft) return;
    // Demo only — no real backend write.
    setOriginal(draft);
    toast.success("Changes saved (demo)", {
      description: "Edits are kept locally — connect a CMS to push live.",
    });
  }

  function onReset() {
    if (!original) return;
    setDraft(original);
    toast.info("Reverted to original values");
  }

  const score = draft ? computeSeoScore(draft) : null;

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Page Editor"
        subtitle="Edit on-page SEO with live preview"
        icon={FileEdit}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView("pages")}
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" /> Back to pages
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ---------- Left: Page selector ---------- */}
        <Card className="p-0 lg:col-span-1 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Pages</h3>
              <Badge variant="outline" className="text-[10px] font-mono">
                {filtered.length}/{pages.length}
              </Badge>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search URL or title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
          <div className={cn(SCROLLBAR_CLS, "flex-1 p-2")}>
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                <Search className="w-5 h-5 mx-auto mb-2 opacity-40" />
                No pages match
              </div>
            ) : (
              <ul className="space-y-1">
                {filtered.map((p) => {
                  const active = p.url === selectedUrl;
                  const hasIssues = (p.issuesCount ?? 0) > 0;
                  return (
                    <li key={p.url}>
                      <button
                        type="button"
                        onClick={() => setSelectedUrl(p.url)}
                        className={cn(
                          "w-full text-left rounded-lg px-2.5 py-2 transition-colors border border-transparent",
                          active
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900"
                            : "hover:bg-muted/60",
                        )}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {hasIssues && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"
                              aria-label="Has issues"
                            />
                          )}
                          <span
                            className={cn(
                              "text-xs truncate flex-1",
                              active
                                ? "text-emerald-700 dark:text-emerald-400 font-medium"
                                : "text-muted-foreground",
                            )}
                            title={p.url}
                          >
                            {truncateUrl(p.url, 30)}
                          </span>
                        </div>
                        <div className="text-xs mt-0.5 truncate text-foreground/80">
                          {p.title?.trim() || (
                            <span className="italic text-muted-foreground">
                              No title
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {typeof p.wordCount === "number" && (
                            <Badge
                              variant="outline"
                              className="text-[9px] h-4 px-1 font-normal gap-0.5"
                            >
                              <Hash className="w-2.5 h-2.5" />
                              {p.wordCount.toLocaleString()}
                            </Badge>
                          )}
                          {p.indexable === false && (
                            <Badge
                              variant="outline"
                              className="text-[9px] h-4 px-1 font-normal text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900"
                            >
                              noindex
                            </Badge>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        {/* ---------- Center: Editor form ---------- */}
        <div className="lg:col-span-2 space-y-4">
          {!draft || !selectedPage ? (
            <Card className="p-10 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                <FileEdit className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Select a page on the left to start editing.
              </p>
            </Card>
          ) : (
            <Card className="p-5 space-y-5">
              {/* Page context */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Editing</div>
                  <a
                    href={selectedPage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1.5 truncate"
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{truncateUrl(selectedPage.url, 50)}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                  </a>
                </div>
                {isDirty && (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 shrink-0">
                    Unsaved
                  </Badge>
                )}
              </div>
              <Separator />

              {/* Title */}
              <Field
                label="Title tag"
                hint="Recommended 30–60 chars for SERP display"
                counter={`${draft.title.length}/60`}
                counterCls={titleCounterCls(draft.title.length)}
                ai={titleIssue(draft)}
                aiLoading={loadingField === "title"}
                onAi={() => {
                  const it = titleIssue(draft);
                  if (it) generateAi("title", it);
                }}
              >
                <Input
                  value={draft.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="Page title — concise, keyword-rich"
                  maxLength={120}
                />
              </Field>

              {/* Meta description */}
              <Field
                label="Meta description"
                hint="Recommended 120–160 chars"
                counter={`${draft.metaDescription.length}/160`}
                counterCls={descCounterCls(draft.metaDescription.length)}
                ai={descIssue(draft)}
                aiLoading={loadingField === "metaDescription"}
                onAi={() => {
                  const it = descIssue(draft);
                  if (it) generateAi("metaDescription", it);
                }}
                align="start"
              >
                <Textarea
                  value={draft.metaDescription}
                  onChange={(e) => update("metaDescription", e.target.value)}
                  placeholder="A short summary that appears under the title in search results"
                  rows={3}
                  maxLength={400}
                  className="resize-y text-sm"
                />
              </Field>

              {/* H1 */}
              <Field
                label="H1 heading"
                hint="Single H1, matches search intent"
                ai={h1Issue(draft)}
                aiLoading={loadingField === "h1"}
                onAi={() => {
                  const it = h1Issue(draft);
                  if (it) generateAi("h1", it);
                }}
              >
                <Input
                  value={draft.h1}
                  onChange={(e) => update("h1", e.target.value)}
                  placeholder="Main visible page heading"
                  maxLength={120}
                />
              </Field>

              <Separator />

              {/* Canonical */}
              <Field
                label="Canonical URL"
                hint="Prevents duplicate-content issues"
              >
                <Input
                  value={draft.canonical}
                  onChange={(e) => update("canonical", e.target.value)}
                  placeholder="https://example.com/page"
                  className="font-mono text-xs"
                />
              </Field>

              {/* OG title */}
              <Field
                label="Open Graph title"
                hint="Shown when shared on Facebook, LinkedIn, etc."
              >
                <Input
                  value={draft.ogTitle}
                  onChange={(e) => update("ogTitle", e.target.value)}
                  placeholder="Compelling title for social shares"
                  maxLength={120}
                />
              </Field>

              {/* OG description */}
              <Field
                label="Open Graph description"
                hint="Short summary for social cards"
                align="start"
              >
                <Textarea
                  value={draft.ogDescription}
                  onChange={(e) => update("ogDescription", e.target.value)}
                  placeholder="What people see when this link is shared"
                  rows={2}
                  maxLength={300}
                  className="resize-y text-sm"
                />
              </Field>

              <Separator />

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  className={cn(EMERALD_BTN)}
                  onClick={onSave}
                  disabled={!isDirty}
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  Save changes
                </Button>
                <Button
                  variant="outline"
                  onClick={onReset}
                  disabled={!isDirty}
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Reset
                </Button>
                <span className="text-[11px] text-muted-foreground ml-auto">
                  {isDirty
                    ? "You have unsaved changes"
                    : "All changes saved"}
                </span>
              </div>
            </Card>
          )}
        </div>

        {/* ---------- Right: Live preview (sticky) ---------- */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4 space-y-4">
            {!draft ? (
              <Card className="p-10 text-center text-sm text-muted-foreground">
                Select a page to preview
              </Card>
            ) : (
              <>
                {/* SEO score */}
                {score && <SeoScoreCard score={score} />}

                {/* SERP preview */}
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-semibold text-sm">SERP preview</h3>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      Live
                    </span>
                  </div>
                  <div className="rounded-lg bg-white dark:bg-zinc-950 border p-4 font-sans">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                        <Globe className="w-2.5 h-2.5 text-muted-foreground" />
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {pagePath(selectedPage?.url ?? draft.canonical)}
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-500 mb-1 truncate">
                      {truncateUrl(selectedPage?.url ?? draft.canonical, 56)}
                    </div>
                    <div className="text-base leading-snug mb-1 truncate">
                      <span className="text-[#1a0dab] dark:text-blue-400 hover:underline cursor-pointer">
                        {truncate(draft.title || "Untitled page", 60) ||
                          "Untitled page"}
                      </span>
                    </div>
                    <div className="text-xs text-[#545454] dark:text-neutral-400 leading-relaxed line-clamp-2">
                      {truncate(
                        draft.metaDescription ||
                          "No meta description set — Google will auto-generate one from page content.",
                        160,
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Google may rewrite titles or descriptions at display time.
                  </p>
                </Card>

                {/* Social card preview */}
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-semibold text-sm">Social card preview</h3>
                  </div>
                  <div className="rounded-lg overflow-hidden border bg-white dark:bg-zinc-950">
                    <div className="aspect-[1.91/1] w-full bg-gradient-to-br from-emerald-100 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/30 flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="w-7 h-7 text-emerald-600/60 dark:text-emerald-400/60 mx-auto" />
                        <div className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 mt-1">
                          og:image · 1200 × 630
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-white dark:bg-zinc-950">
                      <div className="text-[10px] uppercase text-neutral-500 dark:text-neutral-500 truncate">
                        {truncateUrl(selectedPage?.url ?? draft.canonical, 40)}
                      </div>
                      <div className="text-sm font-semibold text-[#1a0dab] dark:text-blue-400 mt-0.5 truncate">
                        {truncate(draft.ogTitle || draft.title || "Untitled page", 80)}
                      </div>
                      <div className="text-xs text-[#545454] dark:text-neutral-400 mt-0.5 line-clamp-2">
                        {truncate(
                          draft.ogDescription ||
                            draft.metaDescription ||
                            "No description set.",
                          160,
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Sub-components ----------

function Field({
  label,
  hint,
  counter,
  counterCls,
  ai,
  aiLoading,
  onAi,
  children,
  align = "center",
}: {
  label: string;
  hint?: string;
  counter?: string;
  counterCls?: string;
  ai?: AiIssueType | null;
  aiLoading?: boolean;
  onAi?: () => void;
  children: React.ReactNode;
  align?: "center" | "start";
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "flex items-center gap-2 flex-wrap",
          align === "center" ? "items-center" : "items-start",
        )}
      >
        <Label className="text-xs">{label}</Label>
        {counter && (
          <span
            className={cn(
              "text-[10px] tabular-nums ml-auto",
              counterCls ?? "text-muted-foreground",
            )}
          >
            {counter}
          </span>
        )}
        {ai && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={aiLoading}
            onClick={onAi}
            className={cn(
              "h-6 text-[11px] gap-1 px-2",
              ai ? "" : "ml-auto",
              "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/30",
            )}
          >
            {aiLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Generate with AI
          </Button>
        )}
      </div>
      {children}
      {hint && !ai && (
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function SeoScoreCard({
  score,
}: {
  score: { score: number; label: "Good" | "Needs work" | "Poor"; color: string };
}) {
  const Icon =
    score.label === "Good"
      ? CheckCircle2
      : score.label === "Needs work"
        ? AlertTriangle
        : XCircle;
  const badgeCls =
    score.label === "Good"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
      : score.label === "Needs work"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
        : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            className="w-4 h-4"
            style={{ color: score.color }}
          />
          <h3 className="font-semibold text-sm">SEO score</h3>
        </div>
        <Badge className={cn("text-xs", badgeCls)} variant="outline">
          {score.label}
        </Badge>
      </div>
      <div className="flex items-end gap-2 mt-2">
        <div
          className="text-3xl font-bold tabular-nums"
          style={{ color: score.color }}
        >
          {score.score}
        </div>
        <div className="text-xs text-muted-foreground mb-1">/ 100</div>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${score.score}%`,
            backgroundColor: score.color,
          }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        Updates live as you edit. Based on title length, description length,
        H1 presence &amp; canonical URL.
      </p>
    </Card>
  );
}
