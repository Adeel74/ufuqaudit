"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Flag,
  RefreshCw,
  Plus,
  Pencil,
  Search,
  Loader2,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  SCROLLBAR_CLS,
  SkeletonRows,
  EmptyState,
  EMERALD_BTN,
  relativeTime,
} from "../admin-helpers";

// ----- API types -----
type FlagCategory = "audit" | "ai" | "integration" | "reports" | "marketing";

interface PlanOverride {
  plan: "free" | "starter" | "pro" | "agency";
  enabled: boolean;
}

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  category: FlagCategory;
  enabled: boolean;
  globalDefault: boolean;
  planOverrides: PlanOverride[];
  rolloutPercent: number;
  createdAt: string;
  updatedAt: string;
}

interface FlagStats {
  total: number;
  enabled: number;
  disabled: number;
  categories: number;
}

interface FeatureFlagsResponse {
  flags: FeatureFlag[];
  stats: FlagStats;
}

const CATEGORY_BADGE: Record<FlagCategory, string> = {
  audit:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  ai: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  integration:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  reports:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  marketing:
    "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800",
};

const PLAN_LETTER: Record<PlanOverride["plan"], string> = {
  free: "F",
  starter: "S",
  pro: "P",
  agency: "A",
};

const CATEGORIES: { value: FlagCategory | "all"; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "audit", label: "Audit" },
  { value: "ai", label: "AI" },
  { value: "integration", label: "Integration" },
  { value: "reports", label: "Reports" },
  { value: "marketing", label: "Marketing" },
];

export function AdminFeatureFlagsSection({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = React.useState<FeatureFlagsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<FlagCategory | "all">("all");
  const [status, setStatus] = React.useState<"all" | "enabled" | "disabled">("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<FeatureFlag | null>(null);
  const [toggling, setToggling] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await
        fetch("/api/admin/feature-flags").then((r) => r.json() as Promise<FeatureFlagsResponse>);
      setData(r);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const stats = data?.stats;
  const allFlags = data?.flags ?? [];

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return allFlags.filter((f) => {
      if (category !== "all" && f.category !== category) return false;
      if (status === "enabled" && !f.enabled) return false;
      if (status === "disabled" && f.enabled) return false;
      if (q && !f.name.toLowerCase().includes(q) && !f.key.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allFlags, search, category, status]);

  function patchFlag(id: string, patch: Partial<FeatureFlag>) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            flags: prev.flags.map((f) =>
              f.id === id ? { ...f, ...patch, updatedAt: new Date().toISOString() } : f,
            ),
            stats: {
              ...prev.stats,
              enabled: prev.flags.filter((f) =>
                f.id === id ? patch.enabled ?? f.enabled : f.enabled,
              ).length,
              disabled: prev.flags.filter((f) =>
                f.id === id ? !(patch.enabled ?? f.enabled) : !f.enabled,
              ).length,
            },
          }
        : prev,
    );
  }

  async function toggleFlag(f: FeatureFlag, next: boolean) {
    setToggling(f.id);
    try {
      await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: f.id, action: "toggle", enabled: next }),
      });
      patchFlag(f.id, { enabled: next });
      toast.success(`Flag "${f.name}" ${next ? "enabled" : "disabled"}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to toggle flag");
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Feature Flags"
        subtitle="Enable/disable features without deployment"
        icon={Flag}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => load()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <Button
              size="sm"
              className={EMERALD_BTN}
              onClick={() => {
                setEditTarget(null);
                setCreateOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Create flag
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Flags" value={stats?.total ?? 0} icon={Flag} color="#10b981" />
        <StatCard
          label="Enabled"
          value={stats?.enabled ?? 0}
          icon={ToggleRight}
          color="#14b8a6"
        />
        <StatCard
          label="Disabled"
          value={stats?.disabled ?? 0}
          icon={ToggleLeft}
          color="#64748b"
        />
        <StatCard
          label="Categories"
          value={stats?.categories ?? 0}
          icon={Flag}
          color="#8b5cf6"
        />
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or key…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v as FlagCategory | "all")}>
            <SelectTrigger className="md:w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="md:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="enabled">Enabled</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Flags table */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Flag className="w-4 h-4 text-emerald-600" /> Feature Flags
          <Badge variant="secondary" className="ml-1">
            {filtered.length}
          </Badge>
        </h3>
        <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[60vh]`}>
          {loading ? (
            <SkeletonRows rows={5} cols={8} />
          ) : filtered.length === 0 ? (
            <EmptyState msg="No feature flags match the filters" icon={Flag} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Name</TableHead>
                  <TableHead className="min-w-[160px]">Key</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Global</TableHead>
                  <TableHead>Plan Overrides</TableHead>
                  <TableHead className="min-w-[120px]">Rollout</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {filtered.map((f) => {
                  const overrides = f.planOverrides.length
                    ? f.planOverrides
                    : ([
                        { plan: "free", enabled: f.globalDefault },
                        { plan: "starter", enabled: f.globalDefault },
                        { plan: "pro", enabled: f.globalDefault },
                        { plan: "agency", enabled: f.globalDefault },
                      ] as PlanOverride[]);
                  return (
                    <TableRow key={f.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{f.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {f.description || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">
                          {f.key}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize text-[10px] ${CATEGORY_BADGE[f.category]}`}
                        >
                          {f.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={f.enabled}
                            disabled={toggling === f.id}
                            onCheckedChange={(v) => void toggleFlag(f, v)}
                          />
                          {toggling === f.id && (
                            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {f.globalDefault ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> ON
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <XCircle className="w-3 h-3" /> OFF
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {overrides.map((po) => (
                            <span
                              key={po.plan}
                              title={`${po.plan}: ${po.enabled ? "on" : "off"}`}
                              className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold border ${
                                po.enabled
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                  : "bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-900/60 dark:text-slate-500 dark:border-slate-700"
                              }`}
                            >
                              {PLAN_LETTER[po.plan]}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 transition-all"
                              style={{ width: `${f.rolloutPercent}%` }}
                            />
                          </div>
                          <span className="text-[11px] tabular-nums text-muted-foreground w-9 text-right">
                            {f.rolloutPercent}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {relativeTime(f.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7"
                          onClick={() => {
                            setEditTarget(f);
                            setCreateOpen(true);
                          }}
                          title="Edit flag"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      <FeatureFlagDialog
        open={createOpen}
        onOpenChange={(o) => {
          if (!o) {
            setCreateOpen(false);
            setEditTarget(null);
          }
        }}
        existing={editTarget}
        onSaved={(flag, isEdit) => {
          if (isEdit && editTarget) {
            patchFlag(editTarget.id, flag);
            toast.success(`Flag "${flag.name}" updated`);
          } else {
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    flags: [
                      { ...flag, id: crypto.randomUUID() } as FeatureFlag,
                      ...prev.flags,
                    ],
                    stats: {
                      ...prev.stats,
                      total: prev.stats.total + 1,
                      enabled: prev.stats.enabled + (flag.enabled ? 1 : 0),
                      disabled: prev.stats.disabled + (flag.enabled ? 0 : 1),
                      categories: prev.stats.categories,
                    },
                  }
                : prev,
            );
            toast.success(`Flag "${flag.name}" created`);
          }
          setCreateOpen(false);
          setEditTarget(null);
        }}
      />
    </div>
  );
}

interface FlagDraft {
  name: string;
  key: string;
  description: string;
  category: FlagCategory;
  enabled: boolean;
  globalDefault: boolean;
  planOverrides: PlanOverride[];
  rolloutPercent: number;
}

function blankDraft(): FlagDraft {
  return {
    name: "",
    key: "",
    description: "",
    category: "audit",
    enabled: true,
    globalDefault: true,
    planOverrides: [
      { plan: "free", enabled: false },
      { plan: "starter", enabled: true },
      { plan: "pro", enabled: true },
      { plan: "agency", enabled: true },
    ],
    rolloutPercent: 100,
  };
}

function FeatureFlagDialog({
  open,
  onOpenChange,
  existing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  existing: FeatureFlag | null;
  onSaved: (flag: FlagDraft, isEdit: boolean) => void;
}) {
  const [draft, setDraft] = React.useState<FlagDraft>(blankDraft());
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (existing) {
      const overrides =
        existing.planOverrides.length
          ? existing.planOverrides
          : ([
              { plan: "free", enabled: existing.globalDefault },
              { plan: "starter", enabled: existing.globalDefault },
              { plan: "pro", enabled: existing.globalDefault },
              { plan: "agency", enabled: existing.globalDefault },
            ] as PlanOverride[]);
      setDraft({
        name: existing.name,
        key: existing.key,
        description: existing.description,
        category: existing.category,
        enabled: existing.enabled,
        globalDefault: existing.globalDefault,
        planOverrides: overrides,
        rolloutPercent: existing.rolloutPercent,
      });
    } else {
      setDraft(blankDraft());
    }
  }, [open, existing]);

  function setPlan(plan: PlanOverride["plan"], enabled: boolean) {
    setDraft((d) => ({
      ...d,
      planOverrides: d.planOverrides.map((p) =>
        p.plan === plan ? { ...p, enabled } : p,
      ),
    }));
  }

  async function submit() {
    if (!draft.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!draft.key.trim()) {
      toast.error("Key is required");
      return;
    }
    setSaving(true);
    try {
      if (!existing) {
        await fetch("/api/admin/feature-flags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create", ...draft }),
        });
      }
      onSaved(draft, !!existing);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save flag");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit feature flag" : "Create feature flag"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="ff-name">Name</Label>
            <Input
              id="ff-name"
              placeholder="AI Recommendations v2"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ff-key">Key</Label>
            <Input
              id="ff-key"
              placeholder="ai_recommendations_v2"
              value={draft.key}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  key: e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "_")
                    .replace(/[^a-z0-9_]/g, ""),
                })
              }
              className="font-mono text-xs"
            />
            <span className="text-[10px] text-muted-foreground">
              Lowercase letters, digits, underscores only
            </span>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ff-desc">Description</Label>
            <Textarea
              id="ff-desc"
              placeholder="What does this flag control?"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ff-cat">Category</Label>
              <Select
                value={draft.category}
                onValueChange={(v) => setDraft({ ...draft, category: v as FlagCategory })}
              >
                <SelectTrigger id="ff-cat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ff-rollout">Rollout %</Label>
              <div className="flex items-center gap-3">
                <Slider
                  id="ff-rollout"
                  value={[draft.rolloutPercent]}
                  max={100}
                  step={5}
                  onValueChange={(v) =>
                    setDraft({ ...draft, rolloutPercent: v[0] ?? 0 })
                  }
                  className="flex-1"
                />
                <span className="text-sm tabular-nums w-9 text-right">
                  {draft.rolloutPercent}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <div className="text-sm font-medium">Flag enabled</div>
              <div className="text-xs text-muted-foreground">
                Master switch for this flag
              </div>
            </div>
            <Switch
              checked={draft.enabled}
              onCheckedChange={(v) => setDraft({ ...draft, enabled: v })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <div className="text-sm font-medium">Global default</div>
              <div className="text-xs text-muted-foreground">
                Default state for plans without an override
              </div>
            </div>
            <Switch
              checked={draft.globalDefault}
              onCheckedChange={(v) => setDraft({ ...draft, globalDefault: v })}
            />
          </div>

          <div className="p-3 rounded-lg border">
            <div className="text-sm font-medium mb-2">Plan overrides</div>
            <div className="grid grid-cols-2 gap-2">
              {draft.planOverrides.map((po) => (
                <label
                  key={po.plan}
                  className="flex items-center gap-2 p-2 rounded-md bg-muted/40 cursor-pointer"
                >
                  <Switch
                    checked={po.enabled}
                    onCheckedChange={(v) => setPlan(po.plan, v)}
                  />
                  <span className="text-sm capitalize">{po.plan}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={saving}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={submit} disabled={saving} className={EMERALD_BTN}>
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            {existing ? "Save changes" : "Create flag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
