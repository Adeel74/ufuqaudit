"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import {
  KeyRound, RefreshCw, MoreVertical, Plus, Loader2, Copy,
  AlertTriangle, BarChart3, Activity, RotateCcw,
} from "lucide-react";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState,
  EMERALD_BTN,
  type ApiKeyRow,
  formatDateLong, relativeTime, formatCompact, maskKey,
  statusBadgeClass,
} from "../admin-helpers";

function genApiTrend(): Array<{ day: string; requests: number }> {
  const now = Date.now();
  const data: Array<{ day: string; requests: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000);
    data.push({
      day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      requests: Math.round(2000 + Math.sin(i / 2) * 800 + Math.random() * 1200),
    });
  }
  return data;
}

const TOP_ENDPOINTS = [
  { endpoint: "POST /api/audit/start", count: 4_832, avgMs: 145, errRate: 0.8 },
  { endpoint: "GET /api/audit/:id", count: 12_104, avgMs: 38, errRate: 0.1 },
  { endpoint: "POST /api/ai/recommend", count: 2_541, avgMs: 2_104, errRate: 1.4 },
  { endpoint: "GET /api/admin/stats", count: 982, avgMs: 22, errRate: 0.0 },
  { endpoint: "POST /api/projects", count: 1_648, avgMs: 64, errRate: 0.3 },
];

export function AdminApiKeysSection({ refreshKey }: { refreshKey: number }) {
  const [keys, setKeys] = React.useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [revokeKey, setRevokeKey] = React.useState<ApiKeyRow | null>(null);
  const [revoking, setRevoking] = React.useState(false);
  const [newKey, setNewKey] = React.useState<string | null>(null);
  const [apiTrend] = React.useState(genApiTrend);

  const totalKeys = keys.length;
  const activeKeys = keys.filter((k) => k.status === "active").length;
  const requestsToday = apiTrend.at(-1)?.requests ?? 0;
  const rateLimitViolations = 14;

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/api-keys").then((r) => r.json() as Promise<{ keys: ApiKeyRow[] }>);
      setKeys(r.keys ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function revoke() {
    if (!revokeKey) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/api-keys?id=${encodeURIComponent(revokeKey.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("revoke failed");
      toast.success(`Revoked key "${revokeKey.name}"`);
      setRevokeKey(null);
      void load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to revoke key");
    } finally {
      setRevoking(false);
    }
  }

  async function regenerate(k: ApiKeyRow) {
    toast.success(`Regenerated key "${k.name}" (demo)`);
    void load();
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="API Keys"
        subtitle="Manage admin API keys and monitor endpoint health"
        icon={KeyRound}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => load()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <Button size="sm" className={EMERALD_BTN} onClick={() => setCreateOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Create API key
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Keys" value={totalKeys} icon={KeyRound} color="#10b981" />
        <StatCard label="Active Keys" value={activeKeys} icon={KeyRound} color="#10b981" />
        <StatCard label="Requests Today" value={formatCompact(requestsToday)} icon={Activity} color="#14b8a6" />
        <StatCard label="Rate Limit Violations" value={rateLimitViolations} hint="Last 24h" icon={AlertTriangle} color="#f97316" />
      </div>

      {/* API usage chart */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-emerald-600" /> API Requests — 30 days
        </h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={apiTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} interval={4} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Line type="monotone" dataKey="requests" stroke="#10b981" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* API keys table */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <KeyRound className="w-4 h-4 text-emerald-600" /> API Keys
        </h3>
        <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[50vh]`}>
          {loading ? (
            <SkeletonRows rows={4} cols={7} />
          ) : keys.length === 0 ? (
            <EmptyState msg="No API keys yet" icon={KeyRound} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="min-w-[220px]">Key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="whitespace-nowrap">Last Used</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {keys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium text-sm">{k.name}</TableCell>
                    <TableCell>
                      <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{maskKey(k.key)}</code>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDateLong(k.created)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{relativeTime(k.lastUsed)}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{formatCompact(k.requests)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${statusBadgeClass(k.status)}`}>
                        {k.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Manage key</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toast.info(`Usage for "${k.name}" (demo)`)}>
                            <BarChart3 className="w-3.5 h-3.5 mr-2" /> View usage
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => regenerate(k)}>
                            <RotateCcw className="w-3.5 h-3.5 mr-2" /> Regenerate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={k.status === "revoked"}
                            onClick={() => setRevokeKey(k)}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 mr-2" /> Revoke
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Endpoint analytics */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-emerald-600" /> Endpoint Analytics — Top 5
        </h3>
        <div className="-mx-2 px-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Avg response</TableHead>
                <TableHead className="text-right">Error rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="zebra">
              {TOP_ENDPOINTS.map((e) => (
                <TableRow key={e.endpoint}>
                  <TableCell className="font-mono text-xs">{e.endpoint}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCompact(e.count)}</TableCell>
                  <TableCell className="text-right tabular-nums text-xs">{e.avgMs}ms</TableCell>
                  <TableCell className={`text-right tabular-nums text-xs ${e.errRate > 1 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {e.errRate.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <CreateKeyDialog
        open={createOpen}
        onOpenChange={(o) => { if (!o) { setCreateOpen(false); setNewKey(null); } }}
        onCreated={(fullKey) => { setNewKey(fullKey); void load(); }}
      />

      <AlertDialog open={!!revokeKey} onOpenChange={(o) => { if (!o) setRevokeKey(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke{" "}
              <span className="font-medium text-foreground">{revokeKey?.name}</span>. Any
              service using this key will immediately lose access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void revoke();
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

function CreateKeyDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (fullKey: string) => void;
}) {
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [fullKey, setFullKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName("");
      setFullKey(null);
    }
  }, [open]);

  async function submit() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "create failed");
      }
      const data = (await res.json()) as { fullKey: string };
      setFullKey(data.fullKey);
      onCreated(data.fullKey);
      toast.success("API key created");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setSaving(false);
    }
  }

  function copyKey() {
    if (!fullKey) return;
    void navigator.clipboard.writeText(fullKey);
    toast.success("Copied to clipboard");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !fullKey) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{fullKey ? "API key created" : "Create API key"}</DialogTitle>
        </DialogHeader>
        {fullKey ? (
          <div className="grid gap-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-3 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Copy this key now. For security, it will only be shown this once.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs bg-muted px-2 py-1.5 rounded truncate">
                {fullKey}
              </code>
              <Button size="sm" variant="outline" onClick={copyKey}>
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy
              </Button>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button className={EMERALD_BTN}>Done</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ak-name">Key name</Label>
                <Input
                  id="ak-name"
                  placeholder="Production API"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submit();
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={saving}>Cancel</Button>
              </DialogClose>
              <Button onClick={submit} disabled={saving} className={EMERALD_BTN}>
                {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                Generate key
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
