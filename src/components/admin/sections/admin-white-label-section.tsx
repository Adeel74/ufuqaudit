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
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Palette,
  RefreshCw,
  Plus,
  Pencil,
  Check,
  Globe,
  Mail,
  ImageIcon,
  Building2,
  Eye,
  Loader2,
} from "lucide-react";
import {
  SCROLLBAR_CLS,
  SkeletonRows,
  EmptyState,
  EMERALD_BTN,
  formatDateLong,
} from "../admin-helpers";

// ----- API types -----
type WhiteLabelStatus = "active" | "pending" | "disabled";

interface WhiteLabelConfig {
  id: string;
  orgName: string;
  domain: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  customCss: string;
  customDomain: string;
  emailFromName: string;
  emailFromAddress: string;
  reportFooter: string;
  portalEnabled: boolean;
  status: WhiteLabelStatus;
  createdAt: string;
}

interface WhiteLabelStats {
  total: number;
  active: number;
  pending: number;
  disabled: number;
  customDomains: number;
}

interface WhiteLabelResponse {
  configs: WhiteLabelConfig[];
  stats: WhiteLabelStats;
}

function statusBadgeClass(status: WhiteLabelStatus): string {
  if (status === "active")
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
  if (status === "pending")
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700";
}

export function AdminWhiteLabelSection({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = React.useState<WhiteLabelResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<WhiteLabelConfig | null>(null);
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/white-label").then((r) => r.json() as Promise<WhiteLabelResponse>);
      setData(r);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load white-label configs");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const stats = data?.stats;
  const configs = data?.configs ?? [];

  // Auto-select first config as preview target
  React.useEffect(() => {
    if (configs.length > 0 && !previewId) {
      setPreviewId(configs[0].id);
    }
  }, [configs, previewId]);

  const previewTarget = configs.find((c) => c.id === previewId) ?? configs[0] ?? null;

  function patchConfig(id: string, patch: Partial<WhiteLabelConfig>) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            configs: prev.configs.map((c) => (c.id === id ? { ...c, ...patch } : c)),
            stats: {
              ...prev.stats,
              active: prev.configs.filter((c) =>
                c.id === id ? (patch.status ?? c.status) === "active" : c.status === "active",
              ).length,
              pending: prev.configs.filter((c) =>
                c.id === id ? (patch.status ?? c.status) === "pending" : c.status === "pending",
              ).length,
              disabled: prev.configs.filter((c) =>
                c.id === id ? (patch.status ?? c.status) === "disabled" : c.status === "disabled",
              ).length,
            },
          }
        : prev,
    );
  }

  async function approveConfig(c: WhiteLabelConfig) {
    try {
      await fetch("/api/admin/white-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, action: "approve" }),
      });
      patchConfig(c.id, { status: "active" });
      toast.success(`Approved "${c.brandName}" white-label config`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to approve config");
    }
  }

  async function togglePortal(c: WhiteLabelConfig, next: boolean) {
    patchConfig(c.id, { portalEnabled: next });
    toast.success(`Portal ${next ? "enabled" : "disabled"} for "${c.brandName}"`);
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="White Label"
        subtitle="Manage agency branding & custom domains"
        icon={Palette}
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
              <Plus className="w-3.5 h-3.5 mr-1" /> Create config
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Configs" value={stats?.total ?? 0} icon={Palette} color="#10b981" />
        <StatCard label="Active" value={stats?.active ?? 0} icon={Check} color="#14b8a6" />
        <StatCard label="Pending" value={stats?.pending ?? 0} icon={Eye} color="#f59e0b" />
        <StatCard label="Custom Domains" value={stats?.customDomains ?? 0} icon={Globe} color="#0ea5e9" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configs grid */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-emerald-600" /> White-Label Configs
              <Badge variant="secondary" className="ml-1">
                {configs.length}
              </Badge>
            </h3>
            <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[70vh]`}>
              {loading ? (
                <SkeletonRows rows={4} cols={3} />
              ) : configs.length === 0 ? (
                <EmptyState msg="No white-label configs yet" icon={Palette} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {configs.map((c) => {
                    const isSelected = c.id === previewTarget?.id;
                    return (
                      <div
                        key={c.id}
                        className={`rounded-lg border bg-card p-4 transition-all cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 ${
                          isSelected ? "border-emerald-400 dark:border-emerald-700 ring-1 ring-emerald-300/40" : ""
                        }`}
                        onClick={() => setPreviewId(c.id)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm truncate">{c.brandName}</h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {c.orgName} · {c.domain}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`capitalize text-[10px] ${statusBadgeClass(c.status)}`}
                          >
                            {c.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            <div className="w-6 h-6 rounded border" style={{ backgroundColor: c.primaryColor }} title={`Primary: ${c.primaryColor}`} />
                            <div className="w-6 h-6 rounded border" style={{ backgroundColor: c.secondaryColor }} title={`Secondary: ${c.secondaryColor}`} />
                          </div>
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                            {c.logoUrl ? (
                              <img src={c.logoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {c.customDomain && (
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                                <Globe className="w-2.5 h-2.5 shrink-0" />
                                <span className="font-mono truncate">{c.customDomain}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                              <Mail className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{c.emailFromName} &lt;{c.emailFromAddress}&gt;</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3 italic">
                          {c.reportFooter || "—"}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <Switch
                              checked={c.portalEnabled}
                              onCheckedChange={(v) => void togglePortal(c, v)}
                            />
                            <span className="text-muted-foreground">Portal</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {c.status === "pending" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-emerald-600 hover:text-emerald-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void approveConfig(c);
                                }}
                                title="Approve"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditTarget(c);
                                setCreateOpen(true);
                              }}
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Branding preview */}
        <div className="lg:sticky lg:top-2 lg:self-start">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-emerald-600" /> Branding Preview
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              How the report looks for {previewTarget?.brandName ?? "—"}.
            </p>
            {previewTarget ? (
              <BrandingPreview config={previewTarget} />
            ) : (
              <EmptyState msg="No config to preview" icon={Eye} />
            )}
          </Card>
        </div>
      </div>

      <WhiteLabelDialog
        open={createOpen}
        onOpenChange={(o) => {
          if (!o) {
            setCreateOpen(false);
            setEditTarget(null);
          }
        }}
        existing={editTarget}
        onSaved={(cfg, isEdit) => {
          if (isEdit && editTarget) {
            patchConfig(editTarget.id, cfg);
            toast.success(`Config "${cfg.brandName}" updated`);
          } else {
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    configs: [
                      {
                        ...cfg,
                        id: crypto.randomUUID(),
                        status: "pending",
                        createdAt: new Date().toISOString(),
                      } as WhiteLabelConfig,
                      ...prev.configs,
                    ],
                    stats: {
                      ...prev.stats,
                      total: prev.stats.total + 1,
                      pending: prev.stats.pending + 1,
                    },
                  }
                : prev,
            );
            toast.success(`Config "${cfg.brandName}" created`);
          }
          setCreateOpen(false);
          setEditTarget(null);
        }}
      />
    </div>
  );
}

function BrandingPreview({ config }: { config: WhiteLabelConfig }) {
  const sample = 78;
  return (
    <div className="rounded-lg border overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: config.primaryColor, color: "#ffffff" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center overflow-hidden">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-white" />
            )}
          </div>
          <span className="font-bold text-sm">{config.brandName}</span>
        </div>
        <span className="text-[10px] opacity-80">{config.customDomain || config.domain}</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="text-[10px] uppercase tracking-wide text-slate-400">Audit Report</div>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl"
            style={{
              color: config.primaryColor,
              border: `4px solid ${config.primaryColor}30`,
            }}
          >
            {sample}
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold mb-1">Overall Ufuq Score</div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${sample}%`,
                  backgroundColor: config.primaryColor,
                }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">{sample}% of max</div>
          </div>
        </div>
        <div className="space-y-1.5">
          {[
            { label: "Technical", v: 82 },
            { label: "Content", v: 75 },
            { label: "AEO", v: 64 },
            { label: "GEO", v: 88 },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-16">{b.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full"
                  style={{ width: `${b.v}%`, backgroundColor: config.secondaryColor }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-slate-400 w-6 text-right">{b.v}</span>
            </div>
          ))}
        </div>
        <div
          className="pt-2 mt-2 border-t text-[10px] text-slate-400"
          style={{ borderColor: "#e2e8f0" }}
        >
          {config.reportFooter || `© ${new Date().getFullYear()} ${config.brandName}. All rights reserved.`}
        </div>
      </div>
    </div>
  );
}

interface ConfigDraft {
  orgName: string;
  domain: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  customCss: string;
  customDomain: string;
  emailFromName: string;
  emailFromAddress: string;
  reportFooter: string;
  portalEnabled: boolean;
}

function blankDraft(): ConfigDraft {
  return {
    orgName: "",
    domain: "",
    brandName: "",
    primaryColor: "#10b981",
    secondaryColor: "#14b8a6",
    logoUrl: "",
    customCss: "",
    customDomain: "",
    emailFromName: "",
    emailFromAddress: "",
    reportFooter: "",
    portalEnabled: false,
  };
}

function WhiteLabelDialog({
  open,
  onOpenChange,
  existing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  existing: WhiteLabelConfig | null;
  onSaved: (cfg: ConfigDraft, isEdit: boolean) => void;
}) {
  const [draft, setDraft] = React.useState<ConfigDraft>(blankDraft());
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (existing) {
      setDraft({
        orgName: existing.orgName,
        domain: existing.domain,
        brandName: existing.brandName,
        primaryColor: existing.primaryColor,
        secondaryColor: existing.secondaryColor,
        logoUrl: existing.logoUrl,
        customCss: existing.customCss,
        customDomain: existing.customDomain,
        emailFromName: existing.emailFromName,
        emailFromAddress: existing.emailFromAddress,
        reportFooter: existing.reportFooter,
        portalEnabled: existing.portalEnabled,
      });
    } else {
      setDraft(blankDraft());
    }
  }, [open, existing]);

  async function submit() {
    if (!draft.orgName.trim() || !draft.brandName.trim()) {
      toast.error("Org name & brand name required");
      return;
    }
    setSaving(true);
    try {
      if (!existing) {
        await fetch("/api/admin/white-label", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create", ...draft }),
        });
      }
      onSaved(draft, !!existing);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save config");
    } finally {
      setSaving(false);
    }
  }

  function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200_000) {
      toast.error("Logo too large (max 200KB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraft({ ...draft, logoUrl: String(reader.result ?? "") });
    };
    reader.readAsDataURL(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit white-label config" : "Create white-label config"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="wl-org">Organization</Label>
              <Input
                id="wl-org"
                placeholder="Acme Agency"
                value={draft.orgName}
                onChange={(e) => setDraft({ ...draft, orgName: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="wl-domain">Domain</Label>
              <Input
                id="wl-domain"
                placeholder="acme.com"
                value={draft.domain}
                onChange={(e) => setDraft({ ...draft, domain: e.target.value })}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="wl-brand">Brand name</Label>
            <Input
              id="wl-brand"
              placeholder="Acme SEO Suite"
              value={draft.brandName}
              onChange={(e) => setDraft({ ...draft, brandName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="wl-p">Primary color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={draft.primaryColor}
                  onChange={(e) => setDraft({ ...draft, primaryColor: e.target.value })}
                  className="w-10 h-8 rounded border cursor-pointer"
                />
                <Input
                  id="wl-p"
                  value={draft.primaryColor}
                  onChange={(e) => setDraft({ ...draft, primaryColor: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="wl-s">Secondary color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={draft.secondaryColor}
                  onChange={(e) => setDraft({ ...draft, secondaryColor: e.target.value })}
                  className="w-10 h-8 rounded border cursor-pointer"
                />
                <Input
                  id="wl-s"
                  value={draft.secondaryColor}
                  onChange={(e) => setDraft({ ...draft, secondaryColor: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="wl-logo">Logo</Label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded border bg-muted flex items-center justify-center overflow-hidden">
                {draft.logoUrl ? (
                  <img src={draft.logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <input
                id="wl-logo"
                type="file"
                accept="image/*"
                onChange={onLogoFile}
                className="text-xs file:mr-2 file:px-2 file:py-1 file:rounded file:border-0 file:bg-emerald-50 file:text-emerald-700"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="wl-cd">Custom domain</Label>
            <Input
              id="wl-cd"
              placeholder="reports.acme.com"
              value={draft.customDomain}
              onChange={(e) => setDraft({ ...draft, customDomain: e.target.value })}
              className="font-mono text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="wl-efn">Email from name</Label>
              <Input
                id="wl-efn"
                placeholder="Acme Reports"
                value={draft.emailFromName}
                onChange={(e) => setDraft({ ...draft, emailFromName: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="wl-efa">Email from address</Label>
              <Input
                id="wl-efa"
                type="email"
                placeholder="reports@acme.com"
                value={draft.emailFromAddress}
                onChange={(e) => setDraft({ ...draft, emailFromAddress: e.target.value })}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="wl-footer">Report footer</Label>
            <Textarea
              id="wl-footer"
              placeholder="© 2025 Acme SEO Suite. Confidential — do not distribute."
              value={draft.reportFooter}
              onChange={(e) => setDraft({ ...draft, reportFooter: e.target.value })}
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <div className="text-sm font-medium">Portal enabled</div>
              <div className="text-xs text-muted-foreground">
                Allow this agency to expose the white-label portal to its clients
              </div>
            </div>
            <Switch
              checked={draft.portalEnabled}
              onCheckedChange={(v) => setDraft({ ...draft, portalEnabled: v })}
            />
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
            {existing ? "Save changes" : "Create config"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
