"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  CreditCard, RefreshCw, Search, MoreVertical, Eye, ArrowUpCircle,
  ArrowDownCircle, Ban, Pause, CalendarClock, Repeat, AlertCircle,
} from "lucide-react";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState,
  type SubRow, type SubStats,
  formatDateLong, formatCurrency, statusBadgeClass,
} from "../admin-helpers";

const STATUS_OPTIONS = ["all", "trial", "active", "past_due", "cancelled"] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

export function AdminSubscriptionsSection({ refreshKey }: { refreshKey: number }) {
  const [subs, setSubs] = React.useState<SubRow[]>([]);
  const [stats, setStats] = React.useState<SubStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [viewSub, setViewSub] = React.useState<SubRow | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/subscriptions").then((r) => r.json() as Promise<{ subs: SubRow[]; stats: SubStats }>);
      setSubs(r.subs ?? []);
      setStats(r.stats ?? null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const filtered = React.useMemo(() => {
    let list = subs;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((s) => s.user.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.org.toLowerCase().includes(q));
    if (statusFilter !== "all") list = list.filter((s) => s.status === statusFilter);
    return list;
  }, [subs, search, statusFilter]);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Subscriptions"
        subtitle="Manage active, trial and past-due subscriptions"
        icon={CreditCard}
        actions={
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Subs" value={stats?.total ?? 0} icon={CreditCard} color="#10b981" />
        <StatCard label="Active" value={stats?.active ?? 0} icon={CreditCard} color="#10b981" />
        <StatCard label="Trial" value={stats?.trial ?? 0} icon={CalendarClock} color="#f59e0b" />
        <StatCard label="Past Due" value={stats?.pastDue ?? 0} icon={AlertCircle} color="#f97316" />
        <StatCard label="MRR" value={stats ? formatCurrency(stats.mrr) : "—"} hint={`ARR: ${stats ? formatCurrency(stats.arr) : "—"}`} icon={CreditCard} color="#10b981" />
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by user, email or organization…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="past_due">Past due</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-emerald-600" /> Subscriptions
          <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
        </h3>
        <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[60vh]`}>
          {loading ? (
            <SkeletonRows rows={6} cols={8} />
          ) : filtered.length === 0 ? (
            <EmptyState msg="No subscriptions match your filters" icon={CreditCard} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">User</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="whitespace-nowrap">Created</TableHead>
                  <TableHead className="whitespace-nowrap">Renewal</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{s.user}</div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    </TableCell>
                    <TableCell className="text-xs">{s.org}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${planBadgeClassFromName(s.plan)}`}>
                        {s.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(s.amount)}</TableCell>
                    <TableCell className="text-xs capitalize">{s.cycle}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${statusBadgeClass(s.status)}`}>
                        {s.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDateLong(s.createdAt)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDateLong(s.renewalDate)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Manage subscription</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setViewSub(s)}>
                            <Eye className="w-3.5 h-3.5 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info(`Upgrade ${s.user} (demo)`)}>
                            <ArrowUpCircle className="w-3.5 h-3.5 mr-2" /> Upgrade
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info(`Downgrade ${s.user} (demo)`)}>
                            <ArrowDownCircle className="w-3.5 h-3.5 mr-2" /> Downgrade
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info(`Change cycle for ${s.user} (demo)`)}>
                            <Repeat className="w-3.5 h-3.5 mr-2" /> Change cycle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info(`Extend trial for ${s.user} (demo)`)}>
                            <CalendarClock className="w-3.5 h-3.5 mr-2" /> Extend
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info(`Pause ${s.user} (demo)`)}>
                            <Pause className="w-3.5 h-3.5 mr-2" /> Pause
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => toast.error(`Cancel ${s.user} (demo)`)}>
                            <Ban className="w-3.5 h-3.5 mr-2" /> Cancel
                          </DropdownMenuItem>
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

      <Sheet open={!!viewSub} onOpenChange={(o) => { if (!o) setViewSub(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {viewSub && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-base font-semibold">{viewSub.user}</div>
                    <div className="text-xs font-normal text-muted-foreground">{viewSub.email}</div>
                  </div>
                </SheetTitle>
                <SheetDescription>
                  Subscription ID <span className="font-mono">{viewSub.id}</span>
                </SheetDescription>
              </SheetHeader>

              <div className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <DetailCell label="Plan" value={viewSub.plan} />
                  <DetailCell label="Amount" value={formatCurrency(viewSub.amount)} />
                  <DetailCell label="Cycle" value={viewSub.cycle} className="capitalize" />
                  <DetailCell label="Status" value={viewSub.status.replace(/_/g, " ")} className="capitalize" />
                  <DetailCell label="Organization" value={viewSub.org} />
                  <DetailCell label="Created" value={formatDateLong(viewSub.createdAt)} />
                  <DetailCell label="Renewal" value={formatDateLong(viewSub.renewalDate)} />
                  <DetailCell label="Trial ends" value={viewSub.trialEnds ? formatDateLong(viewSub.trialEnds) : "—"} />
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm font-semibold mb-3">Subscription history</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Previous</TableHead>
                        <TableHead>New</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="zebra">
                      <HistoryRow prev="Free" next="Starter" date="Jan 14, 2025" admin="system" reason="Self upgrade" />
                      <HistoryRow prev="Starter" next="Professional" date="Feb 02, 2025" admin="admin@ufuqaudit.com" reason="Plan upgrade" />
                      <HistoryRow prev="Professional" next="Professional" date="Mar 02, 2025" admin="system" reason="Monthly renewal" />
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailCell({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium mt-1 ${className}`}>{value}</div>
    </div>
  );
}

function HistoryRow({ prev, next, date, admin, reason }: {
  prev: string; next: string; date: string; admin: string; reason: string;
}) {
  return (
    <TableRow>
      <TableCell className="text-xs">{prev}</TableCell>
      <TableCell className="text-xs font-medium">{next}</TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{date}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{admin}</TableCell>
      <TableCell className="text-xs">{reason}</TableCell>
    </TableRow>
  );
}

// Plan badge class from display name (e.g. "Professional" → emerald)
function planBadgeClassFromName(planName: string): string {
  const map: Record<string, string> = {
    free: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
    starter: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    professional: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    agency: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  };
  return map[planName?.toLowerCase()] ?? map.free;
}
