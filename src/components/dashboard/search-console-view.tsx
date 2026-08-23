"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  BarChart3, MousePointerClick, Eye, Percent, Hash, Loader2,
  Search, Globe, Smartphone, Monitor, Tablet, ChevronUp, ChevronDown,
  ChevronsUpDown, AlertCircle, Plug,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------- Types ----------
interface QueryTrendPoint { date: string; clicks: number; }
interface QueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  trend: QueryTrendPoint[];
}
interface PageRow {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}
interface CountryRow {
  country: string;
  code: string;
  clicks: number;
  impressions: number;
}
interface DeviceRow {
  device: string;
  clicks: number;
  impressions: number;
}
interface DailyTrendPoint {
  date: string;
  clicks: number;
  impressions: number;
}
interface GSCSummary {
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  totalQueries: number;
}
interface GSCData {
  summary: GSCSummary;
  queries: QueryRow[];
  pages: PageRow[];
  countries: CountryRow[];
  devices: DeviceRow[];
  dailyTrend: DailyTrendPoint[];
}

// ---------- Constants ----------
const EMERALD = "#10b981";
const EMERALD_BTN = "bg-emerald-600 hover:bg-emerald-700 text-white";

const SCROLLBAR_CLS =
  "max-h-[50vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent";

// Donut slices for the devices chart.
const DEVICE_COLORS: Record<string, string> = {
  Mobile: "#10b981",
  Desktop: "#14b8a6",
  Tablet: "#f59e0b",
};

const DEVICE_ICON: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Mobile: Smartphone,
  Desktop: Monitor,
  Tablet: Tablet,
};

type QSortKey = "query" | "clicks" | "impressions" | "position";
type PSortKey = "url" | "clicks" | "impressions" | "position";
type SortDir = "asc" | "desc";
type RangeFilter = "7" | "30" | "90";

// ---------- Helpers ----------
function fmtCompact(v: number): string {
  if (!Number.isFinite(v)) return "0";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toLocaleString();
}

function ctrColor(ctr: number): string {
  if (ctr >= 3) return "text-emerald-600 dark:text-emerald-400";
  if (ctr >= 1) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

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

function truncateUrl(u: string, n = 36): string {
  if (u.length <= n) return u;
  const stripped = u.replace(/^https?:\/\//, "");
  if (stripped.length <= n) return stripped;
  return stripped.slice(0, n - 1) + "…";
}

// ---------- Sparkline (mini area chart for table cells) ----------
function Sparkline({ data, color }: { data: QueryTrendPoint[]; color: string }) {
  const d = data.length ? data : [{ date: "0", clicks: 0 }];
  const gradId = `spark-${color.replace("#", "")}`;
  return (
    <div style={{ width: 80, height: 30 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={d} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="clicks"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Sortable header button (generic over the key union) ----------
function SortableHead<K extends string>({
  label, sortKey, current, dir, onSort, className, align = "left",
}: {
  label: string;
  sortKey: K;
  current: K;
  dir: SortDir;
  onSort: (k: K) => void;
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
export function SearchConsoleView() {
  const [data, setData] = React.useState<GSCData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [range, setRange] = React.useState<RangeFilter>("30");
  const [search, setSearch] = React.useState("");

  // Sort state (per table)
  const [qSortKey, setQSortKey] = React.useState<QSortKey>("clicks");
  const [qSortDir, setQSortDir] = React.useState<SortDir>("desc");
  const [pSortKey, setPSortKey] = React.useState<PSortKey>("clicks");
  const [pSortDir, setPSortDir] = React.useState<SortDir>("desc");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/search-console", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as GSCData;
      setData(j);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load Search Console data";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onQSort = (k: QSortKey) => {
    if (k === qSortKey) {
      setQSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setQSortKey(k);
      setQSortDir(k === "query" ? "asc" : "desc");
    }
  };

  const onPSort = (k: PSortKey) => {
    if (k === pSortKey) {
      setPSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setPSortKey(k);
      setPSortDir(k === "url" ? "asc" : "desc");
    }
  };

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="Search Console"
          subtitle="Search performance data from Google"
          icon={BarChart3}
          actions={
            <Button size="sm" className={EMERALD_BTN} disabled>
              <Plug className="w-3.5 h-3.5 mr-1" /> Connect GSC
            </Button>
          }
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[240px] rounded-xl" />
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    );
  }

  // ---------- Empty / error ----------
  if (!data) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="Search Console"
          subtitle="Search performance data from Google"
          icon={BarChart3}
          actions={
            <Button size="sm" className={EMERALD_BTN} onClick={fetchData}>
              <Loader2 className="w-3.5 h-3.5 mr-1" /> Retry
            </Button>
          }
        />
        <Card className="p-10 text-center border-dashed">
          <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">Couldn&apos;t load Search Console data</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {error ? `(${error})` : "Please try again in a moment."}
          </p>
          <Button className={cn(EMERALD_BTN, "mt-5")} onClick={fetchData}>
            <Loader2 className="w-4 h-4 mr-1" /> Try again
          </Button>
        </Card>
      </div>
    );
  }

  const { summary, queries, pages, countries, devices, dailyTrend } = data;

  // ---------- Derived: filtered + sorted queries ----------
  const filteredQueries = queries.filter((q) =>
    !search ? true : q.query.toLowerCase().includes(search.toLowerCase()),
  );
  const sortedQueries = [...filteredQueries].sort((a, b) => {
    let cmp = 0;
    if (qSortKey === "query") cmp = a.query.localeCompare(b.query);
    else cmp = (a[qSortKey] as number) - (b[qSortKey] as number);
    return qSortDir === "asc" ? cmp : -cmp;
  });

  // ---------- Derived: sorted pages ----------
  const sortedPages = [...pages].sort((a, b) => {
    let cmp = 0;
    if (pSortKey === "url") cmp = a.url.localeCompare(b.url);
    else cmp = (a[pSortKey] as number) - (b[pSortKey] as number);
    return pSortDir === "asc" ? cmp : -cmp;
  });

  // ---------- Derived: device donut data ----------
  const deviceData = devices.map((d) => ({
    name: d.device,
    value: d.clicks,
    color: DEVICE_COLORS[d.device] ?? "#94a3b8",
  }));
  const totalDeviceClicks = deviceData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Search Console"
        subtitle="Search performance data from Google"
        icon={BarChart3}
        actions={
          <Button
            size="sm"
            className={EMERALD_BTN}
            onClick={() => toast.info("OAuth flow coming soon", { description: "Connect Google Search Console to import live data — Pro feature." })}
          >
            <Plug className="w-3.5 h-3.5 mr-1" /> Connect GSC
          </Button>
        }
      />

      {/* KPI stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Clicks"
          value={fmtCompact(summary.totalClicks)}
          hint={`From ${summary.totalQueries} queries`}
          color="#10b981"
          icon={MousePointerClick}
        />
        <StatCard
          label="Total Impressions"
          value={fmtCompact(summary.totalImpressions)}
          hint="Last 30 days"
          color="#0f766e"
          icon={Eye}
        />
        <StatCard
          label="Avg CTR"
          value={`${summary.avgCtr.toFixed(1)}%`}
          hint="Click-through rate"
          color={summary.avgCtr >= 3 ? "#10b981" : summary.avgCtr >= 1 ? "#f59e0b" : "#ef4444"}
          icon={Percent}
        />
        <StatCard
          label="Avg Position"
          value={summary.avgPosition.toFixed(1)}
          hint="Lower is better"
          color={posColor(summary.avgPosition)}
          icon={Hash}
        />
      </div>

      {/* 30-day performance area chart */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: EMERALD }} />
              Clicks — Last 30 days
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daily click performance across all queries
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-[11px]">
            {fmtCompact(summary.totalClicks)} total
          </Badge>
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTrend} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="gsc-clicks-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EMERALD} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval={4}
                minTickGap={12}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={36}
                tickFormatter={(v: number) => fmtCompact(v)}
              />
              <RTooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                  padding: "8px 10px",
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                formatter={(v: number) => [`${v.toLocaleString()} clicks`, "Clicks"]}
              />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke={EMERALD}
                strokeWidth={2}
                fill="url(#gsc-clicks-grad)"
                dot={false}
                activeDot={{ r: 4, fill: EMERALD }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search queries…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={(v) => setRange(v as RangeFilter)}>
              <SelectTrigger size="sm" className="w-[140px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tabs: Queries | Pages | Countries | Devices */}
      <Tabs defaultValue="queries" className="w-full">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="queries">Queries</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="countries">Countries</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        {/* ---------- Queries tab ---------- */}
        <TabsContent value="queries">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Top Queries</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {sortedQueries.length} of {queries.length} shown
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-[11px]">
                {queries.length}
              </Badge>
            </div>
            <div className={SCROLLBAR_CLS}>
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <SortableHead
                      label="Query"
                      sortKey="query"
                      current={qSortKey}
                      dir={qSortDir}
                      onSort={onQSort}
                      className="min-w-[180px]"
                    />
                    <SortableHead
                      label="Clicks"
                      sortKey="clicks"
                      current={qSortKey}
                      dir={qSortDir}
                      onSort={onQSort}
                      className="w-[100px]"
                      align="right"
                    />
                    <SortableHead
                      label="Impr."
                      sortKey="impressions"
                      current={qSortKey}
                      dir={qSortDir}
                      onSort={onQSort}
                      className="w-[110px]"
                      align="right"
                    />
                    <TableHead className="w-[80px] text-right">CTR</TableHead>
                    <SortableHead
                      label="Position"
                      sortKey="position"
                      current={qSortKey}
                      dir={qSortDir}
                      onSort={onQSort}
                      className="w-[100px]"
                      align="right"
                    />
                    <TableHead className="w-[100px] text-right">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="zebra">
                  {sortedQueries.map((q) => (
                    <TableRow key={q.query} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{q.query}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtCompact(q.clicks)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {fmtCompact(q.impressions)}
                      </TableCell>
                      <TableCell className={cn("text-right tabular-nums font-medium", ctrColor(q.ctr))}>
                        {q.ctr.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold tabular-nums",
                            posBadgeCls(q.position),
                          )}
                        >
                          #{q.position}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-block">
                          <Sparkline data={q.trend} color={posColor(q.position)} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedQueries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                        No queries match &quot;{search}&quot;
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ---------- Pages tab ---------- */}
        <TabsContent value="pages">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Top Pages</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {sortedPages.length} pages shown
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-[11px]">
                {pages.length}
              </Badge>
            </div>
            <div className={SCROLLBAR_CLS}>
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <SortableHead
                      label="URL"
                      sortKey="url"
                      current={pSortKey}
                      dir={pSortDir}
                      onSort={onPSort}
                      className="min-w-[260px]"
                    />
                    <SortableHead
                      label="Clicks"
                      sortKey="clicks"
                      current={pSortKey}
                      dir={pSortDir}
                      onSort={onPSort}
                      className="w-[100px]"
                      align="right"
                    />
                    <SortableHead
                      label="Impr."
                      sortKey="impressions"
                      current={pSortKey}
                      dir={pSortDir}
                      onSort={onPSort}
                      className="w-[110px]"
                      align="right"
                    />
                    <TableHead className="w-[80px] text-right">CTR</TableHead>
                    <SortableHead
                      label="Position"
                      sortKey="position"
                      current={pSortKey}
                      dir={pSortDir}
                      onSort={onPSort}
                      className="w-[100px]"
                      align="right"
                    />
                  </TableRow>
                </TableHeader>
                <TableBody className="zebra">
                  {sortedPages.map((p) => (
                    <TableRow key={p.url} className="hover:bg-muted/40">
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm font-mono cursor-help truncate inline-block max-w-[260px] align-bottom">
                              {truncateUrl(p.url)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[420px] break-all">
                            {p.url}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtCompact(p.clicks)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {fmtCompact(p.impressions)}
                      </TableCell>
                      <TableCell className={cn("text-right tabular-nums font-medium", ctrColor(p.ctr))}>
                        {p.ctr.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold tabular-nums",
                            posBadgeCls(p.position),
                          )}
                        >
                          #{p.position}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedPages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                        No page data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ---------- Countries tab ---------- */}
        <TabsContent value="countries">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Clicks by Country
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Geographic distribution of search traffic
                  </p>
                </div>
                <Badge variant="outline" className="font-mono text-[11px]">
                  {countries.length}
                </Badge>
              </div>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={countries}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => fmtCompact(v)}
                    />
                    <YAxis
                      type="category"
                      dataKey="country"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={108}
                      interval={0}
                    />
                    <RTooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                        padding: "8px 10px",
                      }}
                      formatter={(v: number) => [`${v.toLocaleString()} clicks`, "Clicks"]}
                    />
                    <Bar
                      dataKey="clicks"
                      fill={EMERALD}
                      radius={[0, 4, 4, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Country Breakdown</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Clicks & impressions per region
                  </p>
                </div>
              </div>
              <div className={SCROLLBAR_CLS}>
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="min-w-[140px]">Country</TableHead>
                      <TableHead className="w-[60px] text-right">Code</TableHead>
                      <TableHead className="w-[100px] text-right">Clicks</TableHead>
                      <TableHead className="w-[110px] text-right">Impr.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="zebra">
                    {countries.map((c) => (
                      <TableRow key={c.code} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{c.country}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {c.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fmtCompact(c.clicks)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {fmtCompact(c.impressions)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ---------- Devices tab ---------- */}
        <TabsContent value="devices">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Clicks by Device</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mobile vs. desktop vs. tablet
                  </p>
                </div>
                <Badge variant="outline" className="font-mono text-[11px]">
                  {fmtCompact(totalDeviceClicks)} total
                </Badge>
              </div>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={92}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {deviceData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <RTooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                        padding: "8px 10px",
                      }}
                      formatter={(v: number, n: string) => [
                        `${v.toLocaleString()} clicks (${((v / totalDeviceClicks) * 100).toFixed(1)}%)`,
                        n,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {deviceData.map((d) => {
                  const Icon = DEVICE_ICON[d.name] ?? Monitor;
                  const pct = totalDeviceClicks
                    ? ((d.value / totalDeviceClicks) * 100).toFixed(1)
                    : "0";
                  return (
                    <div key={d.name} className="rounded-lg border bg-muted/20 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-3.5 h-3.5" style={{ color: d.color }} />
                        <span className="text-xs font-medium">{d.name}</span>
                      </div>
                      <div className="text-sm font-bold tabular-nums" style={{ color: d.color }}>
                        {pct}%
                      </div>
                      <div className="text-[10px] text-muted-foreground tabular-nums">
                        {fmtCompact(d.value)} clicks
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Device Breakdown</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Clicks & impressions per device type
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {devices.map((d) => {
                  const color = DEVICE_COLORS[d.device] ?? "#94a3b8";
                  const Icon = DEVICE_ICON[d.device] ?? Monitor;
                  const totalClicks = devices.reduce((s, x) => s + x.clicks, 0);
                  const pct = totalClicks ? (d.clicks / totalClicks) * 100 : 0;
                  return (
                    <div key={d.device} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color }} />
                          <span className="font-medium">{d.device}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                          <span>{fmtCompact(d.impressions)} impr.</span>
                          <span className="font-semibold text-foreground">{fmtCompact(d.clicks)} clicks</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
