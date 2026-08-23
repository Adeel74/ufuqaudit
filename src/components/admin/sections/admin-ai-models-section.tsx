"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Brain, RefreshCw, Pencil, Plus, Loader2, Zap, Crown, TestTube2,
  CheckCircle2,
} from "lucide-react";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState, EMERALD_BTN,
  formatCompact,
} from "../admin-helpers";

// ----- API types -----
interface AIModel {
  id: string;
  provider: string;
  model: string;
  apiKey: string; // masked
  temperature: number;
  maxTokens: number;
  contextWindow: number;
  costPerInputToken: number;
  costPerOutputToken: number;
  enabled: boolean;
  isDefault: boolean;
}

interface RoutingTier {
  modelId: string;
  purpose: string;
  model: string;
}

interface AIFeature {
  feature: string;
  enabled: boolean;
  modelId: string;
}

interface AIModelsResponse {
  models: AIModel[];
  routing: {
    cheap: RoutingTier;
    premium: RoutingTier;
    large: RoutingTier;
  };
  features: AIFeature[];
}

// Provider badge colors
const PROVIDER_BADGE: Record<string, string> = {
  "z.ai": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  openai: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
  anthropic: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  google: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
};

function providerBadgeCls(provider: string): string {
  return (
    PROVIDER_BADGE[provider.toLowerCase()] ??
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700"
  );
}

const ROUTING_TIERS: Array<{
  key: keyof AIModelsResponse["routing"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}> = [
  { key: "cheap", label: "Cheap", icon: Zap, desc: "Cost-efficient model for simple, high-volume tasks (meta tags, titles, alt text)." },
  { key: "premium", label: "Premium", icon: Brain, desc: "Balanced model for advanced content analysis (AEO, GEO, content briefs)." },
  { key: "large", label: "Large", icon: Crown, desc: "Most capable model for complex SEO strategy (competitor analysis, action plans)." },
];

export function AdminAIModelsSection({ refreshKey }: { refreshKey: number }) {
  const [models, setModels] = React.useState<AIModel[]>([]);
  const [routing, setRouting] = React.useState<AIModelsResponse["routing"] | null>(null);
  const [features, setFeatures] = React.useState<AIFeature[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editModel, setEditModel] = React.useState<AIModel | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/ai-models").then(
        (r) => r.json() as Promise<AIModelsResponse>,
      );
      setModels(r.models ?? []);
      setRouting(r.routing ?? null);
      setFeatures(r.features ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load AI models");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const total = models.length;
  const enabledCount = models.filter((m) => m.enabled).length;
  const defaultModel = models.find((m) => m.isDefault);

  async function toggleModel(model: AIModel) {
    setModels((prev) =>
      prev.map((m) =>
        m.id === model.id ? { ...m, enabled: !m.enabled } : m,
      ),
    );
    try {
      const res = await fetch("/api/admin/ai-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", modelId: model.id }),
      });
      if (!res.ok) throw new Error("toggle failed");
      const data = (await res.json()) as { ok: true; model: AIModel };
      setModels((prev) => prev.map((m) => (m.id === data.model.id ? data.model : m)));
      toast.success(`Model "${model.model}" ${data.model.enabled ? "enabled" : "disabled"}`);
    } catch (e) {
      console.error(e);
      setModels((prev) => prev.map((m) => (m.id === model.id ? { ...m, enabled: model.enabled } : m)));
      toast.error("Failed to toggle model");
    }
  }

  async function setDefaultModel(model: AIModel) {
    if (model.isDefault) return;
    setModels((prev) => prev.map((m) => ({ ...m, isDefault: m.id === model.id })));
    try {
      const res = await fetch("/api/admin/ai-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setDefault", modelId: model.id }),
      });
      if (!res.ok) throw new Error("setDefault failed");
      toast.success(`Default model set to "${model.model}"`);
    } catch (e) {
      console.error(e);
      void load();
      toast.error("Failed to set default model");
    }
  }

  async function toggleFeature(feature: AIFeature) {
    setFeatures((prev) =>
      prev.map((f) => (f.feature === feature.feature ? { ...f, enabled: !f.enabled } : f)),
    );
    toast.success(`Feature "${feature.feature}" ${!feature.enabled ? "enabled" : "disabled"} (demo)`);
  }

  function changeFeatureModel(feature: AIFeature, modelId: string) {
    setFeatures((prev) =>
      prev.map((f) => (f.feature === feature.feature ? { ...f, modelId } : f)),
    );
    toast.success(`"${feature.feature}" model updated (demo)`);
  }

  function changeRoutingModel(tierKey: keyof AIModelsResponse["routing"], modelId: string) {
    if (!routing) return;
    const m = models.find((x) => x.id === modelId);
    if (!m) return;
    setRouting({
      ...routing,
      [tierKey]: { ...routing[tierKey], modelId, model: m.model },
    });
    toast.success(`Routing tier "${tierKey}" → ${m.model} (demo)`);
  }

  function modelById(id: string): AIModel | undefined {
    return models.find((m) => m.id === id);
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="AI Models"
        subtitle="Configure AI providers, models & routing"
        icon={Brain}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => load()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <Button size="sm" className={EMERALD_BTN} onClick={() => setCreateOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add model
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Total Models" value={total} icon={Brain} color="#10b981" />
        <StatCard label="Enabled Models" value={enabledCount} icon={CheckCircle2} color="#14b8a6" />
        <StatCard
          label="Default Model"
          value={defaultModel ? defaultModel.model : "—"}
          icon={Crown}
          color="#f59e0b"
        />
      </div>

      {/* Models table */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-emerald-600" /> Configured Models
          <Badge variant="secondary" className="ml-1">{total}</Badge>
        </h3>
        <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[60vh]`}>
          {loading ? (
            <SkeletonRows rows={4} cols={10} />
          ) : models.length === 0 ? (
            <EmptyState msg="No AI models configured yet" icon={Brain} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead className="min-w-[160px]">Model</TableHead>
                  <TableHead className="min-w-[200px]">API Key</TableHead>
                  <TableHead className="text-right">Temp</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Max Tokens</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Context</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Cost / In</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Cost / Out</TableHead>
                  <TableHead className="text-center">Enabled</TableHead>
                  <TableHead className="text-center">Default</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {models.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${providerBadgeCls(m.provider)}`}>
                        {m.provider}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{m.model}</div>
                      <div className="text-xs text-muted-foreground font-mono">{m.id}</div>
                    </TableCell>
                    <TableCell>
                      <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{m.apiKey}</code>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{m.temperature.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{formatCompact(m.maxTokens)}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{formatCompact(m.contextWindow)}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">${m.costPerInputToken.toFixed(7)}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">${m.costPerOutputToken.toFixed(7)}</TableCell>
                    <TableCell className="text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex justify-center">
                            <Switch
                              checked={m.enabled}
                              onCheckedChange={() => toggleModel(m)}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{m.enabled ? "Enabled" : "Disabled"}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-center">
                      <input
                        type="radio"
                        name="default-model"
                        checked={m.isDefault}
                        onChange={() => setDefaultModel(m)}
                        disabled={!m.enabled}
                        className="w-4 h-4 accent-emerald-600 cursor-pointer disabled:cursor-not-allowed"
                        aria-label={`Set ${m.model} as default`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1"
                          onClick={() => setEditModel(m)}
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1"
                          onClick={() => toast.success(`Test request sent to ${m.model}`, { icon: "🧪" })}
                        >
                          <TestTube2 className="w-3.5 h-3.5" /> Test
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

      {/* AI Routing card */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-emerald-600" /> AI Routing
          <span className="text-xs text-muted-foreground font-normal">
            Pick which model handles which workload tier
          </span>
        </h3>
        {loading || !routing ? (
          <SkeletonRows rows={3} cols={2} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ROUTING_TIERS.map((tier) => {
              const Icon = tier.icon;
              const assigned = modelById(routing[tier.key].modelId);
              return (
                <div key={tier.key} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{tier.label}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{tier.key}</div>
                      </div>
                    </div>
                    {assigned && (
                      <Badge variant="outline" className={`text-[10px] ${providerBadgeCls(assigned.provider)}`}>
                        {assigned.provider}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 min-h-[36px]">{tier.desc}</p>
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] uppercase tracking-wide">Assigned model</Label>
                    <Select
                      value={routing[tier.key].modelId}
                      onValueChange={(v) => changeRoutingModel(tier.key, v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((m) => (
                          <SelectItem key={m.id} value={m.id} disabled={!m.enabled}>
                            {m.model} {m.isDefault ? "(default)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* AI Features card */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-emerald-600" /> AI Features
          <Badge variant="secondary" className="ml-1">{features.length}</Badge>
          <span className="text-xs text-muted-foreground font-normal">
            Per-feature model assignment
          </span>
        </h3>
        {loading ? (
          <SkeletonRows rows={5} cols={3} />
        ) : features.length === 0 ? (
          <EmptyState msg="No AI features configured" icon={Brain} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((f) => {
              const assigned = modelById(f.modelId);
              return (
                <div
                  key={f.feature}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <Brain className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{f.feature}</div>
                      <div className="text-xs text-muted-foreground">
                        {assigned ? `${assigned.model} · ${assigned.provider}` : "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={f.modelId}
                      onValueChange={(v) => changeFeatureModel(f, v)}
                      disabled={!f.enabled}
                    >
                      <SelectTrigger className="h-8 w-[160px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {models.filter((m) => m.enabled).map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Switch checked={f.enabled} onCheckedChange={() => toggleFeature(f)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <EditModelDialog
        model={editModel}
        onOpenChange={(o) => { if (!o) setEditModel(null); }}
        onSave={(m) => {
          setModels((prev) => prev.map((x) => (x.id === m.id ? m : x)));
          toast.success(`Model "${m.model}" updated (demo)`);
          setEditModel(null);
        }}
      />

      <CreateModelDialog
        open={createOpen}
        onOpenChange={(o) => { if (!o) setCreateOpen(false); }}
        onCreated={(m) => {
          setModels((prev) => [...prev, m]);
          toast.success(`Model "${m.model}" added (demo)`);
        }}
      />
    </div>
  );
}

function EditModelDialog({
  model,
  onOpenChange,
  onSave,
}: {
  model: AIModel | null;
  onOpenChange: (o: boolean) => void;
  onSave: (m: AIModel) => void;
}) {
  const [temperature, setTemperature] = React.useState(0.7);
  const [maxTokens, setMaxTokens] = React.useState(4096);
  const [contextWindow, setContextWindow] = React.useState(128000);
  const [costPerInputToken, setCostPerInputToken] = React.useState(0.00001);
  const [costPerOutputToken, setCostPerOutputToken] = React.useState(0.00003);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (model) {
      setTemperature(model.temperature);
      setMaxTokens(model.maxTokens);
      setContextWindow(model.contextWindow);
      setCostPerInputToken(model.costPerInputToken);
      setCostPerOutputToken(model.costPerOutputToken);
    }
  }, [model]);

  if (!model) return null;

  function submit() {
    if (!model) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSave({
        ...model,
        temperature: Number(temperature),
        maxTokens: Number(maxTokens),
        contextWindow: Number(contextWindow),
        costPerInputToken: Number(costPerInputToken),
        costPerOutputToken: Number(costPerOutputToken),
      });
    }, 200);
  }

  return (
    <Dialog open={!!model} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-emerald-600" /> Edit Model
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="rounded-md bg-muted/60 p-2 flex items-center gap-2 text-xs">
            <Badge variant="outline" className={`text-[10px] ${providerBadgeCls(model.provider)}`}>
              {model.provider}
            </Badge>
            <span className="font-medium text-foreground">{model.model}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="m-temp">Temperature</Label>
              <Input
                id="m-temp"
                type="number"
                step={0.1}
                min={0}
                max={2}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-max">Max tokens</Label>
              <Input
                id="m-max"
                type="number"
                min={1}
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-ctx">Context window</Label>
              <Input
                id="m-ctx"
                type="number"
                min={1}
                value={contextWindow}
                onChange={(e) => setContextWindow(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-api">API key (masked)</Label>
              <Input
                id="m-api"
                value={model.apiKey}
                disabled
                className="font-mono text-xs"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-in">Cost / input token ($)</Label>
              <Input
                id="m-in"
                type="number"
                step={0.0000001}
                min={0}
                value={costPerInputToken}
                onChange={(e) => setCostPerInputToken(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-out">Cost / output token ($)</Label>
              <Input
                id="m-out"
                type="number"
                step={0.0000001}
                min={0}
                value={costPerOutputToken}
                onChange={(e) => setCostPerOutputToken(Number(e.target.value))}
              />
            </div>
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

function CreateModelDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (m: AIModel) => void;
}) {
  const [provider, setProvider] = React.useState("Z.ai");
  const [model, setModel] = React.useState("");
  const [apiKey, setApiKey] = React.useState("");
  const [temperature, setTemperature] = React.useState(0.7);
  const [maxTokens, setMaxTokens] = React.useState(4096);
  const [contextWindow, setContextWindow] = React.useState(128000);
  const [costPerInputToken, setCostPerInputToken] = React.useState(0.00001);
  const [costPerOutputToken, setCostPerOutputToken] = React.useState(0.00003);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setProvider("Z.ai");
      setModel("");
      setApiKey("");
      setTemperature(0.7);
      setMaxTokens(4096);
      setContextWindow(128000);
      setCostPerInputToken(0.00001);
      setCostPerOutputToken(0.00003);
    }
  }, [open]);

  function submit() {
    if (!model.trim()) {
      toast.error("Model name is required");
      return;
    }
    if (!apiKey.trim()) {
      toast.error("API key is required");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      const id = `model_${Date.now()}`;
      onCreated({
        id,
        provider,
        model: model.trim(),
        apiKey: apiKey.length > 12 ? `${apiKey.slice(0, 4)}${"•".repeat(8)}${apiKey.slice(-4)}` : apiKey,
        temperature: Number(temperature),
        maxTokens: Number(maxTokens),
        contextWindow: Number(contextWindow),
        costPerInputToken: Number(costPerInputToken),
        costPerOutputToken: Number(costPerOutputToken),
        enabled: true,
        isDefault: false,
      });
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" /> Add AI Model
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Z.ai", "OpenAI", "Anthropic", "Google", "Mistral", "Cohere"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cm-model">Model name</Label>
              <Input
                id="cm-model"
                placeholder="glm-5.2"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cm-key">API key</Label>
            <Input
              id="cm-key"
              type="password"
              placeholder="sk_…"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-xs"
            />
            <span className="text-[10px] text-muted-foreground">Stored encrypted, masked in UI</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="cm-temp">Temp</Label>
              <Input
                id="cm-temp"
                type="number"
                step={0.1}
                min={0}
                max={2}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cm-max">Max tokens</Label>
              <Input
                id="cm-max"
                type="number"
                min={1}
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cm-ctx">Context</Label>
              <Input
                id="cm-ctx"
                type="number"
                min={1}
                value={contextWindow}
                onChange={(e) => setContextWindow(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="cm-in">Cost / input token ($)</Label>
              <Input
                id="cm-in"
                type="number"
                step={0.0000001}
                min={0}
                value={costPerInputToken}
                onChange={(e) => setCostPerInputToken(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cm-out">Cost / output token ($)</Label>
              <Input
                id="cm-out"
                type="number"
                step={0.0000001}
                min={0}
                value={costPerOutputToken}
                onChange={(e) => setCostPerOutputToken(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={saving} className={EMERALD_BTN}>
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            Add model
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
