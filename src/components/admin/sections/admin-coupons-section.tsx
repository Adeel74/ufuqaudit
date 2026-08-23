"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
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
import { toast } from "sonner";
import {
  Ticket, RefreshCw, Plus, Copy, Trash2, Loader2, CheckCircle2,
  XCircle, Calendar,
} from "lucide-react";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState, EMERALD_BTN,
  formatDateLong,
} from "../admin-helpers";

// ----- API types -----
type CouponType = "percentage" | "fixed" | "free_trial" | "free_months";
type CouponStatus = "active" | "expired" | "disabled";

interface CouponConditions {
  newUsersOnly: boolean;
  specificPlans: string[];
  expirationDate: string | null;
  usageLimit: number;
  used: number;
}

interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  description: string;
  status: CouponStatus;
  conditions: CouponConditions;
  createdAt: string;
}

interface CouponStats {
  total: number;
  active: number;
  expired: number;
  disabled: number;
  totalRedemptions: number;
}

interface CouponResponse {
  coupons: Coupon[];
  stats: CouponStats;
}

const TYPE_BADGE: Record<CouponType, string> = {
  percentage: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  fixed: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  free_trial: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  free_months: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
};

const STATUS_BADGE: Record<CouponStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  expired: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
  disabled: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
};

const PLANS = ["free", "starter", "pro", "agency"];

function formatCouponValue(c: Coupon): string {
  if (c.type === "percentage") return `${c.value}%`;
  if (c.type === "fixed") return `$${c.value}`;
  if (c.type === "free_trial") return `${c.value} days`;
  if (c.type === "free_months") return `${c.value} mo`;
  return String(c.value);
}

function isExpired(c: Coupon): boolean {
  if (!c.conditions.expirationDate) return false;
  return new Date(c.conditions.expirationDate).getTime() < Date.now();
}

export function AdminCouponsSection({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = React.useState<CouponResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<Coupon | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/coupons").then((r) => r.json() as Promise<CouponResponse>);
      setData(r);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const stats = data?.stats;
  const coupons = data?.coupons ?? [];

  function addCoupon(c: Coupon) {
    setData((prev) => (prev ? { ...prev, coupons: [c, ...prev.coupons] } : prev));
  }

  function patchCoupon(id: string, patch: Partial<Coupon>) {
    setData((prev) =>
      prev
        ? { ...prev, coupons: prev.coupons.map((c) => (c.id === id ? { ...c, ...patch } : c)) }
        : prev,
    );
  }

  function copyCode(c: Coupon) {
    void navigator.clipboard.writeText(c.code).then(() => {
      toast.success(`Copied ${c.code}`);
    });
  }

  function toggleDisable(c: Coupon) {
    const next: CouponStatus = c.status === "disabled" ? "active" : "disabled";
    patchCoupon(c.id, { status: next });
    toast.success(next === "active" ? `Enabled "${c.code}"` : `Disabled "${c.code}"`);
  }

  async function deleteCoupon() {
    if (!toDelete) return;
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 400));
    setData((prev) =>
      prev ? { ...prev, coupons: prev.coupons.filter((c) => c.id !== toDelete.id) } : prev,
    );
    toast.success(`Deleted "${toDelete.code}"`);
    setToDelete(null);
    setDeleting(false);
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Coupons"
        subtitle="Discount codes & promotional offers"
        icon={Ticket}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => load()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <Button size="sm" className={EMERALD_BTN} onClick={() => setCreateOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Create coupon
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Coupons" value={stats?.total ?? 0} icon={Ticket} color="#10b981" />
        <StatCard label="Active" value={stats?.active ?? 0} icon={CheckCircle2} color="#14b8a6" />
        <StatCard label="Total Redemptions" value={stats?.totalRedemptions ?? 0} icon={Ticket} color="#8b5cf6" />
        <StatCard label="Expired" value={stats?.expired ?? 0} icon={XCircle} color="#64748b" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted/60 animate-pulse" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <Card className="p-6">
          <EmptyState msg="No coupons yet — create your first discount code" icon={Ticket} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => {
            const usagePct = c.conditions.usageLimit > 0
              ? Math.min(100, (c.conditions.used / c.conditions.usageLimit) * 100)
              : 0;
            const expiredFlag = isExpired(c);
            const effectiveStatus: CouponStatus = expiredFlag && c.status === "active" ? "expired" : c.status;
            return (
              <Card key={c.id} className="p-5 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className={`capitalize text-xs ${TYPE_BADGE[c.type]}`}>
                    {c.type.replace(/_/g, " ")}
                  </Badge>
                  <Badge variant="outline" className={`capitalize text-xs ${STATUS_BADGE[effectiveStatus]}`}>
                    {effectiveStatus}
                  </Badge>
                </div>

                <div className="flex items-baseline gap-2 mt-1 mb-1">
                  <span className="text-3xl font-bold tabular-nums">{formatCouponValue(c)}</span>
                  <span className="text-xs text-muted-foreground">discount</span>
                </div>

                <button
                  onClick={() => copyCode(c)}
                  className="group flex items-center justify-between gap-2 mt-1 mb-2 p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                >
                  <code className="font-mono text-base font-bold tracking-wider">{c.code}</code>
                  <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-600" />
                </button>

                <p className="text-xs text-muted-foreground mb-3 line-clamp-2 min-h-[2rem]">
                  {c.description || "—"}
                </p>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Usage</span>
                    <span className="tabular-nums font-medium">
                      {c.conditions.used.toLocaleString()} / {c.conditions.usageLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usagePct >= 100 ? "bg-red-500" : usagePct >= 75 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3 min-h-[1.5rem]">
                  {c.conditions.newUsersOnly && (
                    <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
                      New users only
                    </Badge>
                  )}
                  {c.conditions.specificPlans.map((p) => (
                    <Badge key={p} variant="outline" className={`capitalize text-[10px] ${
                      p === "free" ? "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700"
                      : p === "starter" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                      : p === "pro" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800"
                    }`}>
                      {p}
                    </Badge>
                  ))}
                </div>

                {c.conditions.expirationDate && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-3">
                    <Calendar className="w-3 h-3" />
                    Expires {formatDateLong(c.conditions.expirationDate)}
                  </div>
                )}

                <Separator className="mb-3" />

                <div className="flex items-center gap-2 mt-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => toast.info(`Editing "${c.code}" (demo)`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={c.status === "disabled" ? "text-emerald-600 hover:text-emerald-700" : "text-amber-600 hover:text-amber-700"}
                    onClick={() => toggleDisable(c)}
                  >
                    {c.status === "disabled" ? "Enable" : "Disable"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setToDelete(c)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCouponDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={addCoupon}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => { if (!o) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete coupon{" "}
              <span className="font-mono font-medium text-foreground">{toDelete?.code}</span>.
              Existing redemptions will be retained in transaction history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void deleteCoupon();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CreateCouponDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (c: Coupon) => void;
}) {
  const [code, setCode] = React.useState("");
  const [type, setType] = React.useState<CouponType>("percentage");
  const [value, setValue] = React.useState(20);
  const [description, setDescription] = React.useState("");
  const [newUsersOnly, setNewUsersOnly] = React.useState(true);
  const [selectedPlans, setSelectedPlans] = React.useState<string[]>(["starter", "pro"]);
  const [expirationDate, setExpirationDate] = React.useState("");
  const [usageLimit, setUsageLimit] = React.useState(100);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setCode("");
      setType("percentage");
      setValue(20);
      setDescription("");
      setNewUsersOnly(true);
      setSelectedPlans(["starter", "pro"]);
      setExpirationDate("");
      setUsageLimit(100);
    }
  }, [open]);

  function togglePlan(plan: string) {
    setSelectedPlans((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan],
    );
  }

  function submit() {
    if (!code.trim()) {
      toast.error("Coupon code required");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const c: Coupon = {
        id: `cpn_${Date.now()}`,
        code: code.trim().toUpperCase(),
        type,
        value,
        description: description.trim(),
        status: "active",
        conditions: {
          newUsersOnly,
          specificPlans: selectedPlans,
          expirationDate: expirationDate ? new Date(expirationDate).toISOString() : null,
          usageLimit,
          used: 0,
        },
        createdAt: new Date().toISOString(),
      };
      onCreated(c);
      toast.success(`Coupon "${c.code}" created`);
      setSaving(false);
      onOpenChange(false);
    }, 300);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create coupon</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="cpn-code">Code</Label>
              <Input
                id="cpn-code"
                placeholder="WELCOME20"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as CouponType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage off</SelectItem>
                  <SelectItem value="fixed">Fixed amount off</SelectItem>
                  <SelectItem value="free_trial">Free trial days</SelectItem>
                  <SelectItem value="free_months">Free months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="cpn-value">Value</Label>
              <Input
                id="cpn-value"
                type="number"
                min={0}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
              />
              <p className="text-[10px] text-muted-foreground">
                {type === "percentage" ? "Percentage (1-100)" :
                 type === "fixed" ? "Amount in $" :
                 type === "free_trial" ? "Days of free trial" :
                 "Number of free months"}
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cpn-limit">Usage limit</Label>
              <Input
                id="cpn-limit"
                type="number"
                min={1}
                value={usageLimit}
                onChange={(e) => setUsageLimit(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cpn-desc">Description</Label>
            <Input
              id="cpn-desc"
              placeholder="20% off any plan for new users"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cpn-exp">Expiration date (optional)</Label>
            <Input
              id="cpn-exp"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
          </div>
          <Separator />
          <div className="flex items-center gap-2">
            <Switch
              id="cpn-new"
              checked={newUsersOnly}
              onCheckedChange={setNewUsersOnly}
            />
            <Label htmlFor="cpn-new" className="cursor-pointer text-sm">New users only</Label>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-sm">Eligible plans</Label>
            <div className="grid grid-cols-2 gap-2">
              {PLANS.map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 capitalize text-sm"
                >
                  <Checkbox
                    checked={selectedPlans.includes(p)}
                    onCheckedChange={() => togglePlan(p)}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={saving}>Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={saving} className={EMERALD_BTN}>
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            Create coupon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
