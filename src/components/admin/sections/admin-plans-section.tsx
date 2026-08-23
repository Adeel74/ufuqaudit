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
import { toast } from "sonner";
import {
  Layers, CheckCircle2, Star, Plus, Pencil, Archive, Loader2,
} from "lucide-react";
import {
  EMERALD_BTN,
  type PlanConfig,
  formatCurrency,
} from "../admin-helpers";

type Limits = PlanConfig["limits"];

const EMPTY_LIMITS: Limits = {
  projects: 1, websites: 1, urlsPerCrawl: 100, monthlyAudits: 1, scheduledAudits: 0,
  teamMembers: 1, apiRequests: 100, apiRateLimit: 10, aiRequests: 10, aiCredits: 50,
  pdfReports: 1, whiteLabel: false, competitorAudits: 0, gscIntegration: false,
  ga4Integration: false, aeo: false, geo: false, aiVisibility: false,
  keywordTracking: 0, clientAccounts: 0,
};

const NUMERIC_FIELDS: Array<{ key: keyof Limits; label: string; min?: number; max?: number; step?: number; hint?: string }> = [
  { key: "projects", label: "Projects", min: 0, max: 1000, hint: "0 = unlimited" },
  { key: "websites", label: "Websites", min: 0, max: 1000 },
  { key: "urlsPerCrawl", label: "URLs per crawl", min: 1, max: 100000 },
  { key: "monthlyAudits", label: "Monthly audits", min: -1, max: 1000, hint: "-1 = unlimited" },
  { key: "scheduledAudits", label: "Scheduled audits", min: 0, max: 1000 },
  { key: "teamMembers", label: "Team members", min: 1, max: 100 },
  { key: "apiRequests", label: "API requests / mo", min: 0, max: 1000000 },
  { key: "apiRateLimit", label: "API rate limit / min", min: 1, max: 10000 },
  { key: "aiRequests", label: "AI requests / mo", min: 0, max: 100000 },
  { key: "aiCredits", label: "AI credits / mo", min: 0, max: 1000000 },
  { key: "pdfReports", label: "PDF reports / mo", min: -1, max: 1000, hint: "-1 = unlimited" },
  { key: "competitorAudits", label: "Competitor audits", min: 0, max: 100 },
  { key: "keywordTracking", label: "Keyword tracking", min: 0, max: 50000 },
  { key: "clientAccounts", label: "Client accounts", min: 0, max: 1000 },
];

const SWITCH_FIELDS: Array<{ key: keyof Limits; label: string }> = [
  { key: "whiteLabel", label: "White-label reports" },
  { key: "gscIntegration", label: "Google Search Console" },
  { key: "ga4Integration", label: "Google Analytics 4" },
  { key: "aeo", label: "AEO engine" },
  { key: "geo", label: "GEO engine" },
  { key: "aiVisibility", label: "AI visibility tracking" },
];

export function AdminPlansSection({ refreshKey }: { refreshKey: number }) {
  const [plans, setPlans] = React.useState<PlanConfig[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editPlan, setEditPlan] = React.useState<PlanConfig | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/plans").then((r) => r.json() as Promise<{ plans: PlanConfig[] }>);
      setPlans(r.plans ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const activeCount = plans.filter((p) => p.status === "active").length;
  const featuredCount = plans.filter((p) => p.featured).length;

  function handleSavePlan(plan: PlanConfig, isNew: boolean) {
    if (isNew) {
      setPlans((prev) => [...prev, plan]);
      toast.success(`Created plan "${plan.name}"`);
    } else {
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? plan : p)));
      toast.success(`Updated plan "${plan.name}"`);
    }
    setEditPlan(null);
    setCreateOpen(false);
  }

  function archivePlan(id: string) {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: p.status === "active" ? "archived" : "active" } : p)),
    );
    toast.success("Plan archived (demo)");
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Pricing Plans"
        subtitle="Define and manage subscription tiers"
        icon={Layers}
        actions={
          <Button size="sm" className={EMERALD_BTN} onClick={() => setCreateOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Create plan
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Plans" value={plans.length} icon={Layers} color="#10b981" />
        <StatCard label="Active Plans" value={activeCount} icon={CheckCircle2} color="#10b981" />
        <StatCard label="Featured Plans" value={featuredCount} icon={Star} color="#f59e0b" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-muted/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} onEdit={() => setEditPlan(p)} onArchive={() => archivePlan(p.id)} />
          ))}
        </div>
      )}

      <PlanBuilderDialog
        open={createOpen || !!editPlan}
        onOpenChange={(o) => { if (!o) { setCreateOpen(false); setEditPlan(null); } }}
        onSave={(p) => handleSavePlan(p, !editPlan)}
        existing={editPlan}
      />
    </div>
  );
}

function PlanCard({ plan, onEdit, onArchive }: {
  plan: PlanConfig;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const isFree = plan.monthlyPrice === 0;
  return (
    <Card className={`p-5 flex flex-col ${plan.featured ? "border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200 dark:ring-emerald-800" : ""}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">{plan.name}</h3>
            {plan.featured && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                <Star className="w-3 h-3 mr-1" /> Featured
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{plan.description || "—"}</p>
        </div>
        <Badge variant="outline" className={plan.status === "active"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
          : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700"}>
          {plan.status}
        </Badge>
      </div>

      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl font-bold">{formatCurrency(plan.monthlyPrice, plan.currency)}</span>
        <span className="text-xs text-muted-foreground">/mo</span>
        <span className="text-xs text-muted-foreground ml-2">·</span>
        <span className="text-sm font-medium ml-1">{formatCurrency(plan.yearlyPrice, plan.currency)}</span>
        <span className="text-xs text-muted-foreground">/yr</span>
      </div>

      {plan.trialDays > 0 && (
        <Badge variant="outline" className="self-start mb-3 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
          {plan.trialDays}-day trial
        </Badge>
      )}

      <Separator className="my-3" />

      <div className="grid grid-cols-2 gap-2 text-xs flex-1">
        <LimitCell label="Projects" value={fmt(plan.limits.projects)} />
        <LimitCell label="URLs" value={fmt(plan.limits.urlsPerCrawl)} />
        <LimitCell label="Audits/mo" value={fmt(plan.limits.monthlyAudits)} />
        <LimitCell label="Scheduled" value={fmt(plan.limits.scheduledAudits)} />
        <LimitCell label="API/mo" value={fmt(plan.limits.apiRequests)} />
        <LimitCell label="Rate/min" value={fmt(plan.limits.apiRateLimit)} />
        <LimitCell label="AI req" value={fmt(plan.limits.aiRequests)} />
        <LimitCell label="AI credits" value={fmt(plan.limits.aiCredits)} />
        <LimitCell label="PDF reports" value={fmt(plan.limits.pdfReports)} />
        <LimitCell label="Team" value={fmt(plan.limits.teamMembers)} />
      </div>

      <div className="flex flex-wrap gap-1 mt-3">
        {plan.limits.whiteLabel && <Chip>White-label</Chip>}
        {plan.limits.gscIntegration && <Chip>GSC</Chip>}
        {plan.limits.ga4Integration && <Chip>GA4</Chip>}
        {plan.limits.aeo && <Chip>AEO</Chip>}
        {plan.limits.geo && <Chip>GEO</Chip>}
        {plan.limits.aiVisibility && <Chip>AI Visibility</Chip>}
      </div>

      <div className="flex items-center gap-2 mt-4">
        <Button size="sm" variant="outline" className="flex-1" onClick={onEdit}>
          <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={onArchive}>
          <Archive className="w-3.5 h-3.5 mr-1" /> {plan.status === "active" ? "Archive" : "Restore"}
        </Button>
      </div>
      {isFree && <p className="text-[10px] text-muted-foreground mt-2 text-center">Free plan</p>}
    </Card>
  );
}

function fmt(v: number): string {
  if (v === -1) return "∞";
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K`;
  return String(v);
}

function LimitCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
      {children}
    </span>
  );
}

function PlanBuilderDialog({
  open,
  onOpenChange,
  onSave,
  existing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (p: PlanConfig) => void;
  existing: PlanConfig | null;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [monthlyPrice, setMonthlyPrice] = React.useState(0);
  const [yearlyPrice, setYearlyPrice] = React.useState(0);
  const [currency, setCurrency] = React.useState("USD");
  const [trialDays, setTrialDays] = React.useState(14);
  const [featured, setFeatured] = React.useState(false);
  const [status, setStatus] = React.useState<"active" | "archived">("active");
  const [limits, setLimits] = React.useState<Limits>({ ...EMPTY_LIMITS });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDescription(existing.description);
      setMonthlyPrice(existing.monthlyPrice);
      setYearlyPrice(existing.yearlyPrice);
      setCurrency(existing.currency);
      setTrialDays(existing.trialDays);
      setFeatured(existing.featured);
      setStatus(existing.status);
      setLimits({ ...existing.limits });
    } else {
      setName("");
      setDescription("");
      setMonthlyPrice(0);
      setYearlyPrice(0);
      setCurrency("USD");
      setTrialDays(14);
      setFeatured(false);
      setStatus("active");
      setLimits({ ...EMPTY_LIMITS });
    }
  }, [existing, open]);

  function setLimit<K extends keyof Limits>(key: K, value: Limits[K]) {
    setLimits((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const plan: PlanConfig = {
      id: existing?.id ?? `plan_${Date.now()}`,
      name: name.trim(),
      internalId: existing?.internalId ?? `plan_${Date.now()}`,
      description: description.trim(),
      monthlyPrice, yearlyPrice, currency, trialDays, featured, status,
      displayOrder: existing?.displayOrder ?? 99,
      limits: { ...limits },
    };
    setTimeout(() => {
      onSave(plan);
      setSaving(false);
    }, 300);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? `Edit "${existing.name}"` : "Create pricing plan"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          {/* General */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">General</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="pb-name">Name</Label>
                <Input id="pb-name" placeholder="Starter" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="pb-desc">Description</Label>
                <Input id="pb-desc" placeholder="For freelancers & small sites" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pb-monthly">Monthly price</Label>
                <Input id="pb-monthly" type="number" min={0} value={monthlyPrice} onChange={(e) => setMonthlyPrice(Number(e.target.value))} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pb-yearly">Yearly price</Label>
                <Input id="pb-yearly" type="number" min={0} value={yearlyPrice} onChange={(e) => setYearlyPrice(Number(e.target.value))} />
              </div>
              <div className="grid gap-1.5">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["USD", "EUR", "GBP", "PKR", "AED"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pb-trial">Trial days</Label>
                <Input id="pb-trial" type="number" min={0} max={90} value={trialDays} onChange={(e) => setTrialDays(Number(e.target.value))} />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Switch checked={featured} onCheckedChange={setFeatured} />
                <Label className="cursor-pointer">Featured plan (highlighted on pricing page)</Label>
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as "active" | "archived")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* API + AI */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">API & AI limits</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {NUMERIC_FIELDS.filter((f) => ["apiRequests", "apiRateLimit", "aiRequests", "aiCredits", "monthlyAudits", "scheduledAudits"].includes(f.key)).map((f) => (
                <div key={f.key} className="grid gap-1.5">
                  <Label htmlFor={`pb-${f.key}`} className="text-xs">{f.label}</Label>
                  <Input
                    id={`pb-${f.key}`}
                    type="number"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={limits[f.key] as number}
                    onChange={(e) => setLimit(f.key, Number(e.target.value))}
                  />
                  {f.hint && <span className="text-[10px] text-muted-foreground">{f.hint}</span>}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* General limits */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">General limits</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {NUMERIC_FIELDS.filter((f) => ["projects", "websites", "urlsPerCrawl", "teamMembers", "pdfReports", "competitorAudits", "keywordTracking", "clientAccounts"].includes(f.key)).map((f) => (
                <div key={f.key} className="grid gap-1.5">
                  <Label htmlFor={`pb-${f.key}`} className="text-xs">{f.label}</Label>
                  <Input
                    id={`pb-${f.key}`}
                    type="number"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={limits[f.key] as number}
                    onChange={(e) => setLimit(f.key, Number(e.target.value))}
                  />
                  {f.hint && <span className="text-[10px] text-muted-foreground">{f.hint}</span>}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Features</h4>
            <div className="grid grid-cols-2 gap-3">
              {SWITCH_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center justify-between gap-2 p-2 rounded-lg border">
                  <Label className="text-xs cursor-pointer" htmlFor={`pb-sw-${f.key}`}>{f.label}</Label>
                  <Switch
                    id={`pb-sw-${f.key}`}
                    checked={limits[f.key] as boolean}
                    onCheckedChange={(v) => setLimit(f.key, v as unknown as boolean)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={saving}>Cancel</Button>
          </DialogClose>
          <Button onClick={save} disabled={saving} className={EMERALD_BTN}>
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            {existing ? "Save changes" : "Create plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
