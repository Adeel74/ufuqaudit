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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import {
  DollarSign, RefreshCw, MoreVertical, FileText, Undo2,
  CreditCard, TrendingUp, Wallet, AlertCircle, Settings,
} from "lucide-react";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState,
  type TxRow, type TxStats,
  formatDateLong, formatCurrency, statusBadgeClass, providerBadgeClass,
} from "../admin-helpers";

function genRevenueTrend(): Array<{ month: string; revenue: number; net: number }> {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let base = 2200;
  return months.map((m, i) => {
    base += 130 + Math.sin(i) * 90 + Math.random() * 70;
    const net = base - 80 - Math.random() * 60;
    return { month: m, revenue: Math.round(base), net: Math.max(1800, Math.round(net)) };
  });
}

interface ProviderInfo {
  name: string;
  status: "connected" | "disconnected";
  badgeClass: string;
}

const PROVIDERS: ProviderInfo[] = [
  { name: "Stripe", status: "connected", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" },
  { name: "Paddle", status: "connected", badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" },
  { name: "PayPal", status: "disconnected", badgeClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700" },
];

export function AdminBillingSection({ refreshKey }: { refreshKey: number }) {
  const [tx, setTx] = React.useState<TxRow[]>([]);
  const [stats, setStats] = React.useState<TxStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refundTx, setRefundTx] = React.useState<TxRow | null>(null);
  const [refunding, setRefunding] = React.useState(false);
  const [revenueTrend] = React.useState(genRevenueTrend);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/transactions").then((r) => r.json() as Promise<{ transactions: TxRow[]; stats: TxStats }>);
      setTx(r.transactions ?? []);
      setStats(r.stats ?? null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function refund() {
    if (!refundTx) return;
    setRefunding(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success(`Refund issued for ${refundTx.id} (${formatCurrency(refundTx.amount)})`);
    setRefundTx(null);
    setRefunding(false);
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Billing & Payments"
        subtitle="Track revenue, transactions and payment providers"
        icon={DollarSign}
        actions={
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Revenue" value={stats ? formatCurrency(stats.totalRevenue) : "—"} icon={DollarSign} color="#10b981" />
        <StatCard label="MRR" value={stats ? formatCurrency(stats.mrr) : "—"} icon={TrendingUp} color="#14b8a6" />
        <StatCard label="Net Revenue" value={stats ? formatCurrency(stats.netRevenue) : "—"} icon={Wallet} color="#10b981" />
        <StatCard label="Refunds" value={stats ? formatCurrency(stats.refunds) : "—"} icon={Undo2} color="#f97316" />
        <StatCard label="Failed Payments" value={stats?.failed ?? 0} icon={AlertCircle} color="#ef4444" />
      </div>

      {/* Revenue chart */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-emerald-600" /> Revenue Trend — 12 months
        </h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="net" stroke="#14b8a6" strokeWidth={2} fill="url(#netGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Gross revenue
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500" /> Net (after refunds)
          </span>
        </div>
      </Card>

      {/* Transactions table */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-emerald-600" /> Transactions
          <Badge variant="secondary" className="ml-1">{tx.length}</Badge>
        </h3>
        <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[50vh]`}>
          {loading ? (
            <SkeletonRows rows={6} cols={8} />
          ) : tx.length === 0 ? (
            <EmptyState msg="No transactions yet" icon={CreditCard} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Transaction ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {tx.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.id}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{t.user}</div>
                      <div className="text-xs text-muted-foreground">{t.email}</div>
                    </TableCell>
                    <TableCell className="text-xs">{t.org}</TableCell>
                    <TableCell className="text-xs">{t.plan}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatCurrency(t.amount, t.currency)}</TableCell>
                    <TableCell className="text-xs">{t.currency}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={providerBadgeClass(t.provider)}>
                        {t.provider}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${statusBadgeClass(t.status)}`}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDateLong(t.date)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toast.info(`Generating invoice ${t.id} (demo)`)}>
                            <FileText className="w-3.5 h-3.5 mr-2" /> View invoice
                          </DropdownMenuItem>
                          {t.status === "paid" && (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setRefundTx(t)}
                            >
                              <Undo2 className="w-3.5 h-3.5 mr-2" /> Refund
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Payment providers */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 text-emerald-600" /> Payment Providers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PROVIDERS.map((p) => (
            <div key={p.name} className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">{p.name}</span>
                </div>
                <Badge variant="outline" className={`capitalize ${p.badgeClass}`}>
                  {p.status}
                </Badge>
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={() => toast.info(`Configure ${p.name} (demo)`)}>
                <Settings className="w-3.5 h-3.5 mr-1" /> Configure
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <AlertDialog open={!!refundTx} onOpenChange={(o) => { if (!o) setRefundTx(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Issue refund?</AlertDialogTitle>
            <AlertDialogDescription>
              This will refund{" "}
              <span className="font-medium text-foreground">{refundTx ? formatCurrency(refundTx.amount, refundTx.currency) : ""}</span>{" "}
              for transaction <span className="font-mono text-foreground">{refundTx?.id}</span>{" "}
              to <span className="font-medium text-foreground">{refundTx?.user}</span>. The payment will be marked as refunded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={refunding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void refund();
              }}
              disabled={refunding}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {refunding ? "Refunding…" : "Refund"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
