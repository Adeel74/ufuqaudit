"use client";

import * as React from "react";
import { ViewHeader } from "@/components/dashboard/shared";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  SlidersHorizontal, Bot, Shield, Cpu, Sparkles, Globe, Zap,
  Save, Play, Clock, Layers, RotateCcw, FileText, Gauge,
  MessageSquare, Brain, ShieldCheck, Check, Loader2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------- Types ----------
type UserAgentKey = "ufuq" | "googlebot" | "bingbot" | "custom";

interface EngineOption {
  key: EngineKey;
  label: string;
  weight: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

type EngineKey =
  | "technical"
  | "content"
  | "performance"
  | "aeo"
  | "geo"
  | "security";

interface CrawlSettings {
  depth: number;
  followRedirects: boolean;
  checkRobots: boolean;
  renderJs: boolean;
  checkSubdomains: boolean;
  crawlExternal: boolean;
  userAgent: UserAgentKey;
  customUserAgent: string;
  crawlDelayMs: number;
  maxConcurrent: number;
  excludePaths: string;
  includePaths: string;
  engines: Record<EngineKey, boolean>;
}

interface Preset {
  id: string;
  name: string;
  settings: CrawlSettings;
}

// ---------- Constants ----------
const EMERALD_BTN = "bg-emerald-600 hover:bg-emerald-700 text-white";

const SCROLLBAR_CLS =
  "max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent";

const ENGINES: EngineOption[] = [
  { key: "technical", label: "Technical SEO", weight: 25, icon: Cpu, color: "#6366f1" },
  { key: "content", label: "Content", weight: 20, icon: FileText, color: "#10b981" },
  { key: "performance", label: "Performance", weight: 15, icon: Gauge, color: "#f59e0b" },
  { key: "aeo", label: "AEO", weight: 15, icon: MessageSquare, color: "#8b5cf6" },
  { key: "geo", label: "GEO", weight: 15, icon: Brain, color: "#ec4899" },
  { key: "security", label: "Security", weight: 10, icon: ShieldCheck, color: "#06b6d4" },
];

const UA_LABELS: Record<UserAgentKey, string> = {
  ufuq: "UfuqAuditBot",
  googlebot: "Googlebot",
  bingbot: "Bingbot",
  custom: "Custom",
};

const DEFAULT_SETTINGS: CrawlSettings = {
  depth: 50,
  followRedirects: true,
  checkRobots: true,
  renderJs: true,
  checkSubdomains: false,
  crawlExternal: false,
  userAgent: "ufuq",
  customUserAgent: "",
  crawlDelayMs: 200,
  maxConcurrent: 5,
  excludePaths: "",
  includePaths: "",
  engines: {
    technical: true,
    content: true,
    performance: true,
    aeo: true,
    geo: true,
    security: true,
  },
};

// ---------- Mock presets ----------
function makePresets(): Preset[] {
  return [
    {
      id: "preset-quick",
      name: "Quick check",
      settings: {
        ...DEFAULT_SETTINGS,
        depth: 15,
        renderJs: false,
        engines: {
          technical: true,
          content: false,
          performance: true,
          aeo: false,
          geo: false,
          security: true,
        },
      },
    },
    {
      id: "preset-full",
      name: "Full audit",
      settings: { ...DEFAULT_SETTINGS, depth: 100, maxConcurrent: 8 },
    },
    {
      id: "preset-aeo",
      name: "AEO focus",
      settings: {
        ...DEFAULT_SETTINGS,
        depth: 60,
        renderJs: true,
        engines: {
          technical: false,
          content: true,
          performance: false,
          aeo: true,
          geo: true,
          security: false,
        },
      },
    },
  ];
}

// ---------- Helpers ----------
function estimateSeconds(depth: number, renderJs: boolean): number {
  const base = Math.max(5, Math.round((depth / 4) * (renderJs ? 1.8 : 1)));
  return base;
}

function summarize(s: CrawlSettings): string[] {
  const lines: string[] = [];
  lines.push(`Depth: ${s.depth} pages`);
  const enabledEngines = ENGINES.filter((e) => s.engines[e.key]).map((e) => e.label);
  lines.push(`Engines: ${enabledEngines.length ? enabledEngines.join(", ") : "none"}`);
  const opts: string[] = [];
  if (s.followRedirects) opts.push("redirects");
  if (s.checkRobots) opts.push("robots");
  if (s.renderJs) opts.push("JS render");
  if (s.checkSubdomains) opts.push("subdomains");
  if (s.crawlExternal) opts.push("external links");
  lines.push(`Options: ${opts.length ? opts.join(", ") : "none"}`);
  lines.push(`User agent: ${UA_LABELS[s.userAgent]}`);
  lines.push(`Crawl delay: ${s.crawlDelayMs}ms · concurrent: ${s.maxConcurrent}`);
  return lines;
}

// =================== Component ===================
export function CrawlSettingsView() {
  const setView = useAppStore((s) => s.setView);

  const [settings, setSettings] = React.useState<CrawlSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] =
    React.useState<CrawlSettings>(DEFAULT_SETTINGS);

  const presets = React.useMemo(() => makePresets(), []);
  const [presetId, setPresetId] = React.useState<string>("preset-full");
  const [pendingPreset, setPendingPreset] = React.useState<string>(presetId);

  const [savedPresets, setSavedPresets] = React.useState<Preset[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [newPresetName, setNewPresetName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const isDirty =
    JSON.stringify(settings) !== JSON.stringify(originalSettings);

  function update<K extends keyof CrawlSettings>(
    key: K,
    value: CrawlSettings[K],
  ) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  function updateEngine(key: EngineKey, on: boolean) {
    setSettings((s) => ({
      ...s,
      engines: { ...s.engines, [key]: on },
    }));
  }

  function applyPreset(id: string) {
    const p =
      presets.find((x) => x.id === id) ?? savedPresets.find((x) => x.id === id);
    if (!p) return;
    setSettings({ ...p.settings });
    setOriginalSettings({ ...p.settings });
    setPresetId(p.id);
    setPendingPreset(p.id);
    toast.success(`Preset "${p.name}" applied`);
  }

  function onResetDefaults() {
    setSettings({ ...DEFAULT_SETTINGS });
    setOriginalSettings({ ...DEFAULT_SETTINGS });
    setPresetId("");
    setPendingPreset("");
    toast.info("Restored default settings");
  }

  async function onSaveAsPreset() {
    const name = newPresetName.trim();
    if (!name) {
      toast.error("Enter a preset name");
      return;
    }
    setSaving(true);
    // Simulate a small delay so the spinner is visible.
    await new Promise((r) => setTimeout(r, 400));
    const preset: Preset = {
      id: `saved-${Date.now()}`,
      name,
      settings: { ...settings },
    };
    setSavedPresets((prev) => [...prev, preset]);
    setSaving(false);
    setSaveDialogOpen(false);
    setNewPresetName("");
    toast.success(`Preset "${name}" saved`);
  }

  function onRun() {
    if (!isDirty && pendingPreset === presetId) {
      toast.success("Settings saved", {
        description: "Enter a URL on the home page to start the audit.",
      });
    } else {
      setOriginalSettings({ ...settings });
      toast.success("Settings saved", {
        description: "Enter a URL on the home page to start the audit.",
      });
    }
    setView("landing");
  }

  const allPresets = [...presets, ...savedPresets];
  const enabledEngineCount = ENGINES.filter(
    (e) => settings.engines[e.key],
  ).length;
  const totalWeight = ENGINES.filter(
    (e) => settings.engines[e.key],
  ).reduce((acc, e) => acc + e.weight, 0);
  const estimatedSec = estimateSeconds(settings.depth, settings.renderJs);
  const summaryLines = summarize(settings);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Crawl Settings"
        subtitle="Configure audit scope & depth"
        icon={SlidersHorizontal}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={onResetDefaults}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset defaults
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---------- Settings form (left, spans 2) ---------- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Crawl configuration */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold">Crawl configuration</h3>
            </div>
            <Separator />

            {/* Crawl depth slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Crawl depth</Label>
                <Badge
                  variant="outline"
                  className="font-mono text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900"
                >
                  {settings.depth} pages
                </Badge>
              </div>
              <Slider
                min={1}
                max={100}
                step={1}
                value={[settings.depth]}
                onValueChange={(v) => update("depth", v[0] ?? 1)}
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>1 page</span>
                <span>100 pages</span>
              </div>
            </div>

            {/* Switches */}
            <SwitchRow
              icon={RotateCcw}
              label="Follow redirects"
              hint="Resolve 301/302 responses before auditing"
              checked={settings.followRedirects}
              onCheckedChange={(b) => update("followRedirects", b)}
            />
            <Separator />
            <SwitchRow
              icon={Shield}
              label="Check robots.txt"
              hint="Skip paths disallowed for the selected user agent"
              checked={settings.checkRobots}
              onCheckedChange={(b) => update("checkRobots", b)}
            />
            <Separator />
            <SwitchRow
              icon={Cpu}
              label="Render JavaScript"
              hint="Slower but more accurate for JS-heavy sites"
              checked={settings.renderJs}
              onCheckedChange={(b) => update("renderJs", b)}
              note
            />
            <Separator />
            <SwitchRow
              icon={Globe}
              label="Check subdomains"
              hint="Crawl www., blog., shop. and other subdomains"
              checked={settings.checkSubdomains}
              onCheckedChange={(b) => update("checkSubdomains", b)}
            />
            <Separator />
            <SwitchRow
              icon={Layers}
              label="Crawl external links"
              hint="Follow links pointing to other domains (depth-limited)"
              checked={settings.crawlExternal}
              onCheckedChange={(b) => update("crawlExternal", b)}
            />

            <Separator />

            {/* User agent */}
            <div className="space-y-2">
              <Label className="text-sm">User agent</Label>
              <Select
                value={settings.userAgent}
                onValueChange={(v) => update("userAgent", v as UserAgentKey)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select user agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ufuq">UfuqAuditBot</SelectItem>
                  <SelectItem value="googlebot">Googlebot</SelectItem>
                  <SelectItem value="bingbot">Bingbot</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {settings.userAgent === "custom" && (
                <Input
                  value={settings.customUserAgent}
                  onChange={(e) => update("customUserAgent", e.target.value)}
                  placeholder="Mozilla/5.0 (compatible; MyBot/1.0)"
                  className="font-mono text-xs"
                />
              )}
            </div>

            {/* Crawl delay */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Crawl delay</Label>
                <Badge variant="outline" className="font-mono text-xs">
                  {settings.crawlDelayMs} ms
                </Badge>
              </div>
              <Slider
                min={0}
                max={5000}
                step={50}
                value={[settings.crawlDelayMs]}
                onValueChange={(v) => update("crawlDelayMs", v[0] ?? 0)}
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>0 ms (aggressive)</span>
                <span>5000 ms (polite)</span>
              </div>
            </div>

            {/* Max concurrent */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Max concurrent requests</Label>
                <Badge variant="outline" className="font-mono text-xs">
                  {settings.maxConcurrent}
                </Badge>
              </div>
              <Slider
                min={1}
                max={20}
                step={1}
                value={[settings.maxConcurrent]}
                onValueChange={(v) => update("maxConcurrent", v[0] ?? 1)}
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>1</span>
                <span>20</span>
              </div>
            </div>

            <Separator />

            {/* Exclude paths */}
            <div className="space-y-1.5">
              <Label className="text-sm">Exclude paths</Label>
              <p className="text-[11px] text-muted-foreground">
                One path per line — e.g. <code className="font-mono">/admin</code>, <code className="font-mono">/cart</code>, <code className="font-mono">/checkout</code>
              </p>
              <Textarea
                rows={3}
                value={settings.excludePaths}
                onChange={(e) => update("excludePaths", e.target.value)}
                placeholder={"/admin\n/cart\n/checkout"}
                className="resize-y font-mono text-xs"
              />
            </div>

            {/* Include only paths */}
            <div className="space-y-1.5">
              <Label className="text-sm">
                Include only paths{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Restrict crawl to URLs matching one of these patterns.
              </p>
              <Textarea
                rows={2}
                value={settings.includePaths}
                onChange={(e) => update("includePaths", e.target.value)}
                placeholder={"/blog/*\n/docs/*"}
                className="resize-y font-mono text-xs"
              />
            </div>
          </Card>

          {/* Engine selection */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold">Engines to run</h3>
              </div>
              <Badge
                variant="outline"
                className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900"
              >
                {enabledEngineCount}/{ENGINES.length} enabled
              </Badge>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ENGINES.map((e) => {
                const checked = settings.engines[e.key];
                const Icon = e.icon;
                return (
                  <label
                    key={e.key}
                    htmlFor={`engine-${e.key}`}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                      checked
                        ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                        : "hover:bg-muted/40 opacity-80",
                    )}
                  >
                    <Checkbox
                      id={`engine-${e.key}`}
                      checked={checked}
                      onCheckedChange={(b) => updateEngine(e.key, b === true)}
                      className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Icon
                          className="w-3.5 h-3.5"
                          style={{ color: e.color }}
                        />
                        <span className="text-sm font-medium">{e.label}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Weight: {e.weight}%
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {enabledEngineCount === 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-2.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Select at least one engine to get a usable audit score.
              </div>
            )}
            <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
              <span>Active engines contribute to your overall Ufuq Score.</span>
              <span className="font-mono">Total weight: {totalWeight}%</span>
            </div>
          </Card>
        </div>

        {/* ---------- Right column: preset manager + summary (sticky) ---------- */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-4 space-y-4">
            {/* Preset manager */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-sm">Presets</h3>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs">Load a preset</Label>
                <Select
                  value={pendingPreset}
                  onValueChange={(v) => setPendingPreset(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a preset…" />
                  </SelectTrigger>
                  <SelectContent>
                    {allPresets.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {savedPresets.some((s) => s.id === p.id) && (
                          <span className="text-[10px] text-muted-foreground ml-1">
                            (saved)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={!pendingPreset || pendingPreset === presetId}
                  onClick={() => applyPreset(pendingPreset)}
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Apply preset
                </Button>
              </div>

              <Separator />

              <Button
                variant="outline"
                size="sm"
                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                onClick={() => {
                  setNewPresetName("");
                  setSaveDialogOpen(true);
                }}
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save as preset
              </Button>

              {savedPresets.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">
                    Saved presets
                  </Label>
                  <div className="space-y-1">
                    {savedPresets.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPendingPreset(p.id)}
                        className={cn(
                          "w-full text-left text-xs rounded-md px-2 py-1.5 transition-colors border",
                          pendingPreset === p.id
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400"
                            : "hover:bg-muted/60 border-transparent",
                        )}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Summary + Run */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-sm">Summary</h3>
                {isDirty && (
                  <Badge className="ml-auto bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                    Modified
                  </Badge>
                )}
              </div>
              <Separator />
              <ul className="space-y-1.5">
                {summaryLines.map((line, i) => (
                  <li
                    key={i}
                    className="text-xs text-foreground/80 flex items-start gap-1.5"
                  >
                    <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">
                      •
                    </span>
                    <span className="break-words">{line}</span>
                  </li>
                ))}
              </ul>
              <Separator />
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  Est. time
                </span>
                <span className="font-mono">
                  ~{estimatedSec}s · 1 credit
                </span>
              </div>

              <Button
                className={cn(EMERALD_BTN, "w-full")}
                onClick={onRun}
                disabled={enabledEngineCount === 0}
              >
                <Play className="w-4 h-4 mr-1.5" />
                Run audit
              </Button>
              {enabledEngineCount === 0 && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center">
                  Select at least one engine to run an audit.
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* ---------- Save preset dialog ---------- */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Save as preset
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="preset-name" className="text-xs">
              Preset name
            </Label>
            <Input
              id="preset-name"
              value={newPresetName}
              autoFocus
              onChange={(e) => setNewPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveAsPreset();
              }}
              placeholder="e.g. E-commerce deep audit"
              maxLength={60}
            />
            <p className="text-[11px] text-muted-foreground">
              The current crawl settings, engine selection and options will be
              saved under this name.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className={EMERALD_BTN}
              onClick={onSaveAsPreset}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save preset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- Sub-components ----------
function SwitchRow({
  icon: Icon,
  label,
  hint,
  checked,
  onCheckedChange,
  note = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (b: boolean) => void;
  note?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          {hint && (
            <div
              className={cn(
                "text-[11px] mt-0.5",
                note
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-muted-foreground",
              )}
            >
              {hint}
            </div>
          )}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}
