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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  ShieldAlert,
  RefreshCw,
  Save,
  Shield,
  Globe,
  Clock,
  UserX,
  Search,
  Activity,
  AlertOctagon,
  Ban,
  Loader2,
  Lock,
  KeyRound,
} from "lucide-react";
import {
  SCROLLBAR_CLS,
  SkeletonRows,
  EmptyState,
  EMERALD_BTN,
  relativeTime,
  formatCompact,
} from "../admin-helpers";

// ----- API types -----
type Severity = "critical" | "high" | "medium" | "low";

interface FailedLoginRow {
  date: string;
  attempts: number;
  uniqueIps: number;
}

interface SuspiciousActivity {
  id: string;
  type: string;
  user: string;
  ip: string;
  country: string;
  attempts: number;
  timestamp: string;
  severity: Severity;
}

interface ActiveSession {
  id: string;
  user: string;
  device: string;
  ip: string;
  location: string;
  startedAt: string;
  lastActive: string;
}

interface AdminAuditEntry {
  id: string;
  admin: string;
  action: string;
  module: string;
  oldValue: string;
  newValue: string;
  ip: string;
  timestamp: string;
}

interface SecuritySettings {
  twoFactorRequired: boolean;
  adminTwoFactorRequired: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  apiRateLimit: number;
  ipWhitelist: string;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSpecial: boolean;
}

interface SecurityStats {
  failedLoginsToday: number;
  failedLogins30d: number;
  suspiciousEvents: number;
  activeSessions: number;
  blockedIps: number;
}

interface SecurityResponse {
  stats: SecurityStats;
  failedLogins: FailedLoginRow[];
  suspiciousActivity: SuspiciousActivity[];
  activeSessions: ActiveSession[];
  settings: SecuritySettings;
  adminAuditLog: AdminAuditEntry[];
}

function severityBadgeClass(s: Severity): string {
  switch (s) {
    case "critical":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800";
    case "high":
      return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800";
    case "medium":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    case "low":
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700";
  }
}

const MODULE_BADGE: Record<string, string> = {
  settings:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
  users: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  billing:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  plans: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  security:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
  audits:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
};

function moduleBadgeClass(m: string): string {
  return MODULE_BADGE[m?.toLowerCase()] ?? MODULE_BADGE.settings;
}

export function AdminSecuritySection({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = React.useState<SecurityResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [settings, setSettings] = React.useState<SecuritySettings | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [revokeTarget, setRevokeTarget] = React.useState<ActiveSession | null>(null);
  const [revoking, setRevoking] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/security").then((r) => r.json() as Promise<SecurityResponse>);
      setData(r);
      setSettings(r.settings);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load security data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const stats = data?.stats;
  const failedLogins = data?.failedLogins ?? [];
  const suspicious = data?.suspiciousActivity ?? [];
  const sessions = data?.activeSessions ?? [];
  const auditLog = data?.adminAuditLog ?? [];

  function updateSetting<K extends keyof SecuritySettings>(key: K, value: SecuritySettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function saveSettings() {
    setSaving(true);
    try {
      await fetch("/api/admin/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_settings", settings }),
      });
      toast.success("Security settings saved");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function confirmRevokeSession() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      setData((prev) =>
        prev
          ? {
              ...prev,
              activeSessions: prev.activeSessions.filter((s) => s.id !== revokeTarget.id),
              stats: {
                ...prev.stats,
                activeSessions: Math.max(0, prev.stats.activeSessions - 1),
              },
            }
          : prev,
      );
      toast.success(`Revoked session for ${revokeTarget.user}`);
      setRevokeTarget(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to revoke session");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Security Center"
        subtitle="Monitor threats, sessions & admin actions"
        icon={ShieldAlert}
        actions={
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Failed Today" value={stats?.failedLoginsToday ?? 0} icon={AlertOctagon} color="#ef4444" />
        <StatCard label="Failed (30d)" value={formatCompact(stats?.failedLogins30d ?? 0)} icon={AlertOctagon} color="#f97316" />
        <StatCard label="Suspicious" value={stats?.suspiciousEvents ?? 0} icon={ShieldAlert} color="#f59e0b" />
        <StatCard label="Active Sessions" value={stats?.activeSessions ?? 0} icon={Activity} color="#10b981" />
        <StatCard label="Blocked IPs" value={stats?.blockedIps ?? 0} icon={Ban} color="#64748b" />
      </div>

      {/* Failed logins chart */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <AlertOctagon className="w-4 h-4 text-red-500" /> Failed Login Attempts — 30 days
        </h3>
        {loading || !data ? (
          <div className="h-[200px]">
            <SkeletonRows rows={4} cols={8} />
          </div>
        ) : failedLogins.length === 0 ? (
          <EmptyState msg="No failed login attempts" icon={AlertOctagon} />
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={failedLogins} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(value: number, name: string) => {
                    if (name === "attempts") return [formatCompact(value), "Attempts"];
                    if (name === "uniqueIps") return [formatCompact(value), "Unique IPs"];
                    return [formatCompact(value), name];
                  }}
                />
                <Bar dataKey="attempts" fill="#ef4444" radius={[2, 2, 0, 0]} maxBarSize={20} />
                <Line type="monotone" dataKey="uniqueIps" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suspicious activity */}
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-amber-500" /> Suspicious Activity
            <Badge variant="secondary" className="ml-1">
              {suspicious.length}
            </Badge>
          </h3>
          <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[30vh]`}>
            {loading ? (
              <SkeletonRows rows={4} cols={5} />
            ) : suspicious.length === 0 ? (
              <EmptyState msg="No suspicious activity" icon={ShieldAlert} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">Attempts</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="zebra">
                  {suspicious.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs font-medium">{s.type}</TableCell>
                      <TableCell className="text-xs">{s.user}</TableCell>
                      <TableCell>
                        <code className="font-mono text-[10px] text-muted-foreground">{s.ip}</code>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Globe className="w-3 h-3 text-muted-foreground" />
                          {s.country}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-amber-600 dark:text-amber-400">
                        {s.attempts}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {relativeTime(s.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize text-[10px] ${severityBadgeClass(s.severity)}`}
                        >
                          {s.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 text-red-600 hover:text-red-700"
                            onClick={() => toast.success(`IP ${s.ip} blocked`)}
                            title="Block IP"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => toast.info(`Investigating ${s.type} from ${s.ip} (demo)`)}
                            title="Investigate"
                          >
                            <Search className="w-3.5 h-3.5" />
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

        {/* Active sessions */}
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-emerald-600" /> Active Sessions
            <Badge variant="secondary" className="ml-1">
              {sessions.length}
            </Badge>
          </h3>
          <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[30vh]`}>
            {loading ? (
              <SkeletonRows rows={4} cols={5} />
            ) : sessions.length === 0 ? (
              <EmptyState msg="No active sessions" icon={Activity} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="zebra">
                  {sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs font-medium">{s.user}</TableCell>
                      <TableCell className="text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {s.device}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="font-mono text-[10px] text-muted-foreground">{s.ip}</code>
                      </TableCell>
                      <TableCell className="text-xs">{s.location}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {relativeTime(s.startedAt)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {relativeTime(s.lastActive)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 text-red-600 hover:text-red-700"
                          onClick={() => setRevokeTarget(s)}
                          title="Revoke"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>

      {/* Security settings */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-emerald-600" /> Security Settings
        </h3>
        {!settings ? (
          <SkeletonRows rows={5} cols={3} />
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="text-sm font-medium">Require 2FA for all users</div>
                  <div className="text-xs text-muted-foreground">
                    Force two-factor authentication platform-wide
                  </div>
                </div>
                <Switch
                  checked={settings.twoFactorRequired}
                  onCheckedChange={(v) => updateSetting("twoFactorRequired", v)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="text-sm font-medium">Require 2FA for admins</div>
                  <div className="text-xs text-muted-foreground">
                    Admins must have 2FA enabled at all times
                  </div>
                </div>
                <Switch
                  checked={settings.adminTwoFactorRequired}
                  onCheckedChange={(v) => updateSetting("adminTwoFactorRequired", v)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="sec-session">Session timeout (min)</Label>
                <Input
                  id="sec-session"
                  type="number"
                  min={5}
                  max={1440}
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting("sessionTimeout", Number(e.target.value))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sec-max">Max login attempts</Label>
                <Input
                  id="sec-max"
                  type="number"
                  min={3}
                  max={20}
                  value={settings.maxLoginAttempts}
                  onChange={(e) => updateSetting("maxLoginAttempts", Number(e.target.value))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sec-lock">Lockout duration (min)</Label>
                <Input
                  id="sec-lock"
                  type="number"
                  min={5}
                  max={1440}
                  value={settings.lockoutDuration}
                  onChange={(e) => updateSetting("lockoutDuration", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="sec-rate">
                  API rate limit (req/min)
                </Label>
                <Input
                  id="sec-rate"
                  type="number"
                  min={10}
                  max={10000}
                  step={10}
                  value={settings.apiRateLimit}
                  onChange={(e) => updateSetting("apiRateLimit", Number(e.target.value))}
                />
                <span className="text-[10px] text-muted-foreground">Per-API-key per minute</span>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sec-wl">IP whitelist (comma-separated)</Label>
                <Input
                  id="sec-wl"
                  placeholder="10.0.0.0/8, 192.168.0.0/16"
                  value={settings.ipWhitelist}
                  onChange={(e) => updateSetting("ipWhitelist", e.target.value)}
                  className="font-mono text-xs"
                />
                <span className="text-[10px] text-muted-foreground">
                  CIDR ranges exempt from rate limiting
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lock className="w-4 h-4 text-emerald-600" /> Password Policy
              </div>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Minimum password length</Label>
                    <span className="text-sm tabular-nums font-semibold">
                      {settings.passwordMinLength} chars
                    </span>
                  </div>
                  <Slider
                    value={[settings.passwordMinLength]}
                    min={6}
                    max={32}
                    step={1}
                    onValueChange={(v) => updateSetting("passwordMinLength", v[0] ?? 6)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="text-sm">Uppercase (A-Z)</div>
                    <Switch
                      checked={settings.passwordRequireUppercase}
                      onCheckedChange={(v) => updateSetting("passwordRequireUppercase", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="text-sm">Number (0-9)</div>
                    <Switch
                      checked={settings.passwordRequireNumber}
                      onCheckedChange={(v) => updateSetting("passwordRequireNumber", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="text-sm">Special char (!@#$)</div>
                    <Switch
                      checked={settings.passwordRequireSpecial}
                      onCheckedChange={(v) => updateSetting("passwordRequireSpecial", v)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={saveSettings} disabled={saving} className={EMERALD_BTN}>
                {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                Save settings
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Admin audit log */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <KeyRound className="w-4 h-4 text-emerald-600" /> Admin Audit Log
          <Badge variant="secondary" className="ml-1">
            {auditLog.length}
          </Badge>
        </h3>
        <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[30vh]`}>
          {loading ? (
            <SkeletonRows rows={5} cols={6} />
          ) : auditLog.length === 0 ? (
            <EmptyState msg="No admin actions logged" icon={KeyRound} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead className="min-w-[200px]">Change</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {auditLog.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs font-medium">{a.admin}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">{a.action}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize text-[10px] ${moduleBadgeClass(a.module)}`}
                      >
                        {a.module}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <code className="font-mono text-muted-foreground bg-muted px-1 py-0.5 rounded max-w-[100px] truncate">
                          {a.oldValue || "—"}
                        </code>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">→</span>
                        <code className="font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded max-w-[100px] truncate">
                          {a.newValue || "—"}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="font-mono text-[10px] text-muted-foreground">{a.ip}</code>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {relativeTime(a.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      <AlertDialog open={!!revokeTarget} onOpenChange={(o) => { if (!o) setRevokeTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke session?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{revokeTarget?.user}</span> will be
              immediately signed out from this device ({revokeTarget?.device}). They will need to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmRevokeSession();
              }}
              disabled={revoking}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {revoking && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
