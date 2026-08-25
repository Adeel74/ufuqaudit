"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import { useAudit, ViewHeader } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Legend, ResponsiveContainer,
} from "recharts";
import {
  Swords, Play, Trophy, Star, Loader2, CheckCircle2, XCircle,
  TrendingUp, TrendingDown, Lightbulb, RotateCw, Crown, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

// ---- Types ----
type CatScoreKey = "technical" | "content" | "performance" | "aeo" | "geo" | "security";

type RunResult = {
  overallScore: number;
  scores: Record<CatScoreKey, number>;
  pagesCrawled: number;
  issuesCount: number;
};

type Site = {
  id: number;
  label: string;
  dot: string;
  url: string;
  loading: boolean;
  error: string | null;
  result: RunResult | null;
};

const SITES_INITIAL: Omit<Site, "url">[] = [
  { id: 0, label: "Your site", dot: "#10b981", loading: false, error: null, result: null },
  { id: 1, label: "Competitor 1", dot: "#64748b", loading: false, error: null, result: null },
  { id: 2, label: "Competitor 2", dot: "#f97316", loading: false, error: null, result: null },
  { id: 3, label: "Competitor 3", dot: "#ec4899", loading: false, error: null, result: null },
];

const CAT_ROWS: { key: CatScoreKey; label: string }[] = [
  { key: "technical", label: "Technical SEO" },
  { key: "content", label: "Content SEO" },
  { key: "performance", label: "Performance" },
  { key: "aeo", label: "AEO" },
  { key: "geo", label: "GEO" },
  { key: "security", label: "Security" },
];

const SCROLLBAR_CLS =
  "max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent";

function scoreColor(v: number): string {
  if (v >= 80) return "#10b981";
  if (v >= 60) return "#f59e0b";
  if (v >= 40) return "#f97316";
  return "#ef4444";
}

function scoreBg(v: number, isBest: boolean): string {
  if (isBest) return "bg-emerald-50 dark:bg-emerald-950/30";
  return "";
}

function normalizeUrl(u: string): string {
  const t = u.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function shortUrl(u: string, n = 24): string {
  const s = u.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

export function CompetitorsView() {
  const audit = useAudit();
  const [sites, setSites] = React.useState<Site[]>(() =>
    SITES_INITIAL.map((s) => ({ ...s, url: s.id === 0 ? (audit?.url ?? "") : "" })),
  );
  const [running, setRunning] = React.useState(false);
  const [autoFinding, setAutoFinding] = React.useState(false);
  const [progress, setProgress] = React.useState<{ done: number; total: number; current: string } | null>(null);

  // Re-fill "Your site" when audit changes (e.g. first audit completes elsewhere).
  React.useEffect(() => {
    if (audit?.url) {
      setSites((prev) =>
        prev.map((s, i) => (i === 0 && !s.url ? { ...s, url: audit.url } : s)),
      );
    }
  }, [audit?.url]);

  const updateSite = (id: number, patch: Partial<Site>) => {
    setSites((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const handleRun = async () => {
    const urls = sites.map((s) => normalizeUrl(s.url)).filter(Boolean);
    if (urls.length < 2) {
      toast.error("Add at least 2 URLs", {
        description: "You need your site and at least 1 competitor to compare.",
      });
      return;
    }
    const uniq = new Set(urls);
    if (uniq.size < urls.length) {
      toast.error("Duplicate URLs detected", {
        description: "Each site must be a unique URL.",
      });
      return;
    }

    setRunning(true);
    // reset results
    setSites((prev) => prev.map((s) => ({
      ...s, loading: Boolean(normalizeUrl(s.url)), error: null, result: null,
    })));

    const targets = sites.filter((s) => normalizeUrl(s.url));
    let done = 0;
    for (const site of targets) {
      const url = normalizeUrl(site.url)!;
      setProgress({ done, total: targets.length, current: url });
      try {
        const r = await fetch("/api/audit/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error || `HTTP ${r.status}`);
        }
        const j = (await r.json()) as {
          overallScore: number;
          scores: Record<CatScoreKey, number>;
          pagesCrawled: number;
          issues: unknown[];
        };
        updateSite(site.id, {
          loading: false,
          result: {
            overallScore: j.overallScore,
            scores: j.scores,
            pagesCrawled: j.pagesCrawled,
            issuesCount: (j.issues ?? []).length,
          },
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Audit failed";
        updateSite(site.id, { loading: false, error: msg });
        toast.error(`Audit failed for ${shortUrl(url, 32)}`, { description: msg });
      }
      done += 1;
      setProgress({ done, total: targets.length, current: url });
    }
    setProgress(null);
    setRunning(false);
    const ok = sites.filter((s) => normalizeUrl(s.url)).map((s) => s.id);
    setSites((prev) => prev.map((s) => (ok.includes(s.id) && !s.result && !s.error ? { ...s, loading: false } : s)));
    toast.success("Comparison complete", {
      description: `${done} of ${targets.length} sites audited.`,
    });
  };

  // ---- Derived data ----
  const completed = sites.filter((s) => s.result);
  const hasResults = completed.length > 0;

  // Best-per-site per category + overall winner.
  const overallBest = hasResults
    ? completed.reduce((b, s) => (s.result!.overallScore > b.result!.overallScore ? s : b), completed[0])
    : null;

  const bestPerCat: Record<CatScoreKey, number> = {
    technical: 0, content: 0, performance: 0, aeo: 0, geo: 0, security: 0,
  };
  for (const cat of CAT_ROWS) {
    bestPerCat[cat.key] = Math.max(
      0,
      ...completed.map((s) => s.result?.scores[cat.key] ?? 0),
    );
  }

  const winners: { cat: CatScoreKey; label: string; site: Site | null }[] = CAT_ROWS.map((c) => {
    let winner: Site | null = null;
    let best = -1;
    for (const s of completed) {
      const v = s.result?.scores[c.key] ?? -1;
      if (v > best) {
        best = v;
        winner = s;
      }
    }
    return { cat: c.key, label: c.label, site: winner };
  });

  // ---- Radar chart data ----
  const radarData = CAT_ROWS.map((c) => {
    const row: Record<string, number | string> = { category: c.label };
    for (const s of completed) {
      row[s.label] = s.result?.scores[c.key] ?? 0;
    }
    return row;
  });

  // ---- Insights ----
  const mySite = completed[0]; // "Your site" is id=0
  const insights = (() => {
    if (!mySite || !mySite.result) {
      return { winning: [], losing: [], biggestOpp: null };
    }
    const winning: { label: string; gap: number }[] = [];
    const losing: { label: string; gap: number }[] = [];
    let biggestOpp: { label: string; gap: number } | null = null;
    for (const c of CAT_ROWS) {
      const myScore = mySite.result.scores[c.key];
      const best = bestPerCat[c.key];
      const gap = best - myScore;
      if (mySite.id === winners.find((w) => w.cat === c.key)?.site?.id) {
        winning.push({ label: c.label, gap });
      } else if (gap > 0) {
        losing.push({ label: c.label, gap });
      }
      if (!biggestOpp || gap > biggestOpp.gap) {
        biggestOpp = { label: c.label, gap };
      }
    }
    return {
      winning: winning.sort((a, b) => b.gap - a.gap),
      losing: losing.sort((a, b) => b.gap - a.gap),
      biggestOpp: biggestOpp && biggestOpp.gap > 0 ? biggestOpp : null,
    };
  })();

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Competitor Comparison"
        subtitle="Compare your site against up to 3 competitors across all engines"
        icon={Swords}
        actions={
          hasResults ? (
            <Button
              variant="outline"
              size="sm"
              disabled={running}
              onClick={() => {
                setSites((prev) => prev.map((s) => ({ ...s, result: null, error: null })));
                toast.info("Reset comparison");
              }}
            >
              <RotateCw className="w-3.5 h-3.5 mr-1" /> Reset
            </Button>
          ) : undefined
        }
      />

      {/* Input card */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="font-semibold">Sites to compare</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter your site plus up to 3 competitor URLs, then run a comparison.
            </p>
          </div>
          <Badge variant="outline" className="text-[11px]">1 site + 3 competitors</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sites.map((s) => (
            <div
              key={s.id}
              className="rounded-lg border bg-card p-3"
              style={{ borderColor: s.result || s.error || s.loading ? `${s.dot}40` : undefined }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.dot }}
                />
                <span className="text-xs font-semibold truncate">{s.label}</span>
                <span className="ml-auto">
                  {s.loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  ) : s.error ? (
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                  ) : s.result ? (
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: s.dot }} />
                  ) : null}
                </span>
              </div>
              <Input
                value={s.url}
                onChange={(e) => updateSite(s.id, { url: e.target.value })}
                placeholder={s.id === 0 ? "yoursite.com" : "competitor.com"}
                disabled={running}
                className="text-sm h-9"
              />
              {s.result && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {s.result.pagesCrawled} pages · {s.result.issuesCount} issues
                  </span>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: scoreColor(s.result.overallScore) }}
                  >
                    {s.result.overallScore}
                  </span>
                </div>
              )}
              {s.error && (
                <p className="mt-2 text-[11px] text-red-600 line-clamp-2" title={s.error}>
                  {s.error}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <Button
            onClick={handleRun}
            disabled={running || sites.filter((s) => normalizeUrl(s.url)).length < 2}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Auditing {progress ? `${progress.done + 1} of ${progress.total}` : "…"}
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" /> Run comparison
              </>
            )}
          </Button>
          <Button
            variant="outline"
            disabled={running || !sites[0]?.url}
            onClick={async () => {
              const myUrl = normalizeUrl(sites[0]?.url || "");
              if (!myUrl) { toast.error("Enter your site URL first"); return; }
              setAutoFinding(true);
              try {
                const res = await fetch("/api/auto-competitors", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ url: myUrl }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || "Failed");
                // Fill competitor URLs
                setSites((prev) => {
                  const updated = [...prev];
                  data.competitors.forEach((comp: any, i: number) => {
                    if (i + 1 < updated.length) {
                      updated[i + 1] = { ...updated[i + 1], url: comp.url };
                    }
                  });
                  return updated;
                });
                toast.success(`Found ${data.competitors.length} competitors!`, {
                  description: data.suggestion,
                });
              } catch (e: any) {
                toast.error(e?.message || "Auto-find failed");
              } finally {
                setAutoFinding(false);
              }
            }}
          >
            {autoFinding ? (
              <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Finding…</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-1" /> Auto-Find Competitors</>
            )}
          </Button>
          {progress && (
            <span className="text-xs text-muted-foreground">
              {progress.current}
            </span>
          )}
        </div>
      </Card>

      {/* Empty state */}
      {!hasResults && !running && (
        <Card className="p-8 border-dashed">
          <div className="text-center max-w-md mx-auto">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-3">
              <Swords className="w-6 h-6" style={{ color: "#10b981" }} />
            </div>
            <h3 className="font-semibold text-lg">See how you stack up</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add your site and up to 3 competitor URLs above, then click
              <span className="font-medium text-foreground"> Run comparison </span>
              to audit each site and compare scores across all 6 engines side-by-side.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-6 text-left">
              {[
                { icon: Trophy, title: "Side-by-side scores", desc: "Every engine, every site." },
                { icon: TrendingUp, title: "Spot winners", desc: "See where you lead the pack." },
                { icon: Lightbulb, title: "Find opportunities", desc: "Close the biggest gaps first." },
              ].map((f) => (
                <div key={f.title} className="rounded-lg border bg-card p-3">
                  <f.icon className="w-4 h-4 mb-1.5" style={{ color: "#10b981" }} />
                  <p className="text-xs font-semibold">{f.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Loading state */}
      {running && !hasResults && (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#10b981" }} />
            <div>
              <h3 className="font-semibold">Running comparison…</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {progress
                  ? `Auditing ${progress.done + 1} of ${progress.total}: ${progress.current}`
                  : "Crawling & analyzing each site…"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {hasResults && (
        <>
          {/* Comparison table */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Score Comparison</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Best score in each row is highlighted ★
                </p>
              </div>
              <Badge variant="outline" className="text-[11px]">
                {completed.length} site{completed.length === 1 ? "" : "s"} compared
              </Badge>
            </div>
            <div className={SCROLLBAR_CLS}>
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="min-w-[140px]">Engine</TableHead>
                    {sites.map((s) => (
                      <TableHead key={s.id} className="text-right min-w-[110px]">
                        <div className="flex items-center justify-end gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: s.dot }}
                          />
                          <span className="truncate max-w-[100px]" title={s.url}>
                            {s.result ? shortUrl(s.url, 18) : s.label}
                          </span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Overall row */}
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell className="font-semibold text-sm">Overall</TableCell>
                    {sites.map((s) => {
                      if (!s.result) {
                        return <TableCell key={s.id} className="text-right text-xs text-muted-foreground">—</TableCell>;
                      }
                      const v = s.result.overallScore;
                      const isBest = overallBest?.id === s.id;
                      return (
                        <TableCell key={s.id} className={`text-right ${scoreBg(v, isBest)}`}>
                          <div className="flex items-center justify-end gap-1">
                            {isBest && <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />}
                            <span
                              className="text-lg font-bold tabular-nums"
                              style={{ color: scoreColor(v) }}
                            >
                              {v}
                            </span>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {/* Category rows */}
                  {CAT_ROWS.map((c) => (
                    <TableRow key={c.key}>
                      <TableCell className="text-sm">{c.label}</TableCell>
                      {sites.map((s) => {
                        if (!s.result) {
                          return <TableCell key={s.id} className="text-right text-xs text-muted-foreground">—</TableCell>;
                        }
                        const v = s.result.scores[c.key];
                        const isBest = bestPerCat[c.key] === v && v > 0;
                        return (
                          <TableCell key={s.id} className={`text-right ${scoreBg(v, isBest)}`}>
                            <div className="flex items-center justify-end gap-1">
                              {isBest && <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />}
                              <span
                                className="text-sm font-semibold tabular-nums"
                                style={{ color: scoreColor(v) }}
                              >
                                {v}
                              </span>
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Radar + Winner summary grid */}
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Radar */}
            <Card className="p-5 lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Radar Comparison</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">6-engine coverage across all sites</p>
                </div>
              </div>
              <div style={{ height: 360 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="72%" margin={{ top: 16, right: 32, left: 32, bottom: 16 }}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="#cbd5e1" />
                    {completed.map((s) => (
                      <Radar
                        key={s.id}
                        name={s.label}
                        dataKey={s.label}
                        stroke={s.dot}
                        fill={s.dot}
                        fillOpacity={s.id === 0 ? 0.25 : 0.1}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      iconType="circle"
                      iconSize={8}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Winner summary */}
            <Card className="p-5 lg:col-span-2">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4" style={{ color: "#10b981" }} />
                Winner Summary
              </h3>
              <div className="space-y-2">
                {winners.map((w) => (
                  <div
                    key={w.cat}
                    className="flex items-center justify-between rounded-lg border bg-card p-2.5"
                  >
                    <span className="text-sm font-medium">{w.label}</span>
                    {w.site ? (
                      <Badge
                        variant="outline"
                        className="font-medium"
                        style={{
                          borderColor: `${w.site.dot}40`,
                          color: w.site.dot,
                          backgroundColor: `${w.site.dot}10`,
                        }}
                      >
                        <Crown className="w-3 h-3 mr-1" />
                        {w.site.label}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                ))}
                {overallBest && (
                  <div
                    className="mt-3 rounded-lg p-3 border-2"
                    style={{
                      borderColor: `${overallBest.dot}40`,
                      background: `linear-gradient(135deg, ${overallBest.dot}15, transparent)`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" style={{ color: overallBest.dot }} />
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Overall winner</p>
                        <p className="font-semibold text-sm">
                          {overallBest.label} · <span style={{ color: scoreColor(overallBest.result!.overallScore) }}>{overallBest.result!.overallScore}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Insight cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Winning */}
            <Card className="p-5 border-emerald-200 dark:border-emerald-900/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="font-semibold">Where you&apos;re winning</h4>
              </div>
              {insights.winning.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {mySite
                    ? "You aren't leading any category yet — focus on quick wins below."
                    : "Run a comparison to see where you lead."}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {insights.winning.slice(0, 4).map((w) => (
                    <li key={w.label} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {w.label}
                      </span>
                      {w.gap > 0 && (
                        <span className="text-xs text-emerald-600 font-medium">+{w.gap}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Losing */}
            <Card className="p-5 border-red-200 dark:border-red-900/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                </div>
                <h4 className="font-semibold">Where you&apos;re losing</h4>
              </div>
              {insights.losing.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {mySite
                    ? "You're tied or winning every category. Great work!"
                    : "Run a comparison to see gaps."}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {insights.losing.slice(0, 4).map((w) => (
                    <li key={w.label} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {w.label}
                      </span>
                      <span className="text-xs text-red-600 font-medium">−{w.gap}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Biggest opportunity */}
            <Card className="p-5 border-amber-200 dark:border-amber-900/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                </div>
                <h4 className="font-semibold">Biggest opportunity</h4>
              </div>
              {insights.biggestOpp ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Close the gap in:</p>
                  <p className="font-semibold text-base">{insights.biggestOpp.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You&apos;re <span className="font-semibold text-amber-700 dark:text-amber-500">−{insights.biggestOpp.gap}</span> below the leader.
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    Focus your next sprint here for the biggest score uplift relative to competitors.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {mySite
                    ? "No gap detected — you're leading or tied across all categories."
                    : "Run a comparison to find your biggest opportunity."}
                </p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
