"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { toast } from "sonner";
import {
  Webhook,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Send,
  ChevronDown,
  ChevronRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";
import {
  SCROLLBAR_CLS,
  SkeletonRows,
  EmptyState,
  EMERALD_BTN,
  relativeTime,
  formatCompact,
  truncate,
} from "../admin-helpers";

// ----- API types -----
type WebhookStatus = "active" | "disabled";

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  status: WebhookStatus;
  createdAt: string;
  lastTriggered: string | null;
  totalDelivered: number;
  totalFailed: number;
}

interface WebhookLog {
  id: string;
  webhookId: string;
  webhookName: string;
  event: string;
  endpoint: string;
  status: number;
  responseTime: number;
  retryCount: number;
  timestamp: string;
}

interface WebhookStats {
  total: number;
  active: number;
  disabled: number;
  totalDelivered: number;
  totalFailed: number;
}

interface WebhooksResponse {
  webhooks: Webhook[];
  logs: WebhookLog[];
  availableEvents: string[];
  stats: WebhookStats;
}

const AVAILABLE_EVENT_DESCRIPTIONS: Record<string, string> = {
  "audit.started": "Audit crawl initiated",
  "audit.completed": "Audit finished successfully",
  "audit.failed": "Audit run errored out",
  "issue.created": "New issue detected",
  "issue.resolved": "Issue marked resolved",
  "report.generated": "PDF report produced",
  "report.shared": "Report link shared externally",
  "user.created": "New user signup",
  "user.upgraded": "User plan upgrade",
  "user.downgraded": "User plan downgrade",
  "user.cancelled": "Subscription cancelled",
  "payment.succeeded": "Payment captured",
  "payment.failed": "Payment declined",
  "refund.issued": "Refund processed",
  "organization.created": "New org registered",
  "organization.suspended": "Org suspended",
  "api_key.created": "API key generated",
  "api_key.revoked": "API key revoked",
};

function statusBadgeClass(status: number): string {
  if (status >= 200 && status < 300)
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
  if (status >= 400 && status < 500)
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
  if (status >= 500)
    return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800";
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700";
}

function webhookStatusBadgeClass(status: WebhookStatus): string {
  return status === "active"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
    : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700";
}

export function AdminWebhooksSection({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = React.useState<WebhooksResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Webhook | null>(null);
  const [toDelete, setToDelete] = React.useState<Webhook | null>(null);
  const [confirmDisable, setConfirmDisable] = React.useState<Webhook | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [toggling, setToggling] = React.useState(false);
  const [eventsOpen, setEventsOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/webhooks").then((r) => r.json() as Promise<WebhooksResponse>);
      setData(r);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const stats = data?.stats;
  const webhooks = data?.webhooks ?? [];
  const logs = data?.logs ?? [];
  const availableEvents = data?.availableEvents ?? [];

  function patchWebhook(id: string, patch: Partial<Webhook>) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            webhooks: prev.webhooks.map((w) => (w.id === id ? { ...w, ...patch } : w)),
            stats: {
              ...prev.stats,
              active: prev.webhooks.filter((w) =>
                w.id === id ? (patch.status ?? w.status) === "active" : w.status === "active",
              ).length,
              disabled: prev.webhooks.filter((w) =>
                w.id === id ? (patch.status ?? w.status) === "disabled" : w.status === "disabled",
              ).length,
            },
          }
        : prev,
    );
  }

  async function toggleWebhook(w: Webhook) {
    setToggling(true);
    const next: WebhookStatus = w.status === "active" ? "disabled" : "active";
    try {
      await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: w.id, action: "toggle", status: next }),
      });
      patchWebhook(w.id, { status: next });
      toast.success(`Webhook "${w.name}" ${next}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to toggle webhook");
    } finally {
      setToggling(false);
      setConfirmDisable(null);
    }
  }

  async function deleteWebhook() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/webhooks?id=${encodeURIComponent(toDelete.id)}`, {
        method: "DELETE",
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              webhooks: prev.webhooks.filter((w) => w.id !== toDelete.id),
              logs: prev.logs.filter((l) => l.webhookId !== toDelete.id),
              stats: {
                ...prev.stats,
                total: Math.max(0, prev.stats.total - 1),
                active: Math.max(0, prev.stats.active - (toDelete.status === "active" ? 1 : 0)),
                disabled: Math.max(0, prev.stats.disabled - (toDelete.status === "disabled" ? 1 : 0)),
              },
            }
          : prev,
      );
      toast.success(`Deleted webhook "${toDelete.name}"`);
      setToDelete(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete webhook");
    } finally {
      setDeleting(false);
    }
  }

  function testWebhook(w: Webhook) {
    toast.success(`Test event sent to "${w.name}"`);
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Webhooks"
        subtitle="Manage event webhooks & delivery logs"
        icon={Webhook}
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
              <Plus className="w-3.5 h-3.5 mr-1" /> Create webhook
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Webhooks" value={stats?.total ?? 0} icon={Webhook} color="#10b981" />
        <StatCard label="Active" value={stats?.active ?? 0} icon={CheckCircle2} color="#14b8a6" />
        <StatCard
          label="Total Delivered"
          value={formatCompact(stats?.totalDelivered ?? 0)}
          icon={Send}
          color="#0ea5e9"
        />
        <StatCard
          label="Total Failed"
          value={formatCompact(stats?.totalFailed ?? 0)}
          icon={AlertCircle}
          color="#ef4444"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Webhooks table */}
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Webhook className="w-4 h-4 text-emerald-600" /> Webhooks
            <Badge variant="secondary" className="ml-1">
              {webhooks.length}
            </Badge>
          </h3>
          <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[50vh]`}>
            {loading ? (
              <SkeletonRows rows={4} cols={6} />
            ) : webhooks.length === 0 ? (
              <EmptyState msg="No webhooks configured" icon={Webhook} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Name</TableHead>
                    <TableHead className="min-w-[180px]">URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Secret</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Triggered</TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="zebra">
                  {webhooks.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium text-sm">{w.name}</TableCell>
                      <TableCell>
                        <code className="font-mono text-[10px] text-muted-foreground">
                          {truncate(w.url, 40)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {w.events.slice(0, 2).map((ev) => (
                            <Badge
                              key={ev}
                              variant="outline"
                              className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-700 font-mono"
                            >
                              {ev}
                            </Badge>
                          ))}
                          {w.events.length > 2 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-700"
                            >
                              +{w.events.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          {truncate(w.secret, 14)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize text-[10px] ${webhookStatusBadgeClass(w.status)}`}
                        >
                          {w.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {relativeTime(w.lastTriggered)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-emerald-700 dark:text-emerald-400">
                        {formatCompact(w.totalDelivered)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-red-600 dark:text-red-400">
                        {formatCompact(w.totalFailed)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => testWebhook(w)}
                            title="Send test event"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditTarget(w);
                              setCreateOpen(true);
                            }}
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 text-amber-600 hover:text-amber-700"
                            onClick={() => setConfirmDisable(w)}
                            title={w.status === "active" ? "Disable" : "Enable"}
                          >
                            {w.status === "active" ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 text-red-600 hover:text-red-700"
                            onClick={() => setToDelete(w)}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Delivery logs */}
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-emerald-600" /> Delivery Logs
            <Badge variant="secondary" className="ml-1">
              {logs.length}
            </Badge>
          </h3>
          <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[50vh]`}>
            {loading ? (
              <SkeletonRows rows={6} cols={5} />
            ) : logs.length === 0 ? (
              <EmptyState msg="No webhook deliveries logged yet" icon={Activity} />
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
                  >
                    <Badge
                      variant="outline"
                      className={`tabular-nums text-[10px] font-bold ${statusBadgeClass(log.status)}`}
                    >
                      {log.status}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium truncate">{log.webhookName}</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-700 font-mono"
                        >
                          {log.event}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
                        {log.endpoint}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-[10px] tabular-nums text-muted-foreground">
                        {log.responseTime}ms
                      </span>
                      {log.retryCount > 0 && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">
                          ↻ {log.retryCount}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {relativeTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Available events reference */}
      <Card className="p-5">
        <Collapsible open={eventsOpen} onOpenChange={setEventsOpen}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" /> Available Events Reference
              <Badge variant="secondary" className="ml-1">
                {availableEvents.length || Object.keys(AVAILABLE_EVENT_DESCRIPTIONS).length}
              </Badge>
            </h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {eventsOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
              {(availableEvents.length ? availableEvents : Object.keys(AVAILABLE_EVENT_DESCRIPTIONS)).map(
                (ev) => (
                  <div
                    key={ev}
                    className="flex items-center justify-between gap-2 p-2 rounded-md border bg-muted/30"
                  >
                    <code className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                      {ev}
                    </code>
                    <span className="text-[11px] text-muted-foreground text-right">
                      {AVAILABLE_EVENT_DESCRIPTIONS[ev] ?? "—"}
                    </span>
                  </div>
                ),
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <WebhookDialog
        open={createOpen}
        onOpenChange={(o) => {
          if (!o) {
            setCreateOpen(false);
            setEditTarget(null);
          }
        }}
        existing={editTarget}
        availableEvents={availableEvents.length ? availableEvents : Object.keys(AVAILABLE_EVENT_DESCRIPTIONS)}
        onSaved={(wh, isEdit) => {
          if (isEdit && editTarget) {
            patchWebhook(editTarget.id, wh);
            toast.success(`Webhook "${wh.name}" updated`);
          } else {
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    webhooks: [
                      { ...wh, id: crypto.randomUUID(), createdAt: new Date().toISOString(), lastTriggered: null, totalDelivered: 0, totalFailed: 0 } as Webhook,
                      ...prev.webhooks,
                    ],
                    stats: {
                      ...prev.stats,
                      total: prev.stats.total + 1,
                      active: prev.stats.active + (wh.status === "active" ? 1 : 0),
                      disabled: prev.stats.disabled + (wh.status === "disabled" ? 1 : 0),
                    },
                  }
                : prev,
            );
            toast.success(`Webhook "${wh.name}" created`);
          }
          setCreateOpen(false);
          setEditTarget(null);
        }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => { if (!o) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">{toDelete?.name}</span> and remove its
              delivery logs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void deleteWebhook();
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

      <AlertDialog open={!!confirmDisable} onOpenChange={(o) => { if (!o) setConfirmDisable(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDisable?.status === "active" ? "Disable webhook?" : "Enable webhook?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{confirmDisable?.name}</span> will be{" "}
              {confirmDisable?.status === "active" ? "disabled (no deliveries)" : "re-enabled"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (confirmDisable) void toggleWebhook(confirmDisable);
              }}
              disabled={toggling}
              className={
                confirmDisable?.status === "active"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : EMERALD_BTN
              }
            >
              {toggling && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              {confirmDisable?.status === "active" ? "Disable" : "Enable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface WebhookDraft {
  name: string;
  url: string;
  events: string[];
  secret: string;
  status: WebhookStatus;
}

function blankDraft(): WebhookDraft {
  return {
    name: "",
    url: "",
    events: [],
    secret: "whsec_" + Math.random().toString(36).slice(2, 14),
    status: "active",
  };
}

function WebhookDialog({
  open,
  onOpenChange,
  existing,
  availableEvents,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  existing: Webhook | null;
  availableEvents: string[];
  onSaved: (wh: WebhookDraft, isEdit: boolean) => void;
}) {
  const [draft, setDraft] = React.useState<WebhookDraft>(blankDraft());
  const [saving, setSaving] = React.useState(false);
  const [showSecret, setShowSecret] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (existing) {
      setDraft({
        name: existing.name,
        url: existing.url,
        events: existing.events,
        secret: existing.secret,
        status: existing.status,
      });
    } else {
      setDraft(blankDraft());
    }
    setShowSecret(false);
  }, [open, existing]);

  function toggleEvent(ev: string) {
    setDraft((d) => ({
      ...d,
      events: d.events.includes(ev)
        ? d.events.filter((e) => e !== ev)
        : [...d.events, ev],
    }));
  }

  async function submit() {
    if (!draft.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!draft.url.trim() || !/^https?:\/\//.test(draft.url)) {
      toast.error("Valid URL required (http/https)");
      return;
    }
    if (draft.events.length === 0) {
      toast.error("Select at least one event");
      return;
    }
    setSaving(true);
    try {
      if (!existing) {
        await fetch("/api/admin/webhooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create", ...draft }),
        });
      }
      onSaved(draft, !!existing);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save webhook");
    } finally {
      setSaving(false);
    }
  }

  function regenerateSecret() {
    setDraft({ ...draft, secret: "whsec_" + Math.random().toString(36).slice(2, 14) });
    toast.success("New secret generated");
  }

  function copySecret() {
    void navigator.clipboard.writeText(draft.secret);
    toast.success("Secret copied");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit webhook" : "Create webhook"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="wh-name">Name</Label>
            <Input
              id="wh-name"
              placeholder="Slack audit notifier"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="wh-url">Endpoint URL</Label>
            <Input
              id="wh-url"
              placeholder="https://hooks.example.com/ufuq"
              value={draft.url}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              className="font-mono text-xs"
            />
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="wh-secret">Signing secret</Label>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  onClick={() => setShowSecret((v) => !v)}
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  onClick={copySecret}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  onClick={regenerateSecret}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <Input
              id="wh-secret"
              type={showSecret ? "text" : "password"}
              value={draft.secret}
              onChange={(e) => setDraft({ ...draft, secret: e.target.value })}
              className="font-mono text-xs"
            />
            <span className="text-[10px] text-muted-foreground">
              Used to sign webhook payloads (HMAC-SHA256)
            </span>
          </div>
          <div className="grid gap-1.5">
            <Label>Events ({draft.events.length} selected)</Label>
            <div className="max-h-[200px] overflow-y-auto p-2 rounded-md border grid gap-1">
              {availableEvents.map((ev) => (
                <label
                  key={ev}
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1.5 rounded"
                >
                  <Checkbox
                    checked={draft.events.includes(ev)}
                    onCheckedChange={() => toggleEvent(ev)}
                  />
                  <code className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                    {ev}
                  </code>
                  <span className="text-[11px] text-muted-foreground ml-auto text-right">
                    {AVAILABLE_EVENT_DESCRIPTIONS[ev] ?? ""}
                  </span>
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
            {existing ? "Save changes" : "Create webhook"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
