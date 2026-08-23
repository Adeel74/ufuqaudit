"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
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
  Swords,
  RefreshCw,
  Save,
  Eye,
  Trash2,
  Loader2,
  Trophy,
  Globe,
  Crown,
  Award,
} from "lucide-react";
import {
  SCROLLBAR_CLS,
  SkeletonRows,
  EmptyState,
  EMERALD_BTN,
  relativeTime,
  scoreHex,
} from "../admin-helpers";

// ----- API types -----
interface ComparisonFeatures {
  overallScore: boolean;
  categoryScores: boolean;
  performance: boolean;
  technical: boolean;
  aeo: boolean;
  geo: boolean;
  keywordOverlap: boolean;
  backlinkComparison: boolean;
  contentGap: boolean;
}

interface CompetitorSettings {
  maxCompetitorsPerAudit: number;
  maxCompetitorUrls: number;
  competitorCrawlDepth: number;
  comparisonFeatures: ComparisonFeatures;
  autoRefreshDays: number;
  storeResults: boolean;
}

interface PlanLimitRow {
  plan: string;
  maxCompetitors: number;
  maxUrls: number;
}

interface RecentComparison {
  id: string;
  user: string;
  org: string;
  yourSite: string;
  competitors: string[];
  date: string;
  yourScore: number;
  competitorAvg: number;
}

interface CompetitorStats {
  totalComparisons: number;
  thisMonth: number;
  avgCompetitorsPerComparison: number;
}

interface CompetitorsResponse {
  settings: CompetitorSettings;
  planLimits: PlanLimitRow[];
  recentComparisons: RecentComparison[];
  stats: CompetitorStats;
}

const COMPARISON_FEATURES: { key: keyof ComparisonFeatures; label: string; desc: string }[] = [
  { key: "overallScore", label: "Overall Score", desc: "Side-by-side total Ufuq scores" },
  { key: "categoryScores", label: "Category Scores", desc: "Per-category comparison (SEO, AEO, GEO, etc.)" },
  { key: "performance", label: "Performance", desc: "Core Web Vitals & load metrics" },
  { key: "technical", label: "Technical SEO", desc: "Indexability, sitemaps, robots" },
  { key: "aeo", label: "AEO", desc: "Answer engine optimization" },
  { key: "geo", label: "GEO", desc: "Generative engine / AI visibility" },
  { key: "keywordOverlap", label: "Keyword Overlap", desc: "Shared & unique keywords between sites" },
  { key: "backlinkComparison", label: "Backlinks", desc: "Backlink profile comparison" },
  { key: "contentGap", label: "Content Gaps", desc: "Missing content opportunities vs competitors" },
];

const PLAN_BADGE: Record<string, string> = {
  free: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
  starter: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  pro: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  agency: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
};

export function AdminCompetitorsSection({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = React.useState<CompetitorsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [settings, setSettings] = React.useState<CompetitorSettings | null>(null);
  const [planLimits, setPlanLimits] = React.useState<PlanLimitRow[]>([]);
  const [toDelete, setToDelete] = React.useState<RecentComparison | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [savingSettings, setSavingSettings] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/competitors").then((r) => r.json() as Promise<CompetitorsResponse>);
      setData(r);
      setSettings(r.settings);
      setPlanLimits(r.planLimits ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load competitor settings");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const stats = data?.stats;

  function updateSetting<K extends keyof CompetitorSettings>(key: K, value: CompetitorSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updatePlanLimit(plan: string, patch: Partial<PlanLimitRow>) {
    setPlanLimits((prev) => prev.map((p) => (p.plan === plan ? { ...p, ...patch } : p)));
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      await fetch("/api/admin/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_settings", settings, planLimits }),
      });
      toast.success("Competitor settings saved");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  }

  async function deleteComparison() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      setData((prev) =>
        prev
          ? {
              ...prev,
              recentComparisons: prev.recentComparisons.filter((c) => c.id !== toDelete.id),
              stats: {
                ...prev.stats,
                totalComparisons: Math.max(0, prev.stats.totalComparisons - 1),
              },
            }
          : prev,
      );
      toast.success("Comparison deleted");
      setToDelete(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete comparison");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Competitor Management"
        subtitle="Configure competitor audit limits & comparison rules"
        icon={Swords}
        actions={
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Total Comparisons" value={stats?.totalComparisons ?? 0} icon={Swords} color="#10b981" />
        <StatCard label="This Month" value={stats?.thisMonth ?? 0} icon={Crown} color="#14b8a6" />
        <StatCard
          label="Avg Competitors / Comparison"
          value={(stats?.avgCompetitorsPerComparison ?? 0).toFixed(1)}
          icon={Award}
          color="#8b5cf6"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings */}
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <RefreshCw className="w-4 h-4 text-emerald-600" /> Limits & Crawl Settings
          </h3>
          {!settings ? (
            <SkeletonRows rows={4} cols={2} />
          ) : (
            <div className="space-y-5">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Max competitors per audit</Label>
                  <span className="text-sm tabular-nums font-semibold">
                    {settings.maxCompetitorsPerAudit}
                  </span>
                </div>
                <Slider
                  value={[settings.maxCompetitorsPerAudit]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(v) => updateSetting("maxCompetitorsPerAudit", v[0] ?? 1)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Max competitor URLs (per audit)</Label>
                  <span className="text-sm tabular-nums font-semibold">
                    {settings.maxCompetitorUrls.toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={[settings.maxCompetitorUrls]}
                  min={10}
                  max={5000}
                  step={10}
                  onValueChange={(v) => updateSetting("maxCompetitorUrls", v[0] ?? 10)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Competitor crawl depth</Label>
                  <span className="text-sm tabular-nums font-semibold">
                    {settings.competitorCrawlDepth} pages
                  </span>
                </div>
                <Slider
                  value={[settings.competitorCrawlDepth]}
                  min={1}
                  max={200}
                  step={1}
                  onValueChange={(v) => updateSetting("competitorCrawlDepth", v[0] ?? 1)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="cmp-refresh">Auto-refresh days</Label>
                  <Input
                    id="cmp-refresh"
                    type="number"
                    min={0}
                    max={90}
                    value={settings.autoRefreshDays}
                    onChange={(e) => updateSetting("autoRefreshDays", Number(e.target.value))}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Auto re-crawl competitors every N days
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="text-sm font-medium">Store historical results</div>
                  <div className="text-xs text-muted-foreground">
                    Persist competitor snapshots for trend analysis
                  </div>
                </div>
                <Switch
                  checked={settings.storeResults}
                  onCheckedChange={(v) => updateSetting("storeResults", v)}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Comparison features */}
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-emerald-600" /> Comparison Features
          </h3>
          {!settings ? (
            <SkeletonRows rows={6} cols={2} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMPARISON_FEATURES.map((f) => (
                <label
                  key={f.key}
                  className="flex items-start gap-2.5 p-2 rounded-md border bg-card hover:bg-muted/40 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={settings.comparisonFeatures[f.key]}
                    onCheckedChange={(v) =>
                      updateSetting("comparisonFeatures", {
                        ...settings.comparisonFeatures,
                        [f.key]: !!v,
                      })
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium">{f.label}</div>
                    <div className="text-[11px] text-muted-foreground">{f.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Separator />

      {/* Plan limits */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-emerald-600" /> Plan Limits
        </h3>
        <div className={`-mx-2 px-2 ${SCROLLBAR_CLS}`}>
          {loading ? (
            <SkeletonRows rows={4} cols={3} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Max competitors</TableHead>
                  <TableHead className="text-right">Max URLs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {planLimits.map((p) => (
                  <TableRow key={p.plan}>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize text-[11px] ${PLAN_BADGE[p.plan] ?? PLAN_BADGE.free}`}>
                        {p.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={p.maxCompetitors}
                        onChange={(e) =>
                          updatePlanLimit(p.plan, { maxCompetitors: Number(e.target.value) })
                        }
                        className="w-20 ml-auto text-right tabular-nums"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        max={5000}
                        step={10}
                        value={p.maxUrls}
                        onChange={(e) =>
                          updatePlanLimit(p.plan, { maxUrls: Number(e.target.value) })
                        }
                        className="w-24 ml-auto text-right tabular-nums"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Recent comparisons */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-emerald-600" /> Recent Comparisons
        </h3>
        <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[40vh]`}>
          {loading ? (
            <SkeletonRows rows={5} cols={6} />
          ) : (data?.recentComparisons ?? []).length === 0 ? (
            <EmptyState msg="No competitor comparisons yet" icon={Globe} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">User</TableHead>
                  <TableHead>Org</TableHead>
                  <TableHead className="min-w-[180px]">Your Site</TableHead>
                  <TableHead>Competitors</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Your Score</TableHead>
                  <TableHead>Comp. Avg</TableHead>
                  <TableHead>Winner</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {(data?.recentComparisons ?? []).map((c) => {
                  const youWin = c.yourScore >= c.competitorAvg;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-sm">{c.user}</TableCell>
                      <TableCell className="text-xs">{c.org}</TableCell>
                      <TableCell>
                        <code className="font-mono text-[11px]">{c.yourSite}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 max-w-[200px]">
                          {c.competitors.slice(0, 3).map((cp) => (
                            <code key={cp} className="font-mono text-[10px] text-muted-foreground truncate">
                              {cp}
                            </code>
                          ))}
                          {c.competitors.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{c.competitors.length - 3} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {relativeTime(c.date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="tabular-nums font-bold"
                          style={{ color: scoreHex(c.yourScore), borderColor: `${scoreHex(c.yourScore)}40` }}
                        >
                          {c.yourScore}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="tabular-nums font-bold"
                          style={{ color: scoreHex(c.competitorAvg), borderColor: `${scoreHex(c.competitorAvg)}40` }}
                        >
                          {c.competitorAvg}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {youWin ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                            <Trophy className="w-3 h-3" /> You
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                            <Swords className="w-3 h-3" /> Comp.
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => toast.info(`Comparison detail for ${c.yourSite} (demo)`)}
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 text-red-600 hover:text-red-700"
                            onClick={() => setToDelete(c)}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={savingSettings || !settings} className={EMERALD_BTN}>
          {savingSettings ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
          Save settings
        </Button>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => { if (!o) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comparison?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the comparison for{" "}
              <span className="font-medium text-foreground">{toDelete?.yourSite}</span> vs{" "}
              {toDelete?.competitors.length ?? 0} competitors. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void deleteComparison();
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
