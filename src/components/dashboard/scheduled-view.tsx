"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CalendarClock, Plus, Loader2, MoreHorizontal, Play, Trash2,
  CalendarCheck, Repeat, Activity, Clock, Mail, Link as LinkIcon,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------- Types ----------
type Frequency = "weekly" | "biweekly" | "monthly";

interface ScheduledJob {
  id: string;
  url: string;
  frequency: Frequency;
  dayOfWeek: number; // 0-6
  timeOfDay: string; // "HH:MM"
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string;
  lastScore: number | null;
  notifyEmail: string;
  createdAt: string;
}

interface ScheduledCreateBody {
  url: string;
  frequency: Frequency;
  dayOfWeek: number;
  timeOfDay: string;
  notifyEmail: string;
}

// ---------- Constants ----------
const EMERALD = "#10b981";
const TEAL_DARK = "#0f766e";
const EMERALD_BTN = "bg-emerald-600 hover:bg-emerald-700 text-white";

const SCROLLBAR_CLS =
  "max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FREQ_META: Record<Frequency, { label: string; cls: string }> = {
  weekly: {
    label: "Weekly",
    cls: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  },
  biweekly: {
    label: "Bi-weekly",
    cls: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  },
  monthly: {
    label: "Monthly",
    cls: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
  },
};

// ---------- Helpers ----------
function scoreColor(v: number): string {
  return v >= 80 ? "#10b981" : v >= 60 ? "#f59e0b" : v >= 40 ? "#f97316" : "#ef4444";
}

function truncateUrl(u: string, n = 28): string {
  const stripped = u.replace(/^https?:\/\//, "");
  if (stripped.length <= n) return stripped;
  return stripped.slice(0, n - 1) + "…";
}

function truncateEmail(e: string, n = 18): string {
  if (e.length <= n) return e;
  return e.slice(0, n - 1) + "…";
}

function relTime(iso: string | null): string {
  if (!iso) return "Never";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "Never";
  const diff = Date.now() - t;
  const fmt = (abs: number, suffix: string) => {
    if (abs < 60_000) return `<1m${suffix}`;
    const mins = Math.floor(abs / 60_000);
    if (mins < 60) return `${mins}m${suffix}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h${suffix}`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d${suffix}`;
    const months = Math.floor(days / 30);
    return `${months}mo${suffix}`;
  };
  if (diff < 0) return fmt(-diff, "");
  return fmt(diff, " ago");
}

function formatSchedule(job: ScheduledJob): string {
  const day = DAYS[job.dayOfWeek] ?? "?";
  return `${day} at ${job.timeOfDay}`;
}

// Estimate past run count from createdAt + frequency (mock heuristic).
function estimateRuns(job: ScheduledJob): number {
  if (!job.lastRunAt) return 0;
  const created = new Date(job.createdAt).getTime();
  const days = Math.max(1, (Date.now() - created) / 86_400_000);
  const cycle = job.frequency === "weekly" ? 7 : job.frequency === "biweekly" ? 14 : 30;
  return Math.max(1, Math.floor(days / cycle));
}

// =================== Component ===================
export function ScheduledAuditsView() {
  const currentAudit = useAppStore((s) => s.currentAudit);
  const user = useAppStore((s) => s.user);

  const [schedules, setSchedules] = React.useState<ScheduledJob[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog + form state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState<ScheduledCreateBody>({
    url: "",
    frequency: "weekly",
    dayOfWeek: 1,
    timeOfDay: "09:00",
    notifyEmail: user?.email ?? "demo@ufuqaudit.app",
  });

  // Delete confirmation target
  const [deleteTarget, setDeleteTarget] = React.useState<ScheduledJob | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/scheduled", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as { schedules: ScheduledJob[] };
      setSchedules(Array.isArray(j.schedules) ? j.schedules : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load schedules";
      setError(msg);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open dialog and prefill URL/email from current context
  const openCreateDialog = React.useCallback(() => {
    setForm({
      url: currentAudit?.url ?? "",
      frequency: "weekly",
      dayOfWeek: 1,
      timeOfDay: "09:00",
      notifyEmail: user?.email ?? "demo@ufuqaudit.app",
    });
    setDialogOpen(true);
  }, [currentAudit, user]);

  const onCreate = async () => {
    const url = form.url.trim();
    if (!url) {
      toast.error("Enter a website URL to schedule");
      return;
    }
    const notifyEmail = form.notifyEmail.trim();
    if (!notifyEmail) {
      toast.error("A notify email is required");
      return;
    }
    setAdding(true);
    try {
      const r = await fetch("/api/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          frequency: form.frequency,
          dayOfWeek: form.dayOfWeek,
          timeOfDay: form.timeOfDay,
          notifyEmail,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      const j = (await r.json()) as { schedule: ScheduledJob };
      setSchedules((prev) => [j.schedule, ...prev]);
      toast.success("Schedule created — first audit queued");
      setDialogOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create schedule";
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  const onToggle = (job: ScheduledJob, next: boolean) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === job.id ? { ...s, enabled: next } : s)),
    );
    if (next) {
      toast.success(`Schedule enabled for ${truncateUrl(job.url, 24)}`, {
        description: `Next run ${relTime(job.nextRunAt)}`,
      });
    } else {
      toast.info(`Schedule paused for ${truncateUrl(job.url, 24)}`);
    }
  };

  const onRunNow = (job: ScheduledJob) => {
    toast.success("Audit queued", {
      description: `Running ${truncateUrl(job.url, 32)} now — results will arrive shortly`,
    });
  };

  const onConfirmDelete = () => {
    if (!deleteTarget) return;
    setSchedules((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    toast.success("Schedule deleted");
    setDeleteTarget(null);
  };

  // ---------- Derived stats ----------
  const activeCount = schedules.filter((s) => s.enabled).length;
  const totalRuns = schedules.reduce((sum, s) => sum + estimateRuns(s), 0);
  const scored = schedules.filter((s) => typeof s.lastScore === "number");
  const avgScore =
    scored.length > 0
      ? Math.round(scored.reduce((sum, s) => sum + (s.lastScore ?? 0), 0) / scored.length)
      : null;
  const nextRunDate = (() => {
    const upcoming = schedules
      .filter((s) => s.enabled)
      .map((s) => new Date(s.nextRunAt).getTime())
      .filter((t) => !Number.isNaN(t));
    if (upcoming.length === 0) return null;
    return Math.min(...upcoming);
  })();
  const nextRunRel = nextRunDate !== null ? relTime(new Date(nextRunDate).toISOString()) : null;

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="Scheduled Audits"
          subtitle="Automate recurring audits and get notified"
          icon={CalendarClock}
          actions={
            <Button size="sm" className={EMERALD_BTN} disabled>
              <Plus className="w-3.5 h-3.5 mr-1" /> New schedule
            </Button>
          }
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  // ---------- Empty ----------
  if (schedules.length === 0) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="Scheduled Audits"
          subtitle="Automate recurring audits and get notified"
          icon={CalendarClock}
          actions={
            <Button size="sm" className={EMERALD_BTN} onClick={openCreateDialog}>
              <Plus className="w-3.5 h-3.5 mr-1" /> New schedule
            </Button>
          }
        />
        <Card className="p-10 text-center border-dashed">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-3">
            <CalendarClock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-semibold text-lg">No scheduled audits yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {error
              ? `We couldn't load your schedules (${error}). Try again in a moment.`
              : "Automate your monitoring — schedule weekly, bi-weekly or monthly audits and we'll email you the results."}
          </p>
          <Button className={cn(EMERALD_BTN, "mt-5")} onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-1" /> Create schedule
          </Button>
        </Card>
        <NewScheduleDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          form={form}
          setForm={setForm}
          onCreate={onCreate}
          adding={adding}
        />
      </div>
    );
  }

  // ---------- Main render ----------
  return (
    <div className="space-y-6">
      <ViewHeader
        title="Scheduled Audits"
        subtitle="Automate recurring audits and get notified"
        icon={CalendarClock}
        actions={
          <Button size="sm" className={EMERALD_BTN} onClick={openCreateDialog}>
            <Plus className="w-3.5 h-3.5 mr-1" /> New schedule
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Schedules"
          value={activeCount}
          hint={`of ${schedules.length} total`}
          color={EMERALD}
          icon={CalendarCheck}
        />
        <StatCard
          label="Total Runs"
          value={totalRuns}
          hint="Estimated past runs"
          color={TEAL_DARK}
          icon={Repeat}
        />
        <StatCard
          label="Avg Score"
          value={avgScore === null ? "—" : avgScore}
          hint={avgScore === null ? "No runs yet" : "From last runs"}
          color={avgScore === null ? undefined : scoreColor(avgScore)}
          icon={Activity}
        />
        <StatCard
          label="Next Run"
          value={nextRunRel ?? "—"}
          hint={nextRunRel === null ? "No active schedules" : "Soonest scheduled"}
          color={EMERALD}
          icon={Clock}
        />
      </div>

      {/* Schedules table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Schedules</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {schedules.length} scheduled {schedules.length === 1 ? "audit" : "audits"} · {activeCount} active
            </p>
          </div>
        </div>

        <div className={SCROLLBAR_CLS}>
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="min-w-[200px]">URL</TableHead>
                <TableHead className="w-[110px]">Frequency</TableHead>
                <TableHead className="w-[120px]">Schedule</TableHead>
                <TableHead className="w-[100px]">Last Run</TableHead>
                <TableHead className="w-[90px]">Last Score</TableHead>
                <TableHead className="w-[100px]">Next Run</TableHead>
                <TableHead className="min-w-[160px]">Notify</TableHead>
                <TableHead className="w-[70px] text-center">Enabled</TableHead>
                <TableHead className="w-[50px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="zebra">
              {schedules.map((job) => {
                const freqMeta = FREQ_META[job.frequency] ?? FREQ_META.weekly;
                const score = job.lastScore;
                return (
                  <TableRow key={job.id} className="hover:bg-muted/40">
                    {/* URL */}
                    <TableCell className="max-w-[260px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <LinkIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-foreground truncate cursor-help font-medium">
                              {truncateUrl(job.url)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[400px] break-all">
                            {job.url}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>

                    {/* Frequency */}
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", freqMeta.cls)}>
                        {freqMeta.label}
                      </Badge>
                    </TableCell>

                    {/* Schedule */}
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatSchedule(job)}
                    </TableCell>

                    {/* Last Run */}
                    <TableCell className="text-xs text-muted-foreground">
                      {relTime(job.lastRunAt)}
                    </TableCell>

                    {/* Last Score */}
                    <TableCell>
                      {score === null ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold tabular-nums"
                          style={{
                            backgroundColor: `${scoreColor(score)}1a`,
                            color: scoreColor(score),
                          }}
                        >
                          {score}
                        </span>
                      )}
                    </TableCell>

                    {/* Next Run */}
                    <TableCell className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {job.enabled ? relTime(job.nextRunAt) : "—"}
                    </TableCell>

                    {/* Notify */}
                    <TableCell className="max-w-[180px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground truncate cursor-help">
                              {truncateEmail(job.notifyEmail)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">{job.notifyEmail}</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>

                    {/* Enabled Switch */}
                    <TableCell className="text-center">
                      <Switch
                        checked={job.enabled}
                        onCheckedChange={(v) => onToggle(job, v)}
                        aria-label={`Toggle schedule for ${job.url}`}
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            aria-label="Schedule actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem onClick={() => onRunNow(job)}>
                            <Play className="w-3.5 h-3.5" /> Run now
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget(job)}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <NewScheduleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        onCreate={onCreate}
        adding={adding}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop all future audits for{" "}
              <span className="font-medium text-foreground break-all">
                {deleteTarget?.url}
              </span>
              . Past results will remain in your audit history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirmDelete();
              }}
              className={cn(EMERALD_BTN)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete schedule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------- New schedule dialog ----------
interface NewScheduleDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  form: ScheduledCreateBody;
  setForm: React.Dispatch<React.SetStateAction<ScheduledCreateBody>>;
  onCreate: () => void;
  adding: boolean;
}

function NewScheduleDialog({
  open, onOpenChange, form, setForm, onCreate, adding,
}: NewScheduleDialogProps) {
  const update = <K extends keyof ScheduledCreateBody>(k: K, v: ScheduledCreateBody[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Build a live preview label for the chosen day/time
  const previewDay = DAYS[form.dayOfWeek] ?? "Mon";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New scheduled audit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* URL */}
          <div className="space-y-1.5">
            <Label htmlFor="sch-url" className="text-xs">Website URL</Label>
            <Input
              id="sch-url"
              placeholder="https://example.com"
              value={form.url}
              onChange={(e) => update("url", e.target.value)}
              autoFocus
            />
          </div>

          {/* Frequency + Day */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Frequency</Label>
              <Select
                value={form.frequency}
                onValueChange={(v) => update("frequency", v as Frequency)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly (every 2 weeks)</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Day</Label>
              <Select
                value={String(form.dayOfWeek)}
                onValueChange={(v) => update("dayOfWeek", Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d, i) => (
                    <SelectItem key={d} value={String(i)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time + Notify */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sch-time" className="text-xs">Time</Label>
              <Input
                id="sch-time"
                type="time"
                value={form.timeOfDay}
                onChange={(e) => update("timeOfDay", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sch-email" className="text-xs">Notify email</Label>
              <Input
                id="sch-email"
                type="email"
                placeholder="you@example.com"
                value={form.notifyEmail}
                onChange={(e) => update("notifyEmail", e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Live preview */}
          <div className="flex items-center gap-2 rounded-md border bg-emerald-50/40 dark:bg-emerald-950/20 px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Will run <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {previewDay} at {form.timeOfDay}
              </span>{" "}
              ({FREQ_META[form.frequency].label.toLowerCase()})
            </p>
          </div>

          <p className="text-[11px] text-muted-foreground">
            We&apos;ll email results to{" "}
            <span className="font-medium text-foreground">{form.notifyEmail || "you"}</span>{" "}
            after every run.
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm" disabled={adding}>Cancel</Button>
          </DialogClose>
          <Button size="sm" className={EMERALD_BTN} onClick={onCreate} disabled={adding}>
            {adding ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1" /> Create schedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
