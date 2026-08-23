"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  LabelList,
} from "recharts";
import { toast } from "sonner";
import {
  BarChart3,
  RefreshCw,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Globe,
  Crown,
  Trophy,
} from "lucide-react";
import {
  SCROLLBAR_CLS,
  SkeletonRows,
  EmptyState,
  formatCompact,
  formatCurrency,
  relativeTime,
  scoreHex,
} from "../admin-helpers";

// ----- API types -----
interface UserGrowthRow {
  month: string;
  newUsers: number;
  totalUsers: number;
  churned: number;
}

interface RevenueRow {
  month: string;
  mrr: number;
  newRevenue: number;
  refunds: number;
  net: number;
}

interface FeatureUsageRow {
  feature: string;
  users: number;
  percentage: number;
}

interface CohortRetentionRow {
  cohort: string;
  size: number;
  retention: Array<{ month: string; percentage: number }>;
}

interface PlanDistributionRow {
  plan: string;
  users: number;
  percentage: number;
  revenue: number;
  color: string;
}

interface ActiveUserRow {
  name: string;
  email: string;
  org: string;
  audits: number;
  logins: number;
  lastActive: string;
}

interface AuditedSiteRow {
  url: string;
  audits: number;
  avgScore: number;
  users: number;
}

interface AnalyticsSummary {
  totalUsers: number;
  totalMrr: number;
  avgRetention: number;
  totalRevenue: number;
}

interface AnalyticsResponse {
  userGrowth: UserGrowthRow[];
  revenue: RevenueRow[];
  featureUsage: FeatureUsageRow[];
  cohorts: CohortRetentionRow[];
  planDistribution: PlanDistributionRow[];
  mostActiveUsers: ActiveUserRow[];
  mostAuditedSites: AuditedSiteRow[];
  summary: AnalyticsSummary;
}

function retentionCellColor(pct: number): string {
  if (pct >= 80) return "bg-emerald-500 text-white";
  if (pct >= 60) return "bg-emerald-400 text-white";
  if (pct >= 40) return "bg-amber-400 text-white";
  if (pct >= 20) return "bg-orange-400 text-white";
  return "bg-red-400 text-white";
}

export function AdminAnalyticsSection({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = React.useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await
        fetch("/api/admin/advanced-analytics").then((r) => r.json() as Promise<AnalyticsResponse>);
      setData(r);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const summary = data?.summary;
  const userGrowth = data?.userGrowth ?? [];
  const revenue = data?.revenue ?? [];
  const featureUsage = React.useMemo(
    () => [...(data?.featureUsage ?? [])].sort((a, b) => b.users - a.users).slice(0, 10),
    [data?.featureUsage],
  );
  const cohorts = data?.cohorts ?? [];
  const planDist = data?.planDistribution ?? [];
  const activeUsers = data?.mostActiveUsers ?? [];
  const auditedSites = data?.mostAuditedSites ?? [];

  const maxCohortMonths = Math.max(0, ...cohorts.map((c) => c.retention.length));
  const cohortMonthHeaders = Array.from({ length: maxCohortMonths }, (_, i) => `M${i}`);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Advanced Analytics"
        subtitle="Cohort retention, feature usage & growth metrics"
        icon={BarChart3}
        actions={
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={formatCompact(summary?.totalUsers ?? 0)} icon={Users} color="#10b981" />
        <StatCard label="MRR" value={formatCurrency(summary?.totalMrr ?? 0)} icon={DollarSign} color="#14b8a6" />
        <StatCard label="Avg Retention" value={`${summary?.avgRetention ?? 0}%`} icon={Activity} color="#8b5cf6" />
        <StatCard label="Total Revenue" value={formatCurrency(summary?.totalRevenue ?? 0)} icon={TrendingUp} color="#0ea5e9" />
      </div>

      {/* User growth chart */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-emerald-600" /> User Growth — 12 months
        </h3>
        {loading || !data ? (
          <div className="h-[250px]">
            <SkeletonRows rows={4} cols={8} />
          </div>
        ) : userGrowth.length === 0 ? (
          <EmptyState msg="No growth data" icon={Users} />
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={userGrowth} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="newUsersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="churnedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompact(v)} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(value: number, name: string) => {
                    if (name === "totalUsers") return [formatCompact(value), "Total"];
                    if (name === "newUsers") return [formatCompact(value), "New"];
                    if (name === "churned") return [formatCompact(value), "Churned"];
                    return [formatCompact(value), name];
                  }}
                />
                <Area type="monotone" dataKey="newUsers" stackId="a" stroke="#10b981" strokeWidth={2} fill="url(#newUsersGrad)" />
                <Area type="monotone" dataKey="churned" stackId="a" stroke="#ef4444" strokeWidth={2} fill="url(#churnedGrad)" />
                <Line type="monotone" dataKey="totalUsers" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Revenue chart */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-emerald-600" /> Revenue — 12 months
        </h3>
        {loading || !data ? (
          <div className="h-[250px]">
            <SkeletonRows rows={4} cols={8} />
          </div>
        ) : revenue.length === 0 ? (
          <EmptyState msg="No revenue data" icon={DollarSign} />
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenue} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${formatCompact(v)}`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(value: number, name: string) => {
                    if (name === "mrr") return [`$${formatCompact(value)}`, "MRR"];
                    if (name === "refunds") return [`$${formatCompact(value)}`, "Refunds"];
                    if (name === "net") return [`$${formatCompact(value)}`, "Net"];
                    return [`$${formatCompact(value)}`, name];
                  }}
                />
                <Bar dataKey="mrr" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Bar dataKey="refunds" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Line type="monotone" dataKey="net" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Feature usage horizontal bar */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-emerald-600" /> Feature Usage — Top 10
        </h3>
        {loading || !data ? (
          <div className="h-[300px]">
            <SkeletonRows rows={6} cols={2} />
          </div>
        ) : featureUsage.length === 0 ? (
          <EmptyState msg="No feature usage yet" icon={Activity} />
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureUsage} layout="vertical" margin={{ top: 4, right: 32, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompact(v)} />
                <YAxis type="category" dataKey="feature" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={120} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(value: number) => [formatCompact(value), "Users"]}
                />
                <Bar dataKey="users" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  <LabelList dataKey="percentage" position="right" formatter={(v: number) => `${v}%`} style={{ fontSize: 10, fill: "#64748b" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Cohort retention heatmap */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-emerald-600" /> Cohort Retention Heatmap
        </h3>
        {loading || !data ? (
          <SkeletonRows rows={6} cols={7} />
        ) : cohorts.length === 0 ? (
          <EmptyState msg="No cohort data yet" icon={Activity} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="text-left p-2 font-medium text-muted-foreground">Cohort</th>
                  <th className="text-right p-2 font-medium text-muted-foreground">Size</th>
                  {cohortMonthHeaders.map((m) => (
                    <th key={m} className="p-2 font-medium text-muted-foreground text-center">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c) => (
                  <tr key={c.cohort}>
                    <td className="p-2 font-medium whitespace-nowrap">{c.cohort}</td>
                    <td className="p-2 text-right tabular-nums text-muted-foreground">{formatCompact(c.size)}</td>
                    {cohortMonthHeaders.map((m, idx) => {
                      const cell = c.retention[idx];
                      if (!cell) return <td key={m} className="p-1" />;
                      return (
                        <td key={m} className="p-1">
                          <div
                            className={`h-9 rounded flex items-center justify-center tabular-nums text-[11px] font-semibold ${retentionCellColor(cell.percentage)}`}
                            title={`${c.cohort} · ${m}: ${cell.percentage}%`}
                          >
                            {cell.percentage}%
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-muted-foreground">
              <span>Low</span>
              <div className="flex items-center gap-1">
                <div className="w-5 h-3 rounded bg-red-400" />
                <div className="w-5 h-3 rounded bg-orange-400" />
                <div className="w-5 h-3 rounded bg-amber-400" />
                <div className="w-5 h-3 rounded bg-emerald-400" />
                <div className="w-5 h-3 rounded bg-emerald-500" />
              </div>
              <span>High</span>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan distribution donut */}
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-emerald-600" /> Plan Distribution
          </h3>
          {loading || !data ? (
            <SkeletonRows rows={4} cols={2} />
          ) : planDist.length === 0 ? (
            <EmptyState msg="No plan data" icon={Crown} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planDist}
                      dataKey="users"
                      nameKey="plan"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {planDist.map((p) => (
                        <Cell key={p.plan} fill={p.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                      formatter={(value: number, _name: string, entry: { payload?: PlanDistributionRow }) => {
                        const p = entry?.payload;
                        return [`${formatCompact(value)} users (${p?.percentage ?? 0}%)`, p?.plan ?? ""];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {planDist.map((p) => (
                  <div key={p.plan} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: p.color }} />
                    <span className="text-sm capitalize flex-1">{p.plan}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatCompact(p.users)}
                    </span>
                    <span className="text-xs tabular-nums text-emerald-700 dark:text-emerald-400 w-16 text-right">
                      {formatCurrency(p.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Most active users table */}
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-emerald-600" /> Most Active Users
          </h3>
          <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[30vh]`}>
            {loading || !data ? (
              <SkeletonRows rows={5} cols={4} />
            ) : activeUsers.length === 0 ? (
              <EmptyState msg="No active users yet" icon={Trophy} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Org</TableHead>
                    <TableHead className="text-right">Audits</TableHead>
                    <TableHead className="text-right">Logins</TableHead>
                    <TableHead>Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="zebra">
                  {activeUsers.map((u) => (
                    <TableRow key={u.email}>
                      <TableCell>
                        <div className="font-medium text-sm">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </TableCell>
                      <TableCell className="text-xs">{u.org}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{formatCompact(u.audits)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{formatCompact(u.logins)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {relativeTime(u.lastActive)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>

      {/* Most audited sites */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-emerald-600" /> Most Audited Websites
        </h3>
        <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[30vh]`}>
          {loading || !data ? (
            <SkeletonRows rows={5} cols={4} />
          ) : auditedSites.length === 0 ? (
            <EmptyState msg="No audited sites yet" icon={Globe} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[260px]">URL</TableHead>
                  <TableHead className="text-right">Audits</TableHead>
                  <TableHead>Avg Score</TableHead>
                  <TableHead className="text-right">Users</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {auditedSites.map((s) => (
                  <TableRow key={s.url}>
                    <TableCell>
                      <code className="font-mono text-xs">{s.url}</code>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{formatCompact(s.audits)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="tabular-nums font-bold"
                        style={{ color: scoreHex(s.avgScore), borderColor: `${scoreHex(s.avgScore)}40` }}
                      >
                        {s.avgScore}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{formatCompact(s.users)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
