"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell,
} from "recharts";
import {
  Link2, RefreshCw, Globe, TrendingUp, TrendingDown, Plus, Minus,
  Gauge, ShieldCheck, ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------- Types ----------
type BacklinkType = "dofollow" | "nofollow" | "ugc" | "sponsored";
type BacklinkStatus = "active" | "lost" | "new";

interface Backlink {
  sourceUrl: string;
  sourceDomain: string;
  domainAuthority: number;
  targetUrl: string;
  anchorText: string;
  type: BacklinkType;
  firstSeen: string;
  status: BacklinkStatus;
}

interface BacklinkStats {
  total: number;
  active: number;
  new: number;
  lost: number;
  dofollow: number;
  nofollow: number;
  avgDA: number;
  totalDA: number;
  referringDomains: number;
}

interface TrendPoint {
  week: string;
  gained: number;
  lost: number;
}

// ---------- Constants ----------
const EMERALD = "#10b981";
const RED = "#ef4444";
const EMERALD_BTN = "bg-emerald-600 hover:bg-emerald-700 text-white";

const SCROLLBAR_CLS =
  "max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent";

// DA distribution buckets
const DA_BUCKETS = [
  { key: "0-20", label: "0–20", test: (d: number) => d >= 0 && d <= 20 },
  { key: "21-40", label: "21–40", test: (d: number) => d >= 21 && d <= 40 },
  { key: "41-60", label: "41–60", test: (d: number) => d >= 41 && d <= 60 },
  { key: "61-80", label: "61–80", test: (d: number) => d >= 61 && d <= 80 },
  { key: "81-100", label: "81–100", test: (d: number) => d >= 81 && d <= 100 },
];

// Type badges
const TYPE_BADGE: Record<BacklinkType, { cls: string; label: string }> = {
  dofollow: { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", label: "DoFollow" },
  nofollow: { cls: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", label: "NoFollow" },
  ugc: { cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", label: "UGC" },
  sponsored: { cls: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400", label: "Sponsored" },
};

const STATUS_BADGE: Record<BacklinkStatus, { cls: string; label: string }> = {
  active: { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", label: "Active" },
  new: { cls: "border-emerald-500 text-emerald-600 dark:text-emerald-400", label: "New" },
  lost: { cls: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400", label: "Lost" },
};

type SortKey = "domainAuthority" | "sourceDomain" | "firstSeen";
type SortDir = "asc" | "desc";
type TypeFilter = "all" | "dofollow" | "nofollow";
type StatusFilter = "all" | "active" | "new" | "lost";

// ---------- Helpers ----------
function daColor(d: number): string {
  if (d >= 80) return "#10b981";
  if (d >= 60) return "#0ea5e9";
  if (d >= 40) return "#f59e0b";
  if (d >= 20) return "#f97316";
  return "#ef4444";
}

function daBadgeCls(d: number): string {
  if (d >= 80) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
  if (d >= 60) return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400";
  if (d >= 40) return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
  if (d >= 20) return "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400";
  return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(domain)}`;
}

// ---------- Sort header ----------
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
export function BacklinksView() {
  const [data, setData] = React.useState<{
    backlinks: Backlink[];
    stats: BacklinkStats;
    trend: TrendPoint[];
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // filters + sort
  const [search, setSearch] = React.useState("");
  const [typeF, setTypeF] = React.useState<TypeFilter>("all");
  const [statusF, setStatusF] = React.useState<StatusFilter>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("domainAuthority");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/backlinks", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as {
        backlinks: Backlink[];
        stats: BacklinkStats;
        trend: TrendPoint[];
      };
      setData({
        backlinks: Array.isArray(j.backlinks) ? j.backlinks : [],
        stats: j.stats,
        trend: Array.isArray(j.trend) ? j.trend : [],
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load backlinks";
      setError(msg);
      setData({ backlinks: [], stats: { total: 0, active: 0, new: 0, lost: 0, dofollow: 0, nofollow: 0, avgDA: 0, totalDA: 0, referringDomains: 0 }, trend: [] });
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
      setSortDir(k === "sourceDomain" ? "asc" : "desc");
    }
  };

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="Backlink Monitor"
          subtitle="Track incoming links and domain authority"
          icon={Link2}
          actions={
            <Button size="sm" variant="outline" disabled>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          }
        />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
        <Skeleton className="h-[260px] rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const backlinks = data?.backlinks ?? [];
  const stats = data?.stats ?? { total: 0, active: 0, new: 0, lost: 0, dofollow: 0, nofollow: 0, avgDA: 0, totalDA: 0, referringDomains: 0 };
  const trend = data?.trend ?? [];

  // ---------- Empty ----------
  if (backlinks.length === 0) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="Backlink Monitor"
          subtitle="Track incoming links and domain authority"
          icon={Link2}
          actions={
            <Button size="sm" variant="outline" onClick={fetchData}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          }
        />
        <Card className="p-10 text-center border-dashed">
          <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
            <Link2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">No backlinks found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {error
              ? `We couldn't load your backlinks (${error}). Try again in a moment.`
              : "Once backlinks are detected, you'll see them here with domain authority, anchor text, and growth trends."}
          </p>
          <Button className={cn(EMERALD_BTN, "mt-5")} onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </Card>
      </div>
    );
  }

  // ---------- Derived: DA distribution ----------
  const daDistribution = DA_BUCKETS.map((b) => ({
    name: b.label,
    key: b.key,
    value: backlinks.filter((bl) => b.test(bl.domainAuthority)).length,
  }));

  // ---------- Derived: anchor text distribution (top 6) ----------
  const anchorCounts = new Map<string, number>();
  for (const bl of backlinks) {
    const a = bl.anchorText || "(empty)";
    anchorCounts.set(a, (anchorCounts.get(a) ?? 0) + 1);
  }
  const topAnchors = Array.from(anchorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([text, count]) => ({ text, count }));
  const maxAnchorCount = topAnchors[0]?.count ?? 1;

  // ---------- Derived: filtered + sorted table rows ----------
  const filtered = backlinks.filter((bl) => {
    if (search) {
      const q = search.toLowerCase();
      const matches =
        bl.sourceDomain.toLowerCase().includes(q) ||
        bl.anchorText.toLowerCase().includes(q) ||
        bl.targetUrl.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (typeF === "dofollow" && bl.type !== "dofollow") return false;
    if (typeF === "nofollow" && bl.type === "dofollow") return false;
    if (statusF !== "all" && bl.status !== statusF) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "domainAuthority") cmp = a.domainAuthority - b.domainAuthority;
    else if (sortKey === "sourceDomain") cmp = a.sourceDomain.localeCompare(b.sourceDomain);
    else if (sortKey === "firstSeen") cmp = new Date(a.firstSeen).getTime() - new Date(b.firstSeen).getTime();
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Backlink Monitor"
        subtitle="Track incoming links and domain authority"
        icon={Link2}
        actions={
          <Button size="sm" variant="outline" onClick={fetchData}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        }
      />

      {/* Stats row — 6 KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Backlinks" value={stats.total} hint="All incoming links" color="#0f766e" icon={Link2} />
        <StatCard label="Referring Domains" value={stats.referringDomains} hint="Unique sources" color="#0ea5e9" icon={Globe} />
        <StatCard label="Avg Domain Authority" value={stats.avgDA} hint="DA across links" color={daColor(stats.avgDA)} icon={Gauge} />
        <StatCard label="DoFollow" value={stats.dofollow} hint={`${stats.nofollow} nofollow`} color="#10b981" icon={ShieldCheck} />
        <StatCard label="New" value={stats.new} hint="Recently discovered" color="#10b981" icon={Plus} />
        <StatCard label="Lost" value={stats.lost} hint="No longer active" color="#ef4444" icon={Minus} />
      </div>

      {/* Growth chart + DA distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Backlink growth — stacked gained vs lost */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Backlink Growth</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Gained vs lost links over 12 weeks</p>
            </div>
            <Badge variant="outline" className="font-mono text-[11px]">12 wk</Badge>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} vertical={false} />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                <RTooltip
                  contentStyle={{
                    borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, padding: "8px 10px",
                  }}
                  labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  formatter={(v: number, n: string) => [`${v} link${v === 1 ? "" : "s"}`, n === "gained" ? "Gained" : "Lost"]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  iconType="circle"
                  iconSize={8}
                  formatter={(v: string) => (v === "gained" ? "Gained" : "Lost")}
                />
                <Bar dataKey="gained" stackId="a" fill={EMERALD} radius={[0, 0, 0, 0]} />
                <Bar dataKey="lost" stackId="a" fill={RED} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* DA distribution — vertical bars w/ emerald gradient */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Domain Authority Distribution</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Backlinks grouped by DA range</p>
            </div>
            <Badge variant="outline" className="font-mono text-[11px]">{backlinks.length}</Badge>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daDistribution} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="daGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={EMERALD} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={EMERALD} stopOpacity={0.55} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                <RTooltip
                  contentStyle={{
                    borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, padding: "8px 10px",
                  }}
                  formatter={(v: number) => [`${v} backlink${v === 1 ? "" : "s"}`, "Count"]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {daDistribution.map((d) => (
                    <Cell key={d.key} fill="url(#daGrad)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Anchor text distribution */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Top Anchor Texts</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Most common link anchors across your backlinks</p>
          </div>
          <Badge variant="outline" className="font-mono text-[11px]">{topAnchors.length}</Badge>
        </div>
        <div className="space-y-2.5">
          {topAnchors.map((a, i) => (
            <div key={a.text + i} className="flex items-center gap-3">
              <div className="w-[200px] shrink-0 truncate text-sm font-medium" title={a.text}>
                &ldquo;{a.text}&rdquo;
              </div>
              <div className="flex-1 h-7 rounded-md bg-muted overflow-hidden relative">
                <div
                  className="h-full rounded-md transition-all"
                  style={{
                    width: `${Math.max(8, (a.count / maxAnchorCount) * 100)}%`,
                    background: `linear-gradient(90deg, ${EMERALD}cc 0%, ${EMERALD} 100%)`,
                  }}
                />
                <span className="absolute inset-y-0 right-2 flex items-center text-xs font-semibold text-muted-foreground">
                  {a.count}
                </span>
              </div>
            </div>
          ))}
          {topAnchors.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No anchor text data yet.</p>
          )}
        </div>
      </Card>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by domain, anchor, or target URL…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={typeF} onValueChange={(v) => setTypeF(v as TypeFilter)}>
              <SelectTrigger size="sm" className="w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="dofollow">DoFollow only</SelectItem>
                <SelectItem value="nofollow">NoFollow only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusF} onValueChange={(v) => setStatusF(v as StatusFilter)}>
              <SelectTrigger size="sm" className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Backlinks table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">All Backlinks</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sorted.length} of {backlinks.length} shown
            </p>
          </div>
        </div>
        <div className={SCROLLBAR_CLS}>
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <SortableHead label="Source Domain" sortKey="sourceDomain" current={sortKey} dir={sortDir} onSort={onSort} className="min-w-[200px]" />
                <SortableHead label="DA" sortKey="domainAuthority" current={sortKey} dir={sortDir} onSort={onSort} className="w-[80px]" align="right" />
                <TableHead className="min-w-[180px]">Target URL</TableHead>
                <TableHead className="min-w-[160px]">Anchor Text</TableHead>
                <TableHead className="w-[110px]">Type</TableHead>
                <SortableHead label="First Seen" sortKey="firstSeen" current={sortKey} dir={sortDir} onSort={onSort} className="w-[110px]" />
                <TableHead className="w-[90px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((bl, i) => {
                const typeMeta = TYPE_BADGE[bl.type] ?? TYPE_BADGE.nofollow;
                const statusMeta = STATUS_BADGE[bl.status] ?? STATUS_BADGE.active;
                const isStatusOutline = bl.status === "new";
                return (
                  <TableRow key={bl.sourceUrl + i} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={faviconUrl(bl.sourceDomain)}
                          alt=""
                          className="w-4 h-4 rounded-sm shrink-0 bg-muted"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                          }}
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm truncate cursor-help">{truncate(bl.sourceDomain, 28)}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[400px] break-all">
                            {bl.sourceUrl}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold tabular-nums", daBadgeCls(bl.domainAuthority))}>
                        {bl.domainAuthority}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground truncate cursor-help block">{truncate(bl.targetUrl, 36)}</span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[400px] break-all">
                          {bl.targetUrl}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm truncate cursor-help block">&ldquo;{bl.anchorText}&rdquo;</span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[400px]">
                          {bl.anchorText}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium", typeMeta.cls)}>
                        {typeMeta.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {relativeTime(bl.firstSeen)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium",
                          isStatusOutline ? "border bg-transparent " + statusMeta.cls : statusMeta.cls,
                        )}
                      >
                        {bl.status === "active" && <ShieldCheck className="w-2.5 h-2.5" />}
                        {bl.status === "new" && <Plus className="w-2.5 h-2.5" />}
                        {bl.status === "lost" && <Minus className="w-2.5 h-2.5" />}
                        {statusMeta.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                    No backlinks match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
