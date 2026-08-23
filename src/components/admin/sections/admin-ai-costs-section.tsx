"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  DollarSign, RefreshCw, Activity, Coins, Wallet, Gauge,
  TrendingDown, Save, AlertTriangle,
} from "lucide-react";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState, EMERALD_BTN,
  formatCompact, formatCurrency,
} from "../admin-helpers";

// ----- API types -----
interface AICostSummary {
  totalTokens: number;
  totalCost: number;
  monthlyBudget: number;
  budgetUsed: number;
  budgetRemaining: number;
  requests: number;
  avgCostPerRequest: number;
}

interface DailyCostRow {
  date: string;
  tokens: number;
  cost: number;
}

interface CostPerModelRow {
  model: string;
  tokens: number;
  cost: number;
  color: string;
}

interface CostPerFeatureRow {
  feature: string;
  tokens: number;
  cost: number;
}

interface TopUserRow {
  user: string;
  email: string;
  org: string;
  tokens: number;
  cost: number;
}

interface AICostsResponse {
  summary: AICostSummary;
  dailyCost: DailyCostRow[];
  costPerModel: CostPerModelRow[];
  costPerFeature: CostPerFeatureRow[];
  topUsers: TopUserRow[];
}

export function AdminAICostsSection({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = React.useState<AICostsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  // Budget controls (local state — no API endpoint, demo)
  const [monthlyBudget, setMonthlyBudget] = React.useState(1000);
  const [perUserLimit, setPerUserLimit] = React.useState(50);
  const [maxTokensPerReq, setMaxTokensPerReq] = React.useState(4096);
  const [autoFallback, setAutoFallback] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/ai-costs").then(
        (r) => r.json() as Promise<AICostsResponse>,
      );
      setData(r);
      setMonthlyBudget(r.summary?.monthlyBudget ?? 1000);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load AI cost data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const summary = data?.summary;
  const budgetUsed = summary?.budgetUsed ?? 0;
  const budgetBarColor =
    budgetUsed >= 90
      ? "bg-red-500"
      : budgetUsed >= 70
        ? "bg-amber-500"
        : "bg-emerald-500";
  const budgetTextColor =
    budgetUsed >= 90
      ? "text-red-600 dark:text-red-400"
      : budgetUsed >= 70
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400";

  const totalCost = summary?.totalCost ?? 0;
  const topUsers = data?.topUsers ?? [];
  const maxUserCost = Math.max(...topUsers.map((u) => u.cost), 1);
  const sortedFeatures = React.useMemo(
    () => [...(data?.costPerFeature ?? [])].sort((a, b) => b.cost - a.cost),
    [data?.costPerFeature],
  );

  function saveBudget() {
    toast.success("Budget settings saved (demo)");
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="AI Costs"
        subtitle="Monitor token usage, costs & budgets"
        icon={DollarSign}
        actions={
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        }
      />

      {/* Top stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Tokens" value={formatCompact(summary?.totalTokens ?? 0)} icon={Coins} color="#10b981" />
        <StatCard label="Total Cost" value={formatCurrency(summary?.totalCost ?? 0)} icon={DollarSign} color="#14b8a6" />
        <StatCard label="Monthly Budget" value={formatCurrency(monthlyBudget)} icon={Wallet} color="#6366f1" />
        <StatCard
          label="Budget Used"
          value={`${summary?.budgetUsed ?? 0}%`}
          icon={Gauge}
          color={budgetUsed >= 90 ? "#ef4444" : budgetUsed >= 70 ? "#f59e0b" : "#10b981"}
        />
        <StatCard label="Avg / Request" value={formatCurrency(summary?.avgCostPerRequest ?? 0)} icon={Activity} color="#8b5cf6" />
      </div>

      {/* Budget progress */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" /> Monthly Budget
          </h3>
          <div className="flex items-center gap-3 text-sm">
            <span className={`tabular-nums font-bold ${budgetTextColor}`}>
              {formatCurrency(totalCost)} / {formatCurrency(monthlyBudget)}
            </span>
            <Badge variant="outline" className={`tabular-nums ${budgetTextColor}`}>
              {budgetUsed}%
            </Badge>
          </div>
        </div>
        <div className="relative w-full h-4 rounded-full bg-muted overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full transition-all ${budgetBarColor}`}
            style={{ width: `${Math.min(100, budgetUsed)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>Remaining: {formatCurrency(summary?.budgetRemaining ?? 0)}</span>
          <span>
            Requests: {formatCompact(summary?.requests ?? 0)} ·{" "}
            Avg cost / req: {formatCurrency(summary?.avgCostPerRequest ?? 0)}
          </span>
        </div>
        {budgetUsed >= 70 && (
          <div className="mt-3 flex items-start gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              {budgetUsed >= 90
                ? "Budget nearly exhausted. Consider increasing the monthly limit or enabling model fallback."
                : "Approaching budget limit. Enable auto-fallback to cheaper models to extend runway."}
            </span>
          </div>
        )}
      </Card>

      {/* 30-day cost chart */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <TrendingDown className="w-4 h-4 text-emerald-600" /> AI Cost — 30 days
        </h3>
        {loading || !data ? (
          <div className="h-[250px] flex items-center">
            <SkeletonRows rows={4} cols={6} />
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyCost} margin={{ top: 8, right: 0, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="aiCostGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  yAxisId="cost"
                  orientation="left"
                  stroke="#10b981"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <YAxis
                  yAxisId="tokens"
                  orientation="right"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => formatCompact(v)}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(value: number, name: string) => {
                    if (name === "cost") return [`$${value.toFixed(2)}`, "Cost"];
                    return [formatCompact(value), "Tokens"];
                  }}
                />
                <Area
                  yAxisId="cost"
                  type="monotone"
                  dataKey="cost"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#aiCostGrad)"
                />
                <Area
                  yAxisId="tokens"
                  type="monotone"
                  dataKey="tokens"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost per model — horizontal bar */}
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Coins className="w-4 h-4 text-emerald-600" /> Cost per Model
          </h3>
          {loading || !data ? (
            <SkeletonRows rows={4} cols={2} />
          ) : data.costPerModel.length === 0 ? (
            <EmptyState msg="No model usage yet" icon={Coins} />
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.costPerModel}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="model"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={150}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]}
                  />
                  <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                    {data.costPerModel.map((m) => (
                      <Cell key={m.model} fill={m.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Cost per feature */}
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-emerald-600" /> Cost per Feature
          </h3>
          {loading || !data ? (
            <SkeletonRows rows={6} cols={2} />
          ) : sortedFeatures.length === 0 ? (
            <EmptyState msg="No feature usage yet" icon={Activity} />
          ) : (
            <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[260px]`}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="zebra">
                  {sortedFeatures.map((f) => (
                    <TableRow key={f.feature}>
                      <TableCell className="text-sm font-medium">{f.feature}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{formatCompact(f.tokens)}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-mono">${f.cost.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Top users by cost */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-emerald-600" /> Top Users by AI Cost
        </h3>
        <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[40vh]`}>
          {loading || !data ? (
            <SkeletonRows rows={5} cols={5} />
          ) : topUsers.length === 0 ? (
            <EmptyState msg="No AI usage recorded yet" icon={Activity} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right whitespace-nowrap">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {topUsers.map((u) => {
                  const pct = totalCost > 0 ? (u.cost / totalCost) * 100 : 0;
                  return (
                    <TableRow key={u.email}>
                      <TableCell>
                        <div className="font-medium text-sm">{u.user}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </TableCell>
                      <TableCell className="text-sm">{u.org}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{formatCompact(u.tokens)}</TableCell>
                      <TableCell className="text-right tabular-nums font-mono text-sm">{formatCurrency(u.cost)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${(u.cost / maxUserCost) * 100}%` }}
                            />
                          </div>
                          <span className="tabular-nums text-xs w-10 text-right">{pct.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Budget controls */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Wallet className="w-4 h-4 text-emerald-600" /> Budget Controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="ac-budget">Monthly budget ($)</Label>
            <Input
              id="ac-budget"
              type="number"
              min={0}
              step={10}
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(Number(e.target.value))}
            />
            <span className="text-[10px] text-muted-foreground">Platform-wide monthly AI spend cap</span>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ac-user">Per-user AI credit limit ($)</Label>
            <Input
              id="ac-user"
              type="number"
              min={0}
              step={1}
              value={perUserLimit}
              onChange={(e) => setPerUserLimit(Number(e.target.value))}
            />
            <span className="text-[10px] text-muted-foreground">Caps each user&apos;s monthly AI spend</span>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ac-tokens">Max tokens / request</Label>
            <Input
              id="ac-tokens"
              type="number"
              min={256}
              step={256}
              value={maxTokensPerReq}
              onChange={(e) => setMaxTokensPerReq(Number(e.target.value))}
            />
            <span className="text-[10px] text-muted-foreground">Single-request hard cap</span>
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card mt-4">
          <div className="flex items-start gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-medium">Auto-fallback to cheaper models</div>
              <div className="text-xs text-muted-foreground">
                Switch to cheaper models when budget exceeded (preserves feature availability)
              </div>
            </div>
          </div>
          <Switch checked={autoFallback} onCheckedChange={setAutoFallback} />
        </div>
        <Button onClick={saveBudget} className={`mt-4 ${EMERALD_BTN}`}>
          <Save className="w-3.5 h-3.5 mr-1" /> Save budget settings
        </Button>
      </Card>
    </div>
  );
}
