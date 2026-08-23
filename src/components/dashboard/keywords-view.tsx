"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import {
  Search, Plus, TrendingUp, TrendingDown, Minus, Hash, Target,
  Trophy, Gauge, Loader2, ChevronUp, ChevronDown, ChevronsUpDown,
  Star, Link as LinkIcon, Video, HelpCircle, ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------- Types ----------
interface KeywordRow {
  keyword: string;
  position: number;
  prevPosition: number;
  volume: number;
  difficulty: number;
  url: string;
  serpFeatures: string[];
  trend: number[];
}

interface KeywordStats {
  total: number;
  avgPosition: number;
  totalVolume: number;
  top3: number;
  top10: number;
  improved: number;
}

// ---------- Constants ----------
const EMERALD = "#10b981";
const EMERALD_BTN = "bg-emerald-600 hover:bg-emerald-700 text-white";

const SCROLLBAR_CLS =
  "max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent";

// Distribution buckets + colors (green → red gradient as position worsens)
const BUCKETS = [
  { key: "1-3", label: "Positions 1–3", color: "#10b981", test: (p: number) => p >= 1 && p <= 3 },
  { key: "4-10", label: "Positions 4–10", color: "#f59e0b", test: (p: number) => p >= 4 && p <= 10 },
  { key: "11-30", label: "Positions 11–30", color: "#f97316", test: (p: number) => p >= 11 && p <= 30 },
  { key: "31-50", label: "Positions 31–50", color: "#ef4444", test: (p: number) => p >= 31 && p <= 50 },
  { key: "50+", label: "Positions 50+", color: "#94a3b8", test: (p: number) => p > 50 },
];

// Distinct colors for the top-5 keyword trend lines (emerald first for the #1 keyword).
const LINE_COLORS = ["#10b981", "#0ea5e9", "#f59e0b", "#ec4899", "#8b5cf6"];

// SERP feature metadata
const SERP_META: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  organic: { label: "Organic", cls: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: ListChecks },
  featured: { label: "Featured", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", icon: Star },
  sitelinks: { label: "Sitelinks", cls: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400", icon: ListChecks },
  faq: { label: "FAQ", cls: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400", icon: HelpCircle },
  video: { label: "Video", cls: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400", icon: Video },
};

type SortKey = "position" | "volume" | "difficulty" | "keyword";
type SortDir = "asc" | "desc";
type RangeFilter = "all" | "top3" | "top10" | "top30";

// ---------- Helpers ----------
function posColor(p: number): string {
  if (p <= 3) return "#10b981";
  if (p <= 10) return "#f59e0b";
  if (p <= 30) return "#f97316";
  return "#ef4444";
}

function posBadgeCls(p: number): string {
  if (p <= 3) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
  if (p <= 10) return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
  if (p <= 30) return "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400";
  return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";
}

function diffColor(d: number): string {
  if (d < 0) return "text-emerald-600 dark:text-emerald-400"; // improved (position dropped)
  if (d > 0) return "text-red-600 dark:text-red-400"; // dropped
  return "text-muted-foreground";
}

function fmtVolume(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toString();
}

function fmtDelta(cur: number, prev: number): { text: string; delta: number } {
  const d = cur - prev;
  return { text: d === 0 ? "—" : (d > 0 ? `+${d}` : `${d}`), delta: d };
}

function truncateUrl(u: string, n = 32): string {
  if (u.length <= n) return u;
  const stripped = u.replace(/^https?:\/\//, "");
  if (stripped.length <= n) return stripped;
  return stripped.slice(0, n - 1) + "…";
}

// ---------- Sparkline (tiny inline line chart for table cells) ----------
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const d = data.length ? data : [0, 0];
  return (
    <div style={{ width: 80, height: 30 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={d.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Sort header button ----------
function SortableHead({
  label, sortKey, current, dir, onSort, className, align = "left",
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
  align?: "left" | "right";
}) {
  const active = current === sortKey;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium hover:text-foreground transition-colors",
          align === "right" && "flex-row-reverse",
          active && "text-foreground",
        )}
      >
        {label}
        {active ? (
          dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronsUpDown className="w-3 h-3 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

// =================== Component ===================
export function KeywordsView() {
  const [data, setData] = React.useState<{ keywords: KeywordRow[]; stats: KeywordStats } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // filter + sort state
  const [search, setSearch] = React.useState("");
  const [range, setRange] = React.useState<RangeFilter>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("position");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  // add-keyword dialog
  const [addOpen, setAddOpen] = React.useState(false);
  const [newKw, setNewKw] = React.useState("");
  const [adding, setAdding] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/keywords", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as { keywords: KeywordRow[]; stats: KeywordStats };
      setData({ keywords: Array.isArray(j.keywords) ? j.keywords : [], stats: j.stats });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load keywords";
      setError(msg);
      setData({ keywords: [], stats: { total: 0, avgPosition: 0, totalVolume: 0, top3: 0, top10: 0, improved: 0 } });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSort = (k: SortKey) => {
    if (k === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir(k === "keyword" ? "asc" : "asc");
    }
  };

  const onAddKeyword = async () => {
    const kw = newKw.trim();
    if (!kw) {
      toast.error("Enter a keyword to track");
      return;
    }
    setAdding(true);
    try {
      const r = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      const j = (await r.json()) as { keyword: KeywordRow };
      setData((prev) => {
        if (!prev) return prev;
        // Avoid duplicates — replace if same keyword exists.
        const others = prev.keywords.filter((k) => k.keyword.toLowerCase() !== kw.toLowerCase());
        return {
          keywords: [j.keyword, ...others],
          stats: {
            ...prev.stats,
            total: prev.stats.total + 1,
            avgPosition: Math.round(
              ([...others, j.keyword].reduce((s, k) => s + k.position, 0)) / (others.length + 1),
            ),
            top3: [...others, j.keyword].filter((k) => k.position <= 3).length,
            top10: [...others, j.keyword].filter((k) => k.position <= 10).length,
            totalVolume: [...others, j.keyword].reduce((s, k) => s + k.volume, 0),
            improved: [...others, j.keyword].filter((k) => k.position < k.prevPosition).length,
          },
        };
      });
      toast.success(`Now tracking "${kw}"`);
      setNewKw("");
      setAddOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to add keyword";
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="Keyword Rank Tracker"
          subtitle="Monitor your keyword positions and SERP features"
          icon={Search}
          actions={
            <Button size="sm" className={EMERALD_BTN} disabled>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add keyword
            </Button>
          }
        />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const keywords = data?.keywords ?? [];
  const stats = data?.stats ?? { total: 0, avgPosition: 0, totalVolume: 0, top3: 0, top10: 0, improved: 0 };

  // ---------- Empty ----------
  if (keywords.length === 0) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="Keyword Rank Tracker"
          subtitle="Monitor your keyword positions and SERP features"
          icon={Search}
          actions={
            <Button size="sm" className={EMERALD_BTN} onClick={() => setAddOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add keyword
            </Button>
          }
        />
        <Card className="p-10 text-center border-dashed">
          <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">No keywords tracked yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {error
              ? `We couldn't load your keywords (${error}). Try again in a moment.`
              : "Add your first keyword to start tracking its position, search volume, and SERP features."}
          </p>
          <Button className={cn(EMERALD_BTN, "mt-5")} onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add your first keyword
          </Button>
        </Card>
        <AddKeywordDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          value={newKw}
          onChange={setNewKw}
          onAdd={onAddKeyword}
          adding={adding}
        />
      </div>
    );
  }

  // ---------- Derived: distribution ----------
  const distribution = BUCKETS.map((b) => ({
    name: b.label,
    key: b.key,
    value: keywords.filter((k) => b.test(k.position)).length,
    color: b.color,
  }));

  // ---------- Derived: top-5 keyword trends (12 weeks) ----------
  // Lower position = better, so we pick the 5 keywords with the lowest current position.
  const top5 = [...keywords].sort((a, b) => a.position - b.position).slice(0, 5);
  // Each keyword's trend array has 13 points (12 weeks + current). Use index as x-axis.
  const weeks = top5[0]?.trend.length ?? 0;
  const trendData = Array.from({ length: weeks }, (_, i) => {
    const row: Record<string, number | string> = { week: `W${i + 1}` };
    top5.forEach((k) => {
      row[k.keyword] = k.trend[i] ?? 0;
    });
    return row;
  });

  // ---------- Derived: filtered + sorted table rows ----------
  const filtered = keywords.filter((k) => {
    if (search && !k.keyword.toLowerCase().includes(search.toLowerCase())) return false;
    if (range === "top3" && k.position > 3) return false;
    if (range === "top10" && k.position > 10) return false;
    if (range === "top30" && k.position > 30) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "keyword") cmp = a.keyword.localeCompare(b.keyword);
    else cmp = (a[sortKey] as number) - (b[sortKey] as number);
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Keyword Rank Tracker"
        subtitle="Monitor your keyword positions and SERP features"
        icon={Search}
        actions={
          <Button size="sm" className={EMERALD_BTN} onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add keyword
          </Button>
        }
      />

      {/* Stats row — 5 KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Keywords" value={stats.total} hint="Tracked" color="#0f766e" icon={Hash} />
        <StatCard label="Avg Position" value={stats.avgPosition} hint="Across all keywords" color={posColor(stats.avgPosition)} icon={Gauge} />
        <StatCard label="Top 3" value={stats.top3} hint="On page 1, top spots" color="#10b981" icon={Trophy} />
        <StatCard label="Top 10" value={stats.top10} hint="On page 1" color="#f59e0b" icon={Target} />
        <StatCard
          label="Improved"
          value={stats.improved}
          hint="Vs. previous check"
          color="#10b981"
          icon={TrendingUp}
        />
      </div>

      {/* Distribution donut + Trend lines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribution donut */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: EMERALD }} />
                Ranking Distribution
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Keywords by SERP position bucket</p>
            </div>
            <Badge variant="outline" className="font-mono text-[11px]">{keywords.length}</Badge>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  stroke="none"
                >
                  {distribution.map((d) => (
                    <Cell key={d.key} fill={d.color} />
                  ))}
                </Pie>
                <RTooltip
                  contentStyle={{
                    borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, padding: "8px 10px",
                  }}
                  formatter={(v: number, n: string) => [`${v} keyword${v === 1 ? "" : "s"}`, n]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
            {distribution.map((d) => (
              <div key={d.key} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground truncate">{d.name}</span>
                <span className="ml-auto font-semibold tabular-nums">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top-5 position trend (lower = better) */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Top 5 Keyword Trends</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Position over 12 weeks — <span className="text-emerald-600 dark:text-emerald-400 font-medium">lower is better</span>
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-[11px]">12 wk</Badge>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} vertical={false} />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                {/* Reversed Y axis: 1 at the top, 60 at the bottom — so "better" reads upward. */}
                <YAxis
                  reversed
                  domain={[1, 60]}
                  allowDataOverflow
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <RTooltip
                  contentStyle={{
                    borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, padding: "8px 10px",
                  }}
                  labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  formatter={(v: number, n: string) => [`#${v}`, n]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  iconType="circle"
                  iconSize={8}
                />
                {top5.map((k, i) => (
                  <Line
                    key={k.keyword}
                    type="monotone"
                    dataKey={k.keyword}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: LINE_COLORS[i % LINE_COLORS.length] }}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search keywords…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={range} onValueChange={(v) => setRange(v as RangeFilter)}>
              <SelectTrigger size="sm" className="w-[140px]">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All positions</SelectItem>
                <SelectItem value="top3">Top 3 only</SelectItem>
                <SelectItem value="top10">Top 10 only</SelectItem>
                <SelectItem value="top30">Top 30 only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(v) => onSort(v as SortKey)}>
              <SelectTrigger size="sm" className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="position">Sort: Position</SelectItem>
                <SelectItem value="volume">Sort: Volume</SelectItem>
                <SelectItem value="difficulty">Sort: Difficulty</SelectItem>
                <SelectItem value="keyword">Sort: Keyword (A–Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Keywords table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Tracked Keywords</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sorted.length} of {keywords.length} shown
            </p>
          </div>
        </div>
        <div className={SCROLLBAR_CLS}>
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <SortableHead label="Keyword" sortKey="keyword" current={sortKey} dir={sortDir} onSort={onSort} className="min-w-[180px]" />
                <TableHead className="w-[90px] text-right">Position</TableHead>
                <TableHead className="w-[70px] text-right">Δ</TableHead>
                <SortableHead label="Volume" sortKey="volume" current={sortKey} dir={sortDir} onSort={onSort} className="w-[90px]" align="right" />
                <SortableHead label="Difficulty" sortKey="difficulty" current={sortKey} dir={sortDir} onSort={onSort} className="w-[140px]" align="right" />
                <TableHead className="min-w-[180px]">URL</TableHead>
                <TableHead className="min-w-[160px]">SERP Features</TableHead>
                <TableHead className="w-[90px] text-right">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="zebra">
              {sorted.map((k) => {
                const { text: deltaText, delta } = fmtDelta(k.position, k.prevPosition);
                return (
                  <TableRow key={k.keyword} className="hover:bg-muted/40">
                    <TableCell className="font-medium">{k.keyword}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold tabular-nums", posBadgeCls(k.position))}>
                        #{k.position}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium tabular-nums", diffColor(delta))}>
                        {delta === 0 ? (
                          <Minus className="w-3 h-3" />
                        ) : delta < 0 ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <TrendingUp className="w-3 h-3" />
                        )}
                        {deltaText}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{fmtVolume(k.volume)}</TableCell>
                    <TableCell>
                      <DifficultyBar value={k.difficulty} />
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <LinkIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground truncate cursor-help">{truncateUrl(k.url)}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[400px] break-all">
                            {k.url}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {k.serpFeatures.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          k.serpFeatures.map((f) => {
                            const meta = SERP_META[f] ?? { label: f, cls: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: Star };
                            const Icon = meta.icon;
                            return (
                              <span
                                key={f}
                                className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium", meta.cls)}
                              >
                                <Icon className="w-2.5 h-2.5" />
                                {meta.label}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-block">
                        <Sparkline data={k.trend} color={posColor(k.position)} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-10">
                    No keywords match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AddKeywordDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        value={newKw}
        onChange={setNewKw}
        onAdd={onAddKeyword}
        adding={adding}
      />
    </div>
  );
}

// ---------- Difficulty bar (0–100, colored) ----------
function DifficultyBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const color = v <= 30 ? "#10b981" : v <= 60 ? "#f59e0b" : v <= 80 ? "#f97316" : "#ef4444";
  const label = v <= 30 ? "Easy" : v <= 60 ? "Medium" : v <= 80 ? "Hard" : "Very hard";
  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${v}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs tabular-nums w-7 text-right" style={{ color }}>{v}</span>
      <span className="text-[10px] text-muted-foreground w-14 hidden sm:inline">{label}</span>
    </div>
  );
}

// ---------- Add keyword dialog ----------
function AddKeywordDialog({
  open, onOpenChange, value, onChange, onAdd, adding,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  adding: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Track a new keyword</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="kw-input" className="text-xs">Keyword or phrase</Label>
          <Input
            id="kw-input"
            placeholder="e.g. seo audit tool"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !adding) {
                e.preventDefault();
                onAdd();
              }
            }}
            autoFocus
          />
          <p className="text-[11px] text-muted-foreground">
            We&apos;ll start tracking its SERP position, search volume, and SERP features.
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm" disabled={adding}>Cancel</Button>
          </DialogClose>
          <Button size="sm" className={EMERALD_BTN} onClick={onAdd} disabled={adding}>
            {adding ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Adding…
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add keyword
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
