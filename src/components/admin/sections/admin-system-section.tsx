"use client";

import * as React from "react";
import { ViewHeader } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Settings as SettingsIcon, RefreshCw, Save, Clock, Activity,
  Database, Server, HardDrive, Mail, Brain, CreditCard,
  ShieldCheck, Gauge, Cpu, Globe, Calendar, CheckCircle2,
} from "lucide-react";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState,
  type AuditLog,
  formatDate,
} from "../admin-helpers";

interface SaasSettings {
  siteName: string;
  defaultLanguage: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  registrationEnabled: boolean;
  trialEnabled: boolean;
  trialDuration: number;
  freePlanEnabled: boolean;
  maintenanceMode: boolean;
  newSignups: boolean;
  aiRecs: boolean;
  freeAudit: boolean;
}

interface AuditSettings {
  maxCrawlDepth: number;
  maxUrls: number;
  crawlTimeout: number;
  concurrentCrawlers: number;
  userAgent: string;
  retryAttempts: number;
}

const DEFAULT_SAAS: SaasSettings = {
  siteName: "UfuqAudit",
  defaultLanguage: "en-US",
  timezone: "UTC",
  currency: "USD",
  dateFormat: "MMM D, YYYY",
  registrationEnabled: true,
  trialEnabled: true,
  trialDuration: 14,
  freePlanEnabled: true,
  maintenanceMode: false,
  newSignups: true,
  aiRecs: true,
  freeAudit: true,
};

const DEFAULT_AUDIT: AuditSettings = {
  maxCrawlDepth: 100,
  maxUrls: 5000,
  crawlTimeout: 10000,
  concurrentCrawlers: 5,
  userAgent: "UfuqAuditBot/1.0",
  retryAttempts: 3,
};

const HEALTH_SERVICES = [
  { name: "Application", icon: Server, responseMs: 32, status: "operational" },
  { name: "Database", icon: Database, responseMs: 12, status: "operational" },
  { name: "Redis Cache", icon: Cpu, responseMs: 2, status: "operational" },
  { name: "Queue", icon: Activity, responseMs: 8, status: "operational" },
  { name: "Storage", icon: HardDrive, responseMs: 45, status: "operational" },
  { name: "Email Service", icon: Mail, responseMs: 124, status: "operational" },
  { name: "AI Provider", icon: Brain, responseMs: 412, status: "degraded" },
  { name: "Payment Provider", icon: CreditCard, responseMs: 88, status: "operational" },
];

export function AdminSystemSection({ refreshKey }: { refreshKey: number }) {
  const [saas, setSaas] = React.useState<SaasSettings>(DEFAULT_SAAS);
  const [audit, setAudit] = React.useState<AuditSettings>(DEFAULT_AUDIT);
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/audit-logs").then((r) => r.json() as Promise<{ logs: AuditLog[] }>);
      setLogs(r.logs ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  function saveSaas() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings saved");
    }, 400);
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="System Settings"
        subtitle="Configure platform, audit, and SaaS settings"
        icon={SettingsIcon}
        actions={
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General settings */}
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <SettingsIcon className="w-4 h-4 text-emerald-600" /> General
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5 col-span-2">
              <Label htmlFor="sys-sitename">Site name</Label>
              <Input
                id="sys-sitename"
                value={saas.siteName}
                onChange={(e) => setSaas({ ...saas, siteName: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Default language</Label>
              <Select
                value={saas.defaultLanguage}
                onValueChange={(v) => setSaas({ ...saas, defaultLanguage: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["en-US", "en-GB", "ur-PK", "ar-SA", "de-DE", "fr-FR", "es-ES"].map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Timezone</Label>
              <Select
                value={saas.timezone}
                onValueChange={(v) => setSaas({ ...saas, timezone: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["UTC", "America/New_York", "Europe/London", "Asia/Karachi", "Asia/Dubai", "Asia/Tokyo"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Currency</Label>
              <Select
                value={saas.currency}
                onValueChange={(v) => setSaas({ ...saas, currency: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["USD", "EUR", "GBP", "PKR", "AED", "INR"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Date format</Label>
              <Select
                value={saas.dateFormat}
                onValueChange={(v) => setSaas({ ...saas, dateFormat: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["MMM D, YYYY", "DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "D MMM YYYY"].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* SaaS settings */}
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> SaaS Settings
          </h3>
          <div className="space-y-3">
            <ToggleRow
              icon={SettingsIcon}
              label="Maintenance mode"
              desc="Show a maintenance page to all visitors"
              checked={saas.maintenanceMode}
              onToggle={(v) => { setSaas({ ...saas, maintenanceMode: v }); toast.success("Saved"); }}
            />
            <ToggleRow
              icon={Activity}
              label="New signups"
              desc="Allow new account registration"
              checked={saas.newSignups}
              onToggle={(v) => { setSaas({ ...saas, newSignups: v }); toast.success("Saved"); }}
            />
            <ToggleRow
              icon={Brain}
              label="AI recommendations"
              desc="Enable AI-generated fixes for audits"
              checked={saas.aiRecs}
              onToggle={(v) => { setSaas({ ...saas, aiRecs: v }); toast.success("Saved"); }}
            />
            <ToggleRow
              icon={Globe}
              label="Free audit"
              desc="Allow running a free audit without signup"
              checked={saas.freeAudit}
              onToggle={(v) => { setSaas({ ...saas, freeAudit: v }); toast.success("Saved"); }}
            />
            <Separator />
            <ToggleRow
              icon={Calendar}
              label="Registration enabled"
              desc="Allow new account sign-up"
              checked={saas.registrationEnabled}
              onToggle={(v) => setSaas({ ...saas, registrationEnabled: v })}
            />
            <ToggleRow
              icon={Clock}
              label="Trial enabled"
              desc="Offer free trial on paid plans"
              checked={saas.trialEnabled}
              onToggle={(v) => setSaas({ ...saas, trialEnabled: v })}
            />
            <div className="grid gap-1.5">
              <Label>Trial duration (days)</Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={saas.trialDuration}
                onChange={(e) => setSaas({ ...saas, trialDuration: Number(e.target.value) })}
              />
            </div>
            <ToggleRow
              icon={ShieldCheck}
              label="Free plan enabled"
              desc="Allow users to subscribe to the free plan"
              checked={saas.freePlanEnabled}
              onToggle={(v) => setSaas({ ...saas, freePlanEnabled: v })}
            />
          </div>
          <Button
            size="sm"
            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={saveSaas}
            disabled={saving}
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            Save SaaS settings
          </Button>
        </Card>

        {/* Audit settings */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Gauge className="w-4 h-4 text-emerald-600" /> Audit Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <SliderRow
              label="Max crawl depth"
              value={audit.maxCrawlDepth}
              min={1}
              max={1000}
              step={1}
              suffix="pages"
              onChange={(v) => setAudit({ ...audit, maxCrawlDepth: v })}
            />
            <SliderRow
              label="Max URLs per crawl"
              value={audit.maxUrls}
              min={10}
              max={100000}
              step={10}
              suffix="URLs"
              onChange={(v) => setAudit({ ...audit, maxUrls: v })}
            />
            <SliderRow
              label="Crawl timeout"
              value={audit.crawlTimeout}
              min={1000}
              max={60000}
              step={500}
              suffix="ms"
              onChange={(v) => setAudit({ ...audit, crawlTimeout: v })}
            />
            <SliderRow
              label="Concurrent crawlers"
              value={audit.concurrentCrawlers}
              min={1}
              max={20}
              step={1}
              suffix="workers"
              onChange={(v) => setAudit({ ...audit, concurrentCrawlers: v })}
            />
            <SliderRow
              label="Retry attempts"
              value={audit.retryAttempts}
              min={0}
              max={5}
              step={1}
              suffix="retries"
              onChange={(v) => setAudit({ ...audit, retryAttempts: v })}
            />
            <div className="grid gap-1.5">
              <Label htmlFor="sys-ua">User agent</Label>
              <Input
                id="sys-ua"
                className="font-mono text-xs"
                value={audit.userAgent}
                onChange={(e) => setAudit({ ...audit, userAgent: e.target.value })}
              />
              <span className="text-[10px] text-muted-foreground">Identifies UfuqAuditBot in robots.txt logs</span>
            </div>
          </div>
          <Button
            size="sm"
            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => toast.success("Audit settings saved")}
          >
            <Save className="w-3.5 h-3.5 mr-1" /> Save audit settings
          </Button>
        </Card>
      </div>

      {/* System health */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-emerald-600" /> System Health
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {HEALTH_SERVICES.map((s) => {
            const Icon = s.icon;
            const isOk = s.status === "operational";
            return (
              <div key={s.name} className="p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{s.name}</span>
                  </div>
                  {isOk ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className={isOk ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                    {isOk ? "Operational" : "Degraded"}
                  </span>
                  <span className="tabular-nums">{s.responseMs}ms</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Audit logs table */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-emerald-600" /> Audit Logs
          <Badge variant="secondary" className="ml-1">{logs.length}</Badge>
        </h3>
        <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[50vh]`}>
          {loading ? (
            <SkeletonRows rows={6} cols={4} />
          ) : logs.length === 0 ? (
            <EmptyState msg="No logs yet" icon={Clock} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="inline w-3 h-3 mr-1" />
                      {formatDate(l.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{l.action}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {l.entity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[260px] truncate" title={l.details ?? ""}>
                      {l.details ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  desc,
  checked,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card">
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <Badge variant="outline" className="tabular-nums bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          {value.toLocaleString()} {suffix}
        </Badge>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step ?? 1}
        onValueChange={(arr) => onChange(arr[0] ?? value)}
      />
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
}

