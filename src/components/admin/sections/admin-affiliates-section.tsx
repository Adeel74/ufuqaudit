"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  Users, RefreshCw, Eye, Copy, CheckCircle2, Ban, Wallet,
  Loader2, Save, Trophy, MousePointerClick,
} from "lucide-react";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState, EMERALD_BTN,
  formatCompact, formatCurrency, formatDateLong, relativeTime, initials,
} from "../admin-helpers";

// ----- API types -----
type AffiliateStatus = "active" | "pending" | "suspended";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  status: AffiliateStatus;
  referralCode: string;
  clicks: number;
  signups: number;
  paidCustomers: number;
  revenue: number;
  commissionRate: number;
  commissionEarned: number;
  pendingPayout: number;
  paidOut: number;
  joinedAt: string;
}

interface AffiliateStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  totalClicks: number;
  totalSignups: number;
  totalPaid: number;
  totalRevenue: number;
  totalCommission: number;
  pendingPayouts: number;
  conversionRate: number;
}

interface AffiliateSettings {
  defaultCommission: number;
  cookieDuration: number;
  minPayout: number;
}

interface AffiliateResponse {
  affiliates: Affiliate[];
  stats: AffiliateStats;
  settings: AffiliateSettings;
}

const STATUS_BADGE: Record<AffiliateStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  suspended: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
};

export function AdminAffiliatesSection({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = React.useState<AffiliateResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [profileAff, setProfileAff] = React.useState<Affiliate | null>(null);
  const [payoutAff, setPayoutAff] = React.useState<Affiliate | null>(null);
  const [suspendAff, setSuspendAff] = React.useState<Affiliate | null>(null);

  const [defaultCommission, setDefaultCommission] = React.useState(20);
  const [cookieDuration, setCookieDuration] = React.useState(30);
  const [minPayout, setMinPayout] = React.useState(50);
  const [savingSettings, setSavingSettings] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/affiliates").then((r) => r.json() as Promise<AffiliateResponse>);
      setData(r);
      setDefaultCommission(r.settings.defaultCommission);
      setCookieDuration(r.settings.cookieDuration);
      setMinPayout(r.settings.minPayout);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load affiliates");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const stats = data?.stats;
  const affiliates = data?.affiliates ?? [];

  const chartData = React.useMemo(() => {
    return affiliates.slice(0, 6).map((a) => ({
      name: a.name.split(" ")[0],
      revenue: a.revenue,
      commission: a.commissionEarned,
    }));
  }, [affiliates]);

  const topAffiliates = React.useMemo(() => {
    return [...affiliates].sort((a, b) => b.commissionEarned - a.commissionEarned).slice(0, 3);
  }, [affiliates]);

  function patchAff(id: string, patch: Partial<Affiliate>) {
    setData((prev) =>
      prev
        ? { ...prev, affiliates: prev.affiliates.map((a) => (a.id === id ? { ...a, ...patch } : a)) }
        : prev,
    );
  }

  function copyCode(a: Affiliate) {
    void navigator.clipboard.writeText(a.referralCode).then(() => {
      toast.success(`Copied referral code ${a.referralCode}`);
    });
  }

  function approveAff(a: Affiliate) {
    patchAff(a.id, { status: "active" });
    toast.success(`Approved ${a.name}`);
  }

  function suspendAffFinal() {
    if (!suspendAff) return;
    const next: AffiliateStatus = suspendAff.status === "suspended" ? "active" : "suspended";
    patchAff(suspendAff.id, { status: next });
    toast.success(next === "suspended" ? `Suspended ${suspendAff.name}` : `Reactivated ${suspendAff.name}`);
    setSuspendAff(null);
  }

  function saveSettings() {
    setSavingSettings(true);
    setTimeout(() => {
      setData((prev) =>
        prev
          ? {
              ...prev,
              settings: {
                defaultCommission,
                cookieDuration,
                minPayout,
              },
            }
          : prev,
      );
      setSavingSettings(false);
      toast.success("Affiliate settings saved (demo)");
    }, 400);
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Affiliates"
        subtitle="Referral program & commission tracking"
        icon={Users}
        actions={
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Affiliates" value={stats?.total ?? 0} icon={Users} color="#10b981" />
        <StatCard label="Active" value={stats?.active ?? 0} icon={CheckCircle2} color="#14b8a6" />
        <StatCard label="Total Clicks" value={formatCompact(stats?.totalClicks ?? 0)} icon={MousePointerClick} color="#8b5cf6" />
        <StatCard label="Conversion Rate" value={`${stats?.conversionRate ?? 0}%`} icon={Trophy} color="#f59e0b" />
        <StatCard label="Pending Payouts" value={formatCurrency(stats?.pendingPayouts ?? 0)} icon={Wallet} color="#ef4444" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Affiliates table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-emerald-600" /> Affiliates
              <Badge variant="secondary" className="ml-1">{affiliates.length}</Badge>
            </h3>
            <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[60vh]`}>
              {loading ? (
                <SkeletonRows rows={4} cols={10} />
              ) : affiliates.length === 0 ? (
                <EmptyState msg="No affiliates yet" icon={Users} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Affiliate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Referral Code</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Signups</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Earned</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead className="text-right">Paid Out</TableHead>
                      <TableHead className="whitespace-nowrap">Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="zebra">
                    {affiliates.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {initials(a.name, a.email)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{a.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{a.email}</div>
                          </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`capitalize text-xs ${STATUS_BADGE[a.status]}`}>
                            {a.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => copyCode(a)}
                            className="font-mono text-xs font-bold tracking-wider px-2 py-1 rounded border bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                            title="Click to copy"
                          >
                            {a.referralCode}
                          </button>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{formatCompact(a.clicks)}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{formatCompact(a.signups)}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{a.paidCustomers}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{formatCurrency(a.revenue)}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{a.commissionRate}%</TableCell>
                        <TableCell className="text-right tabular-nums text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(a.commissionEarned)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs text-amber-600 dark:text-amber-400">
                          {formatCurrency(a.pendingPayout)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs text-muted-foreground">
                          {formatCurrency(a.paidOut)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {relativeTime(a.joinedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={() => setProfileAff(a)}
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            {a.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-emerald-600 hover:text-emerald-700"
                                onClick={() => approveAff(a)}
                                title="Approve"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {a.status !== "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-amber-600 hover:text-amber-700"
                                onClick={() => setSuspendAff(a)}
                                title={a.status === "suspended" ? "Reactivate" : "Suspend"}
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-emerald-600 hover:text-emerald-700"
                              onClick={() => setPayoutAff(a)}
                              title="Pay out"
                              disabled={a.pendingPayout <= 0}
                            >
                              <Wallet className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>

          {/* Revenue vs commission chart */}
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-emerald-600" /> Revenue vs Commission
              <span className="text-xs text-muted-foreground font-normal">(top 6 affiliates)</span>
            </h3>
            {loading ? (
              <SkeletonRows rows={3} cols={3} />
            ) : chartData.length === 0 ? (
              <EmptyState msg="No affiliates to chart" icon={Wallet} />
            ) : (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `$${formatCompact(v)}`}
                    />
                    <Tooltip
                      cursor={{ fill: "#10b98115" }}
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="commission" name="Commission" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* Settings sidebar */}
        <div className="space-y-4 lg:sticky lg:top-2 lg:self-start">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Save className="w-4 h-4 text-emerald-600" /> Program Settings
            </h3>
            <div className="space-y-3">
              <div className="grid gap-1.5">
                <Label htmlFor="set-commission" className="text-xs">Default commission rate (%)</Label>
                <Input
                  id="set-commission"
                  type="number"
                  min={0}
                  max={100}
                  value={defaultCommission}
                  onChange={(e) => setDefaultCommission(Number(e.target.value))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="set-cookie" className="text-xs">Cookie duration (days)</Label>
                <Input
                  id="set-cookie"
                  type="number"
                  min={1}
                  max={365}
                  value={cookieDuration}
                  onChange={(e) => setCookieDuration(Number(e.target.value))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="set-payout" className="text-xs">Minimum payout ($)</Label>
                <Input
                  id="set-payout"
                  type="number"
                  min={0}
                  value={minPayout}
                  onChange={(e) => setMinPayout(Number(e.target.value))}
                />
              </div>
              <Button size="sm" className={`w-full ${EMERALD_BTN}`} disabled={savingSettings} onClick={saveSettings}>
                {savingSettings && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                Save settings
              </Button>
            </div>
          </Card>

          {/* Top affiliates leaderboard */}
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-500" /> Top Affiliates
            </h3>
            <div className="space-y-2">
              {topAffiliates.length === 0 ? (
                <EmptyState msg="No data yet" icon={Trophy} />
              ) : (
                topAffiliates.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                      : i === 1 ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{a.name}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {formatCompact(a.clicks)} clicks · {a.paidCustomers} paid
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(a.commissionEarned)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">earned</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Profile sheet */}
      <Sheet open={!!profileAff} onOpenChange={(o) => { if (!o) setProfileAff(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {profileAff && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center text-sm font-bold">
                    {initials(profileAff.name, profileAff.email)}
                  </div>
                  <div>
                    <div className="text-base font-semibold">{profileAff.name}</div>
                    <div className="text-xs font-normal text-muted-foreground">{profileAff.email}</div>
                  </div>
                </SheetTitle>
                <SheetDescription>
                  Affiliate ID <span className="font-mono">{profileAff.id}</span>
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-[10px] text-muted-foreground">Status</div>
                    <Badge variant="outline" className={`mt-1 capitalize text-xs ${STATUS_BADGE[profileAff.status]}`}>
                      {profileAff.status}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-[10px] text-muted-foreground">Joined</div>
                    <div className="text-sm font-medium mt-1">{formatDateLong(profileAff.joinedAt)}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="text-[10px] text-muted-foreground mb-1">Referral code</div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono text-base font-bold tracking-wider">{profileAff.referralCode}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyCode(profileAff)}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm font-semibold mb-3">Performance</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Row label="Clicks" value={formatCompact(profileAff.clicks)} />
                    <Row label="Signups" value={formatCompact(profileAff.signups)} />
                    <Row label="Paid customers" value={String(profileAff.paidCustomers)} />
                    <Row label="Revenue" value={formatCurrency(profileAff.revenue)} />
                    <Row label="Commission rate" value={`${profileAff.commissionRate}%`} />
                    <Row label="Conversion" value={`${profileAff.signups > 0 ? ((profileAff.paidCustomers / profileAff.signups) * 100).toFixed(1) : 0}%`} />
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50">
                  <div className="text-sm font-semibold mb-3">Payouts</div>
                  <div className="space-y-1.5 text-sm">
                    <Row label="Earned (total)" value={formatCurrency(profileAff.commissionEarned)} highlight />
                    <Row label="Pending payout" value={formatCurrency(profileAff.pendingPayout)} highlight />
                    <Row label="Paid out" value={formatCurrency(profileAff.paidOut)} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className={`flex-1 ${EMERALD_BTN}`}
                    disabled={profileAff.pendingPayout <= 0}
                    onClick={() => {
                      setPayoutAff(profileAff);
                      setProfileAff(null);
                    }}
                  >
                    <Wallet className="w-3.5 h-3.5 mr-1" /> Pay out
                  </Button>
                  {profileAff.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        approveAff(profileAff);
                        setProfileAff(null);
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                  )}
                  {profileAff.status !== "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSuspendAff(profileAff);
                        setProfileAff(null);
                      }}
                    >
                      <Ban className="w-3.5 h-3.5 mr-1" /> {profileAff.status === "suspended" ? "Reactivate" : "Suspend"}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <PayoutDialog
        affiliate={payoutAff}
        onClose={() => setPayoutAff(null)}
        onConfirm={(amount) => {
          if (!payoutAff) return;
          patchAff(payoutAff.id, {
            pendingPayout: Math.max(0, payoutAff.pendingPayout - amount),
            paidOut: payoutAff.paidOut + amount,
          });
          toast.success(`Paid ${formatCurrency(amount)} to ${payoutAff.name} (demo)`);
          setPayoutAff(null);
        }}
      />

      <AlertDialog open={!!suspendAff} onOpenChange={(o) => { if (!o) setSuspendAff(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{suspendAff?.status === "suspended" ? "Reactivate affiliate?" : "Suspend affiliate?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {suspendAff?.status === "suspended" ? (
                <>This will reactivate <span className="font-medium text-foreground">{suspendAff?.name}</span>'s account and they will be able to resume earning commissions.</>
              ) : (
                <>This will suspend <span className="font-medium text-foreground">{suspendAff?.name}</span>'s account. Their referral links will stop tracking new conversions. Pending payouts will be retained.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                suspendAffFinal();
              }}
              className={
                suspendAff?.status === "suspended"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }
            >
              {suspendAff?.status === "suspended" ? "Reactivate" : "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums font-medium ${highlight ? "text-emerald-700 dark:text-emerald-400" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function PayoutDialog({
  affiliate,
  onClose,
  onConfirm,
}: {
  affiliate: Affiliate | null;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}) {
  const [amount, setAmount] = React.useState(0);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setAmount(affiliate ? Math.round(affiliate.pendingPayout * 100) / 100 : 0);
  }, [affiliate]);

  return (
    <Dialog open={!!affiliate} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process payout</DialogTitle>
          <DialogDescription>
            Pay <span className="font-medium text-foreground">{affiliate?.name}</span> from their pending commission balance.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-card">
              <div className="text-[10px] text-muted-foreground">Pending</div>
              <div className="text-sm font-bold mt-1 tabular-nums">
                {formatCurrency(affiliate?.pendingPayout ?? 0)}
              </div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="text-[10px] text-muted-foreground">Total earned</div>
              <div className="text-sm font-bold mt-1 tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatCurrency(affiliate?.commissionEarned ?? 0)}
              </div>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="po-amount">Amount to pay ($)</Label>
            <Input
              id="po-amount"
              type="number"
              min={0}
              max={affiliate?.pendingPayout ?? 0}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <p className="text-[10px] text-muted-foreground">
              Max: {formatCurrency(affiliate?.pendingPayout ?? 0)}
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={saving}>Cancel</Button>
          </DialogClose>
          <Button
            className={EMERALD_BTN}
            disabled={saving || amount <= 0 || amount > (affiliate?.pendingPayout ?? 0)}
            onClick={() => {
              setSaving(true);
              setTimeout(() => {
                onConfirm(amount);
                setSaving(false);
              }, 400);
            }}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            <Wallet className="w-3.5 h-3.5 mr-1" /> Process payout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
