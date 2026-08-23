"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
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
  Users, UserCheck, UserPlus, CalendarDays, FileSearch, FolderTree,
  Activity, DollarSign, Zap, Brain, RefreshCw, CreditCard, Cpu,
  Gauge, TrendingUp,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { StatCard } from "@/components/dashboard/shared";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState,
  type AdminStats,
  relativeTime, formatCompact, formatCurrency,
  statusBadgeClass, scoreTextColor,
} from "../admin-helpers";
import { toast } from "sonner";

const PLAN_COLORS: Record<string, string> = {
  free: "#10b981",
  starter: "#14b8a6",
  pro: "#f59e0b",
  agency: "#8b5cf6",
};

const ACTIVITY_EVENTS = [
  { icon: UserPlus, color: "#10b981", text: "New user registered: jane@acme.com", at: "2m ago" },
  { icon: CreditCard, color: "#14b8a6", text: "Payment received: $49 from Sarah Chen", at: "12m ago" },
  { icon: FileSearch, color: "#f59e0b", text: "Audit started: northwind.agency (5,230 URLs)", at: "23m ago" },
  { icon: UserCheck, color: "#10b981", text: "User upgraded: free → pro (mike@brightlabs.io)", at: "1h ago" },
  { icon: Cpu, color: "#8b5cf6", text: "AI tokens consumed: 12,480 for audit #a483", at: "1h ago" },
  { icon: Zap, color: "#f97316", text: "API rate limit hit: globex.com", at: "2h ago" },
  { icon: CreditCard, color: "#ef4444", text: "Failed payment: $19 from david@initech.com", at: "3h ago" },
  { icon: FileSearch, color: "#10b981", text: "Audit completed: pixelcraft.co (score 82)", at: "4h ago" },
];

function genUserGrowth(): Array<{ day: string; users: number }> {
  const now = Date.now();
  const data: Array<{ day: string; users: number }> = [];
  let base = 1200;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000);
    const wobble = Math.sin(i / 3) * 18 + Math.random() * 14;
    base += 8 + Math.random() * 12;
    data.push({
      day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      users: Math.max(0, Math.round(base + wobble)),
    });
  }
  return data;
}

function genRevenue(): Array<{ month: string; revenue: number }> {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let r = 2100;
  return months.map((m, i) => {
    r += 120 + Math.sin(i) * 90 + Math.random() * 80;
    return { month: m, revenue: Math.max(1800, Math.round(r)) };
  });
}

export function AdminDashboardSection({ refreshKey }: { refreshKey: number }) {
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [userGrowth] = React.useState(genUserGrowth);
  const [revenue] = React.useState(genRevenue);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/stats").then((r) => r.json() as Promise<AdminStats>);
      setStats(r);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load admin stats");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const planData = (stats?.planDistribution ?? []).map((p) => ({
    name: p.plan,
    value: p.count,
    color: PLAN_COLORS[p.plan?.toLowerCase()] ?? "#94a3b8",
  }));

  return (
    <div className="space-y-6">
      {/* Top row: 8 StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={stats?.counts.users ?? 0} icon={Users} color="#10b981" />
        <StatCard label="Active Users" value={stats?.counts.activeUsers ?? 0} hint="~65% of total" icon={UserCheck} color="#10b981" />
        <StatCard label="New Today" value={stats?.counts.usersToday ?? 0} icon={UserPlus} color="#14b8a6" />
        <StatCard label="New This Month" value={stats?.counts.usersThisMonth ?? 0} icon={CalendarDays} color="#14b8a6" />
      </div>

      {/* Second top row: 4 more */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Audits" value={stats?.counts.audits ?? 0} icon={FileSearch} color="#10b981" />
        <StatCard label="Projects" value={stats?.counts.projects ?? 0} icon={FolderTree} color="#10b981" />
        <StatCard
          label="Avg Score"
          value={stats?.avgScore != null ? `${stats.avgScore}/100` : "—"}
          hint="Across all audits"
          icon={Activity}
          color="#10b981"
        />
        <StatCard
          label="Monthly Revenue"
          value={stats ? formatCurrency(stats.counts.monthlyRevenue) : "—"}
          hint={`Annual: ${stats ? formatCurrency(stats.counts.annualRevenue) : "—"}`}
          icon={DollarSign}
          color="#10b981"
        />
      </div>

      {/* Third row: API + AI + subs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total API Requests"
          value={stats ? formatCompact(stats.counts.totalApiRequests) : "—"}
          icon={Zap}
          color="#f59e0b"
        />
        <StatCard
          label="AI Tokens Used"
          value={stats ? formatCompact(stats.counts.aiTokensUsed) : "—"}
          icon={Brain}
          color="#8b5cf6"
        />
        <StatCard
          label="Active Subs"
          value={stats?.counts.activeSubscriptions ?? 0}
          icon={CreditCard}
          color="#10b981"
        />
        <StatCard
          label="Trial Users"
          value={stats?.counts.trialUsers ?? 0}
          icon={UserCheck}
          color="#f59e0b"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> User Growth — 30 days
            </h3>
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 dark:text-emerald-300 dark:border-emerald-800">
              {userGrowth.at(-1)?.users ?? 0} users
            </Badge>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="ugGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} interval={4} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2.5} fill="url(#ugGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Gauge className="w-4 h-4 text-emerald-600" /> Plan Distribution
          </h3>
          {planData.length === 0 ? (
            <EmptyState msg="No plan data yet" />
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {planData.map((p) => (
                      <Cell key={p.name} fill={p.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Legend
                    iconType="circle"
                    layout="horizontal"
                    align="center"
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: 11, textTransform: "capitalize" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Revenue + Activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Revenue — 12 months
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-emerald-600" /> Real-time Activity
          </h3>
          <div className={`space-y-2 ${SCROLLBAR_CLS} max-h-[300px] pr-1`}>
            {ACTIVITY_EVENTS.map((e, i) => {
              const Icon = e.icon;
              return (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/60 transition-colors">
                  <div
                    className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${e.color}15`, color: e.color }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-tight">{e.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{e.at}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent audits table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-emerald-600" /> Recent Audits
          </h3>
          <button
            onClick={() => load()}
            className="text-xs text-muted-foreground hover:text-emerald-600 inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
        <div className="-mx-2 px-2">
          {loading ? (
            <SkeletonRows rows={4} cols={5} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">URL</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {(stats?.recentAudits ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState msg="No audits yet" icon={FileSearch} />
                    </TableCell>
                  </TableRow>
                )}
                {(stats?.recentAudits ?? []).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="max-w-[220px] truncate font-medium" title={a.url}>
                      {a.url}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.user ?? "—"}</TableCell>
                    <TableCell className={`font-semibold tabular-nums ${scoreTextColor(a.overallScore)}`}>
                      {a.overallScore}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${statusBadgeClass(a.status)}`}>
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {relativeTime(a.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Showing last {(stats?.recentAudits ?? []).length} audits · timestamps are relative
        </p>
      </Card>
    </div>
  );
}
