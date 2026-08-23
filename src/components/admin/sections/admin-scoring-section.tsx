"use client";

import * as React from "react";
import { ViewHeader } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import {
  Gauge, RefreshCw, Save, RotateCcw, Info, Loader2,
} from "lucide-react";
import {
  SkeletonRows, EMERALD_BTN,
} from "../admin-helpers";

// ----- API types -----
interface ScoreWeights {
  technical: number;
  content: number;
  performance: number;
  aeo: number;
  geo: number;
  security: number;
}

interface ScoringCategory {
  key: keyof ScoreWeights;
  label: string;
  weight: number;
  icon: string;
  color: string;
}

interface ScoringResponse {
  weights: ScoreWeights;
  total: number;
  categories: ScoringCategory[];
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  technical: 25,
  content: 20,
  performance: 15,
  aeo: 15,
  geo: 15,
  security: 10,
};

export function AdminScoringSection({ refreshKey }: { refreshKey: number }) {
  const [weights, setWeights] = React.useState<ScoreWeights>(DEFAULT_WEIGHTS);
  const [categories, setCategories] = React.useState<ScoringCategory[]>([]);
  const [serverTotal, setServerTotal] = React.useState(100);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/scoring").then(
        (r) => r.json() as Promise<ScoringResponse>,
      );
      setWeights(r.weights ?? DEFAULT_WEIGHTS);
      setCategories(r.categories ?? []);
      setServerTotal(r.total ?? 100);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load scoring weights");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  // Live total of the local sliders
  const liveTotal = React.useMemo(
    () => Math.round(Object.values(weights).reduce((s, v) => s + v, 0) * 10) / 10,
    [weights],
  );
  const isBalanced = Math.abs(liveTotal - 100) < 0.05;

  // Build the chart data from the categories + live weights (so it animates)
  const chartData = React.useMemo(() => {
    if (categories.length === 0) {
      return [
        { key: "technical" as const, label: "Technical SEO", color: "#6366f1", weight: weights.technical },
        { key: "content" as const, label: "Content SEO", color: "#10b981", weight: weights.content },
        { key: "performance" as const, label: "Performance", color: "#f59e0b", weight: weights.performance },
        { key: "aeo" as const, label: "AEO", color: "#8b5cf6", weight: weights.aeo },
        { key: "geo" as const, label: "GEO", color: "#ec4899", weight: weights.geo },
        { key: "security" as const, label: "Security", color: "#06b6d4", weight: weights.security },
      ];
    }
    return categories.map((c) => ({
      key: c.key,
      label: c.label,
      color: c.color,
      weight: weights[c.key],
    }));
  }, [categories, weights]);

  function setWeight(key: keyof ScoreWeights, value: number) {
    setWeights((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/scoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights }),
      });
      if (!res.ok) throw new Error("save failed");
      const data = (await res.json()) as { ok: true; weights: ScoreWeights };
      setWeights(data.weights);
      setServerTotal(100);
      toast.success("Scoring weights saved (normalized to 100%)");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save weights");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setWeights(DEFAULT_WEIGHTS);
    toast.info("Reset to default weights (25/20/15/15/15/10) — click Save to apply");
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Scoring Weights"
        subtitle="Control how category scores combine into the Ufuq Score"
        icon={Gauge}
        actions={
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: weights card with sliders */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-600" /> Category Weights
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Total</span>
              <Badge
                variant="outline"
                className={`tabular-nums font-bold ${
                  isBalanced
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
                }`}
              >
                {liveTotal}%
              </Badge>
            </div>
          </div>

          {loading ? (
            <SkeletonRows rows={6} cols={2} />
          ) : (
            <div className="space-y-5">
              {chartData.map((cat) => (
                <WeightSlider
                  key={cat.key}
                  label={cat.label}
                  color={cat.color}
                  value={weights[cat.key]}
                  onChange={(v) => setWeight(cat.key, v)}
                />
              ))}
            </div>
          )}

          <Separator className="my-5" />

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={save} disabled={saving || !isBalanced} className={EMERALD_BTN}>
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
              Save weights
            </Button>
            <Button variant="outline" onClick={reset} disabled={saving}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset to defaults
            </Button>
            {!isBalanced && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Weights must sum to 100% (currently {liveTotal}%). Weights will be auto-normalized on save.
              </span>
            )}
          </div>
        </Card>

        {/* Right: donut chart */}
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Gauge className="w-4 h-4 text-emerald-600" /> Composition
          </h3>
          {loading ? (
            <div className="h-[260px] flex items-center justify-center">
              <SkeletonRows rows={4} cols={2} />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                      formatter={(value: number, name: string) => [`${value}%`, name]}
                    />
                    <Pie
                      data={chartData}
                      dataKey="weight"
                      nameKey="label"
                      innerRadius={56}
                      outerRadius={92}
                      paddingAngle={2}
                      stroke="hsl(var(--background, 0 0% 100%))"
                      strokeWidth={2}
                    >
                      {chartData.map((c) => (
                        <Cell key={c.key} fill={c.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase text-muted-foreground tracking-wide">Total</span>
                  <span className="text-xl font-bold tabular-nums">{liveTotal}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full mt-4">
                {chartData.map((c) => (
                  <div key={c.key} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-muted-foreground truncate">{c.label}</span>
                    <span className="ml-auto font-mono tabular-nums">{c.weight}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Explanation */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-emerald-600" /> How the Ufuq Score works
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Ufuq Score is a weighted average of 6 category scores. Adjust weights to prioritize
          what matters to your business. Weights are normalized to sum to 100% on save — the saved
          distribution is what each new audit will use when computing its overall score.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {chartData.map((c) => (
            <Badge key={c.key} variant="outline" className="gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: c.color }} />
              {c.label}: {weights[c.key]}%
            </Badge>
          ))}
          <Badge variant="secondary">
            Server total: {serverTotal}%
          </Badge>
        </div>
      </Card>
    </div>
  );
}

function WeightSlider({
  label,
  color,
  value,
  onChange,
}: {
  label: string;
  color: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
          <Label className="text-sm font-medium">{label}</Label>
        </div>
        <Badge
          variant="outline"
          className="tabular-nums font-mono"
          style={{ color, borderColor: `${color}40`, backgroundColor: `${color}10` }}
        >
          {value}%
        </Badge>
      </div>
      <Slider
        value={[value]}
        min={0}
        max={50}
        step={1}
        onValueChange={(arr) => onChange(arr[0] ?? value)}
      />
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>0%</span>
        <span>50%</span>
      </div>
    </div>
  );
}
