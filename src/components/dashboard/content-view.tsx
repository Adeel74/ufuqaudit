"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { ScoreRing } from "@/components/dashboard/score-ui";
import { useAppStore } from "@/lib/store";
import type { PageData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  PenLine, Sparkles, Check, AlertTriangle, X, Loader2, FileText,
  Eraser, Wand2, Clock, AlignLeft, Pilcrow, GraduationCap,
  FileSearch, Tags,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------- Types ----------
interface AnalysisStats {
  wordCount: number;
  charCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTimeMin: number;
  avgWordsPerSentence: number;
  avgCharsPerWord: number;
}
interface AnalysisReadability {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  grade: string;
  interpretation: string;
  color: string;
}
interface KeywordDensityItem {
  word: string;
  count: number;
  density: number;
}
interface PhraseItem {
  phrase: string;
  count: number;
}
interface ContentCheckItem {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}
interface AnalysisResult {
  stats: AnalysisStats;
  readability: AnalysisReadability;
  keywordDensity: KeywordDensityItem[];
  topPhrases: PhraseItem[];
  contentChecks: ContentCheckItem[];
  suggestions: string[];
}

// ---------- Constants ----------
const EMERALD = "#10b981";
const EMERALD_BTN = "bg-emerald-600 hover:bg-emerald-700 text-white";

const SCROLLBAR_CLS =
  "max-h-[40vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent";

const CHECK_META: Record<
  ContentCheckItem["status"],
  { color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pass: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950/40", icon: Check },
  warn: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950/40", icon: AlertTriangle },
  fail: { color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-950/40", icon: X },
};

// ---------- Helpers ----------
function synthesizePageText(page: PageData): string {
  const parts: string[] = [];
  if (page.title) parts.push(`# ${page.title}`);
  if (page.h1) parts.push(page.h1);
  if (page.metaDescription) parts.push(page.metaDescription);

  const base = parts.join("\n\n").trim();
  // If real text is sparse (no real content crawled), synthesize more body.
  if (base.length < 200 && (page.title || page.h1)) {
    const heading = page.h1 || page.title || "this page";
    const desc = page.metaDescription || "discover valuable insights and detailed information";
    parts.push(
      `${heading} offers comprehensive information for visitors. ${desc} ` +
      `Our team has carefully structured this content to ensure readability and clarity. ` +
      `You will find detailed explanations, practical examples, and actionable guidance throughout. ` +
      `We invite you to explore the various sections, each designed to address specific questions and use cases. ` +
      `Whether you are a beginner or an experienced practitioner, the material below adapts to your needs. ` +
      `If you have any questions or need further assistance, please do not hesitate to reach out. ` +
      `Thank you for visiting, and we hope this information proves valuable to you.`
    );
  }
  return parts.join("\n\n").trim();
}

function wordCountOf(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

// ---------- Skeleton ----------
function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

// ---------- Empty state ----------
function EmptyResults() {
  const examples = [
    {
      icon: FileText,
      title: "Pre-publish checks",
      body: "Analyze a blog post draft before publishing to ensure optimal readability and keyword density.",
    },
    {
      icon: GraduationCap,
      title: "Audience fit",
      body: "Verify that your landing page copy hits the right reading grade level for your target audience.",
    },
    {
      icon: FileSearch,
      title: "Content gaps",
      body: "Load a page from your latest audit and find thin content, missing keywords, or weak structure.",
    },
  ];
  return (
    <Card className="p-10 text-center border-dashed">
      <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-4">
        <PenLine className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="font-semibold text-lg">Analyze your content</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
        Paste your content (or load a page from your current audit) to get readability, keyword density,
        content checks, and actionable SEO suggestions — in seconds.
      </p>
      <div className="mt-6 grid sm:grid-cols-3 gap-3 text-left">
        {examples.map((ex) => {
          const Icon = ex.icon;
          return (
            <div
              key={ex.title}
              className="rounded-lg border bg-card p-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
            >
              <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-2" />
              <p className="text-xs font-semibold">{ex.title}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{ex.body}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ---------- Content checks list ----------
function ContentChecksList({ checks }: { checks: ContentCheckItem[] }) {
  const pass = checks.filter((c) => c.status === "pass").length;
  const total = checks.length;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: EMERALD }} />
            Content Checks
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pass} of {total} passing
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-[11px]">
          {total}
        </Badge>
      </div>
      <div className={SCROLLBAR_CLS}>
        {checks.map((c) => {
          const meta = CHECK_META[c.status];
          const Icon = meta.icon;
          return (
            <div
              key={c.id}
              className="flex items-start gap-3 py-2.5 border-b last:border-b-0"
            >
              <span
                className={cn(
                  "shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                  meta.bg
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", meta.color)} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{c.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ---------- Keyword density chart ----------
function KeywordDensityChart({ data }: { data: KeywordDensityItem[] }) {
  const chartData = [...data].reverse(); // Recharts lays out bottom-to-top; reverse so highest is on top.
  const height = Math.min(360, Math.max(200, chartData.length * 24));
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Tags className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Keyword Density
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Top {data.length} single words (excluding stopwords)
          </p>
        </div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              strokeOpacity={0.4}
              horizontal={false}
            />
            <XAxis
              type="number"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              unit="%"
            />
            <YAxis
              type="category"
              dataKey="word"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={72}
            />
            <RTooltip
              cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                fontSize: 12,
                padding: "8px 10px",
              }}
              formatter={(v: number, _n: string, item: { payload?: KeywordDensityItem }) => {
                const count = item?.payload?.count ?? 0;
                return [`${v}% (${count}×)`, "Density"];
              }}
            />
            <Bar dataKey="density" fill={EMERALD} radius={[0, 4, 4, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ---------- Top phrases ----------
function TopPhrasesCard({ phrases }: { phrases: PhraseItem[] }) {
  return (
    <Card className="p-5">
      <h3 className="font-semibold flex items-center gap-2">
        <AlignLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        Top Phrases
      </h3>
      <p className="text-xs text-muted-foreground mt-0.5 mb-3">
        Most repeated 2-word phrases (count ≥ 2)
      </p>
      {phrases.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No repeating phrases detected.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {phrases.map((p) => (
            <Badge
              key={p.phrase}
              variant="outline"
              className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-foreground"
            >
              <span className="truncate max-w-[180px]">{p.phrase}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono ml-1">×{p.count}</span>
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------- Suggestions ----------
function SuggestionsCard({ suggestions }: { suggestions: string[] }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <h3 className="font-semibold">Suggestions</h3>
        <Badge variant="outline" className="ml-auto font-mono text-[11px]">
          {suggestions.length}
        </Badge>
      </div>
      <ol className="space-y-2.5">
        {suggestions.map((s, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span className="leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

// =================== Component ===================
export function ContentView() {
  const currentAudit = useAppStore((s) => s.currentAudit);
  const [text, setText] = React.useState("");
  const [keyword, setKeyword] = React.useState("");
  const [result, setResult] = React.useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);

  const charCount = text.length;
  const wordCount = wordCountOf(text);

  const onAnalyze = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Paste some content to analyze first");
      return;
    }
    if (wordCount < 5) {
      toast.error("Add at least a few words for a meaningful analysis");
      return;
    }
    setAnalyzing(true);
    try {
      const r = await fetch("/api/content/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, keyword: keyword.trim() || undefined }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setResult(j as AnalysisResult);
      toast.success("Analysis complete");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Analysis failed";
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const onClear = () => {
    setText("");
    setKeyword("");
    setResult(null);
  };

  const onLoadFromAudit = () => {
    if (!currentAudit || !currentAudit.pages || currentAudit.pages.length === 0) {
      toast.error("No pages in the current audit");
      return;
    }
    // Sort by wordCount desc — undefined wordCount goes last.
    const sorted = [...currentAudit.pages].sort(
      (a, b) => (b.wordCount ?? 0) - (a.wordCount ?? 0),
    );
    const top = sorted[0];
    if (!top) {
      toast.error("No pages in the current audit");
      return;
    }
    const synthesized = synthesizePageText(top);
    setText(synthesized);
    setResult(null);
    toast.success(
      `Loaded "${top.title || top.h1 || top.url}" (${top.wordCount ?? wordCountOf(synthesized)} words)`,
    );
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Content Analyzer"
        subtitle="Readability, keyword density & content quality checks"
        icon={PenLine}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ---------- Left: input panel (sticky on desktop) ---------- */}
        <div className="lg:sticky lg:top-20 lg:self-start space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Your content</h3>
              <Badge variant="outline" className="font-mono text-[11px]">
                {wordCount} words · {charCount} chars
              </Badge>
            </div>

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your article, blog post, landing page copy, or any text you want to analyze…"
              className="min-h-[300px] resize-y field-sizing-none text-sm leading-relaxed"
            />

            <div className="mt-3">
              <label className="text-xs text-muted-foreground font-medium" htmlFor="focus-keyword">
                Focus keyword <span className="opacity-60">(optional)</span>
              </label>
              <Input
                id="focus-keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. content audit"
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAnalyze();
                  }
                }}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                onClick={onAnalyze}
                disabled={analyzing || !text.trim()}
                className={cn(EMERALD_BTN, "min-w-[120px]")}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing…
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" /> Analyze
                  </>
                )}
              </Button>
              <Button variant="outline" size="default" onClick={onClear} disabled={analyzing}>
                <Eraser className="w-3.5 h-3.5" /> Clear
              </Button>
              {currentAudit && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={onLoadFromAudit}
                  disabled={analyzing}
                >
                  <FileText className="w-3.5 h-3.5" /> Load from audit
                </Button>
              )}
            </div>

            {currentAudit && (
              <p className="text-[11px] text-muted-foreground mt-2">
                Loads the longest page from{" "}
                <span className="font-medium text-foreground">{currentAudit.url}</span> and synthesizes
                body text from its metadata if needed.
              </p>
            )}
          </Card>
        </div>

        {/* ---------- Right: results panel ---------- */}
        <div className="space-y-4">
          {analyzing ? (
            <ResultsSkeleton />
          ) : !result ? (
            <EmptyResults />
          ) : (
            <>
              {/* Stats grid — 5 KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  label="Word Count"
                  value={result.stats.wordCount}
                  hint={`${result.stats.charCount} characters`}
                  color="#0f766e"
                  icon={FileText}
                />
                <StatCard
                  label="Reading Time"
                  value={`${result.stats.readingTimeMin}m`}
                  hint="at 200 wpm"
                  color="#10b981"
                  icon={Clock}
                />
                <StatCard
                  label="Avg Sentence"
                  value={result.stats.avgWordsPerSentence}
                  hint="words / sentence"
                  color="#14b8a6"
                  icon={AlignLeft}
                />
                <StatCard
                  label="Paragraphs"
                  value={result.stats.paragraphCount}
                  hint={`${result.stats.sentenceCount} sentences`}
                  color="#10b981"
                  icon={Pilcrow}
                />
                <StatCard
                  label="Reading Grade"
                  value={result.readability.grade}
                  hint={`F-K grade ${result.readability.fleschKincaidGrade}`}
                  color={result.readability.color}
                  icon={GraduationCap}
                />
              </div>

              {/* Readability score card */}
              <Card className="p-5">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ScoreRing
                    value={result.readability.fleschReadingEase}
                    size={170}
                    stroke={14}
                    color={result.readability.color}
                    label="Reading Ease"
                    sublabel={`Grade ${result.readability.grade}`}
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold flex items-center gap-2 justify-center sm:justify-start">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: result.readability.color }}
                      />
                      Readability
                    </h3>
                    <p className="text-sm font-medium mt-1.5" style={{ color: result.readability.color }}>
                      {result.readability.interpretation}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      Flesch Reading Ease of <span className="font-semibold tabular-nums">{result.readability.fleschReadingEase}</span>{" "}
                      on a 0–100 scale. Higher is easier to read. Flesch–Kincaid grade level{" "}
                      <span className="font-semibold tabular-nums">{result.readability.fleschKincaidGrade}</span>{" "}
                      ≈ years of education needed.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                      <Badge variant="outline" className="font-mono text-[11px]">
                        Avg {result.stats.avgCharsPerWord} chars/word
                      </Badge>
                      <Badge variant="outline" className="font-mono text-[11px]">
                        {result.stats.sentenceCount} sentences
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Content checks */}
              <ContentChecksList checks={result.contentChecks} />

              {/* Keyword density */}
              {result.keywordDensity.length > 0 ? (
                <KeywordDensityChart data={result.keywordDensity} />
              ) : (
                <Card className="p-5">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Tags className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Keyword Density
                  </h3>
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No significant keywords detected — try pasting longer or more varied content.
                  </p>
                </Card>
              )}

              {/* Top phrases */}
              <TopPhrasesCard phrases={result.topPhrases} />

              {/* Suggestions */}
              <SuggestionsCard suggestions={result.suggestions} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
