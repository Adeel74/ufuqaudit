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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  ListChecks, RefreshCw, Search, Pencil, Loader2, FileText, CheckCircle2,
  XCircle, AlertOctagon,
} from "lucide-react";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState, EMERALD_BTN,
} from "../admin-helpers";

// ----- API types -----
interface AuditRule {
  id: string;
  name: string;
  category: string;
  severity: "critical" | "error" | "warning" | "opportunity";
  scoreImpact: number;
  status: "enabled" | "disabled";
  recommendation: string;
  fixInstructions: string;
  planAvailability: string[];
}

interface AuditRulesResponse {
  rules: AuditRule[];
  total: number;
}

// ----- Filters -----
type CategoryFilter =
  | "all" | "Technical SEO" | "On-Page" | "Content" | "Internal Links"
  | "Schema" | "AEO" | "GEO" | "Performance" | "Security";
type SeverityFilter = "all" | "critical" | "error" | "warning" | "opportunity";
type StatusFilter = "all" | "enabled" | "disabled";

const CATEGORY_OPTIONS: CategoryFilter[] = [
  "all", "Technical SEO", "On-Page", "Content", "Internal Links",
  "Schema", "AEO", "GEO", "Performance", "Security",
];

const SEVERITY_OPTIONS: SeverityFilter[] = ["all", "critical", "error", "warning", "opportunity"];

function matchesCategory(rule: AuditRule, f: CategoryFilter): boolean {
  if (f === "all") return true;
  return rule.category.toLowerCase().includes(f.toLowerCase());
}

// ----- Severity badges -----
const SEVERITY_BADGE: Record<
  AuditRule["severity"],
  { label: string; cls: string }
> = {
  critical: {
    label: "Critical",
    cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
  },
  error: {
    label: "Error",
    cls: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
  },
  warning: {
    label: "Warning",
    cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  opportunity: {
    label: "Opportunity",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
};

const CATEGORY_BADGE: Record<string, string> = {
  "Technical SEO": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  "On-Page SEO": "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
  "Content SEO": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  "Internal Links": "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
  Schema: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  AEO: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-800",
  GEO: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800",
  Performance: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
  Security: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
};

function categoryBadgeCls(cat: string): string {
  return CATEGORY_BADGE[cat] ?? "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700";
}

const PLAN_INITIALS: Record<string, string> = {
  free: "F",
  starter: "S",
  pro: "P",
  agency: "A",
};

const PLAN_BADGE: Record<string, string> = {
  F: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
  S: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  P: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  A: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
};

export function AdminAuditRulesSection({ refreshKey }: { refreshKey: number }) {
  const [rules, setRules] = React.useState<AuditRule[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [catFilter, setCatFilter] = React.useState<CategoryFilter>("all");
  const [sevFilter, setSevFilter] = React.useState<SeverityFilter>("all");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [editRule, setEditRule] = React.useState<AuditRule | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/audit-rules").then(
        (r) => r.json() as Promise<AuditRulesResponse>,
      );
      setRules(r.rules ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load audit rules");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const filtered = React.useMemo(() => {
    let list = rules;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q));
    if (catFilter !== "all") list = list.filter((r) => matchesCategory(r, catFilter));
    if (sevFilter !== "all") list = list.filter((r) => r.severity === sevFilter);
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    return list;
  }, [rules, search, catFilter, sevFilter, statusFilter]);

  // Group filtered rules by category (preserving original category order in RULES)
  const grouped = React.useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, AuditRule[]>();
    for (const r of filtered) {
      if (!map.has(r.category)) {
        map.set(r.category, []);
        order.push(r.category);
      }
      map.get(r.category)!.push(r);
    }
    return order.map((c) => ({ category: c, rules: map.get(c)! }));
  }, [filtered]);

  const total = rules.length;
  const enabled = rules.filter((r) => r.status === "enabled").length;
  const disabled = total - enabled;
  const critical = rules.filter((r) => r.severity === "critical").length;

  async function toggleRule(rule: AuditRule) {
    // Optimistic update
    setRules((prev) =>
      prev.map((r) =>
        r.id === rule.id ? { ...r, status: r.status === "enabled" ? "disabled" : "enabled" } : r,
      ),
    );
    try {
      const res = await fetch("/api/admin/audit-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", id: rule.id }),
      });
      if (!res.ok) throw new Error("toggle failed");
      const data = (await res.json()) as { ok: true; rule: AuditRule };
      setRules((prev) => prev.map((r) => (r.id === data.rule.id ? data.rule : r)));
      toast.success(`Rule "${rule.name}" ${data.rule.status === "enabled" ? "enabled" : "disabled"}`);
    } catch (e) {
      console.error(e);
      // Rollback
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, status: rule.status } : r)),
      );
      toast.error("Failed to toggle rule");
    }
  }

  async function updateRule(updated: AuditRule) {
    setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    try {
      const res = await fetch("/api/admin/audit-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: updated.id,
          severity: updated.severity,
          scoreImpact: updated.scoreImpact,
          status: updated.status,
        }),
      });
      if (!res.ok) throw new Error("update failed");
      const data = (await res.json()) as { ok: true; rule: AuditRule };
      setRules((prev) => prev.map((r) => (r.id === data.rule.id ? data.rule : r)));
      toast.success(`Rule "${updated.name}" updated`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update rule");
      void load();
    }
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Audit Rules"
        subtitle="Manage 200+ SEO checks without deploying code"
        icon={ListChecks}
        actions={
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Rules" value={total} icon={ListChecks} color="#10b981" />
        <StatCard label="Enabled" value={enabled} icon={CheckCircle2} color="#10b981" />
        <StatCard label="Disabled" value={disabled} icon={XCircle} color="#64748b" />
        <StatCard label="Critical Rules" value={critical} icon={AlertOctagon} color="#ef4444" />
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search rules by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={catFilter} onValueChange={(v) => setCatFilter(v as CategoryFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all" ? "All categories" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sevFilter} onValueChange={(v) => setSevFilter(v as SeverityFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All severities" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Rules table (grouped by category) */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <ListChecks className="w-4 h-4 text-emerald-600" /> Rules
          <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
        </h3>
        <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[60vh]`}>
          {loading ? (
            <SkeletonRows rows={8} cols={6} />
          ) : grouped.length === 0 ? (
            <EmptyState msg="No rules match your filters" icon={ListChecks} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Rule Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="text-right">Score Impact</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Plans</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {grouped.map((group) => (
                  <React.Fragment key={group.category}>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={7} className="py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            {group.category}
                          </span>
                          <Badge variant="outline" className={`text-[10px] ${categoryBadgeCls(group.category)}`}>
                            {group.rules.length} rules
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                    {group.rules.map((rule) => {
                      const sev = SEVERITY_BADGE[rule.severity];
                      return (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <div className="font-medium text-sm truncate max-w-[260px]" title={rule.name}>
                              {rule.name}
                            </div>
                            {rule.recommendation && (
                              <div className="text-xs text-muted-foreground truncate max-w-[260px]">
                                {rule.recommendation}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${categoryBadgeCls(rule.category)}`}>
                              {rule.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${sev.cls}`}>
                              {sev.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-mono text-sm">
                            {rule.scoreImpact}
                          </TableCell>
                          <TableCell className="text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex justify-center">
                                  <Switch
                                    checked={rule.status === "enabled"}
                                    onCheckedChange={() => toggleRule(rule)}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {rule.status === "enabled" ? "Enabled — click to disable" : "Disabled — click to enable"}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {rule.planAvailability.length === 0 ? (
                                <span className="text-xs text-muted-foreground">—</span>
                              ) : (
                                rule.planAvailability.map((p) => {
                                  const initial = PLAN_INITIALS[p.toLowerCase()] ?? p[0]?.toUpperCase() ?? "?";
                                  return (
                                    <span
                                      key={p}
                                      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[10px] font-medium border ${PLAN_BADGE[initial]}`}
                                      title={p}
                                    >
                                      {initial}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1"
                              onClick={() => setEditRule(rule)}
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      <EditRuleDialog
        rule={editRule}
        onOpenChange={(o) => { if (!o) setEditRule(null); }}
        onSave={(updated) => { void updateRule(updated); setEditRule(null); }}
      />
    </div>
  );
}

function EditRuleDialog({
  rule,
  onOpenChange,
  onSave,
}: {
  rule: AuditRule | null;
  onOpenChange: (o: boolean) => void;
  onSave: (r: AuditRule) => void;
}) {
  const [name, setName] = React.useState("");
  const [severity, setSeverity] = React.useState<AuditRule["severity"]>("warning");
  const [scoreImpact, setScoreImpact] = React.useState(0);
  const [status, setStatus] = React.useState<AuditRule["status"]>("enabled");
  const [recommendation, setRecommendation] = React.useState("");
  const [fixInstructions, setFixInstructions] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (rule) {
      setName(rule.name);
      setSeverity(rule.severity);
      setScoreImpact(rule.scoreImpact);
      setStatus(rule.status);
      setRecommendation(rule.recommendation);
      setFixInstructions(rule.fixInstructions);
    }
  }, [rule]);

  if (!rule) return null;

  function submit() {
    if (!rule) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSave({
        ...rule,
        name: name.trim() || rule.name,
        severity,
        scoreImpact: Number(scoreImpact) || 0,
        status,
        recommendation: recommendation.trim(),
        fixInstructions: fixInstructions.trim(),
      });
    }, 200);
  }

  return (
    <Dialog open={!!rule} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-emerald-600" /> Edit Rule
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="ar-name">Rule name</Label>
            <Input id="ar-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as AuditRule["severity"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="opportunity">Opportunity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ar-impact">Score impact (1–10)</Label>
              <Input
                id="ar-impact"
                type="number"
                min={0}
                max={10}
                value={scoreImpact}
                onChange={(e) => setScoreImpact(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AuditRule["status"])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ar-rec">Recommendation</Label>
            <Textarea
              id="ar-rec"
              rows={2}
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ar-fix">Fix instructions</Label>
            <Textarea
              id="ar-fix"
              rows={3}
              value={fixInstructions}
              onChange={(e) => setFixInstructions(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <div className="rounded-md bg-muted/60 p-2 flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>Available on plans: {rule.planAvailability.join(", ") || "—"}</span>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={saving} className={EMERALD_BTN}>
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
