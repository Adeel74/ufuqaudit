"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import {
  Server, RefreshCw, Pause, Play, Square, Eye, RotateCcw,
  CheckCircle2, XCircle, Clock, AlertTriangle, Cpu, MemoryStick,
  HardDrive, Network, Database, Activity, ListChecks, Loader2,
} from "lucide-react";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState, EMERALD_BTN,
  relativeTime, formatDuration, formatCompact, truncate, scoreHex,
} from "../admin-helpers";

// ----- API types -----
interface CrawlStats {
  running: number;
  queued: number;
  completed: number;
  failed: number;
  totalCpu: number;
  totalMemory: number;
}

interface RunningCrawl {
  id: string;
  url: string;
  userId: string;
  pagesCrawled: number;
  totalPages: number;
  progress: number;
  startedAt: string;
  cpu: number;
  memory: number;
}

interface QueuedCrawl {
  id: string;
  url: string;
  userId: string;
  position: number;
  enqueuedAt: string;
}

interface CompletedCrawl {
  id: string;
  url: string;
  userId: string;
  pagesCrawled: number;
  score: number;
  duration: number;
  completedAt: string;
}

interface FailedCrawl {
  id: string;
  url: string;
  userId: string;
  error: string;
  failedAt: string;
}

interface CrawlerMetrics {
  cpu: number;
  memory: number;
  memoryLimit: number;
  disk: number;
  diskLimit: number;
  network: number;
  queueSize: number;
  workers: number;
  maxWorkers: number;
  dbConnections: number;
  maxDbConnections: number;
}

interface CrawlerResponse {
  stats: CrawlStats;
  running: RunningCrawl[];
  queued: QueuedCrawl[];
  completed: CompletedCrawl[];
  failed: FailedCrawl[];
  metrics: CrawlerMetrics;
}

export function AdminCrawlerSection({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = React.useState<CrawlerResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [cancelCrawl, setCancelCrawl] = React.useState<RunningCrawl | null>(null);
  const [cancelling, setCancelling] = React.useState(false);
  // Controls (local-only demo)
  const [maxConcurrent, setMaxConcurrent] = React.useState(10);
  const [crawlTimeout, setCrawlTimeout] = React.useState(10000);
  const [paused, setPaused] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/crawler").then(
        (r) => r.json() as Promise<CrawlerResponse>,
      );
      setData(r);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load crawler data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const stats = data?.stats;
  const metrics = data?.metrics;
  const running = data?.running ?? [];
  const queued = data?.queued ?? [];
  const completed = data?.completed ?? [];
  const failed = data?.failed ?? [];

  async function cancelCrawlJob() {
    if (!cancelCrawl) return;
    setCancelling(true);
    await new Promise((r) => setTimeout(r, 500));
    setData((prev) =>
      prev
        ? { ...prev, running: prev.running.filter((c) => c.id !== cancelCrawl.id) }
        : prev,
    );
    toast.success(`Cancelled crawl ${truncate(cancelCrawl.id, 12)}`);
    setCancelCrawl(null);
    setCancelling(false);
  }

  function cancelQueued(item: QueuedCrawl) {
    setData((prev) =>
      prev
        ? { ...prev, queued: prev.queued.filter((c) => c.id !== item.id) }
        : prev,
    );
    toast.success(`Removed queued crawl ${truncate(item.id, 12)}`);
  }

  function retryFailed(item: FailedCrawl) {
    toast.success(`Re-enqueued failed crawl ${truncate(item.id, 12)}`);
    setData((prev) =>
      prev
        ? {
            ...prev,
            failed: prev.failed.filter((c) => c.id !== item.id),
            queued: [
              ...prev.queued,
              {
                id: item.id,
                url: item.url,
                userId: item.userId,
                position: prev.queued.length + 1,
                enqueuedAt: new Date().toISOString(),
              },
            ],
          }
        : prev,
    );
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Crawler Management"
        subtitle="Monitor & control crawl jobs"
        icon={Server}
        actions={
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        }
      />

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Running" value={stats?.running ?? 0} icon={Activity} color="#10b981" />
        <StatCard label="Queued" value={stats?.queued ?? 0} icon={Clock} color="#f59e0b" />
        <StatCard label="Completed" value={stats?.completed ?? 0} icon={CheckCircle2} color="#14b8a6" />
        <StatCard label="Failed" value={stats?.failed ?? 0} icon={XCircle} color="#ef4444" />
      </div>

      {/* Server metrics */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-emerald-600" /> Server Metrics
        </h3>
        {loading || !metrics ? (
          <SkeletonRows rows={3} cols={3} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricBar
              icon={Cpu}
              label="CPU Usage"
              value={metrics.cpu}
              max={100}
              suffix="%"
              current={`${metrics.cpu}%`}
            />
            <MetricBar
              icon={MemoryStick}
              label="Memory"
              value={metrics.memory}
              max={metrics.memoryLimit}
              suffix="MB"
              current={`${metrics.memory} / ${formatCompact(metrics.memoryLimit)} MB`}
            />
            <MetricBar
              icon={HardDrive}
              label="Disk"
              value={metrics.disk}
              max={metrics.diskLimit}
              suffix="GB"
              current={`${metrics.disk.toFixed(1)} / ${metrics.diskLimit} GB`}
            />
            <MetricBar
              icon={ListChecks}
              label="Queue Size"
              value={metrics.queueSize}
              max={Math.max(20, metrics.queueSize + 5)}
              suffix=" jobs"
              current={`${metrics.queueSize} queued`}
            />
            <MetricBar
              icon={Activity}
              label="Workers"
              value={metrics.workers}
              max={metrics.maxWorkers}
              suffix=""
              current={`${metrics.workers} / ${metrics.maxWorkers} active`}
            />
            <MetricBar
              icon={Database}
              label="DB Connections"
              value={metrics.dbConnections}
              max={metrics.maxDbConnections}
              suffix=""
              current={`${metrics.dbConnections} / ${metrics.maxDbConnections} conns`}
            />
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium">Network throughput</span>
                </div>
                <Badge variant="outline" className="tabular-nums bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                  {metrics.network.toFixed(1)} Mbps
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Controls */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Server className="w-4 h-4 text-emerald-600" /> Crawler Controls
        </h3>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button
            size="sm"
            className={EMERALD_BTN}
            disabled={paused}
            onClick={() => { setPaused(false); toast.success("Crawlers resumed"); }}
          >
            <Play className="w-3.5 h-3.5 mr-1" /> Start / Resume all
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setPaused(true); toast.info("All crawlers paused"); }}
          >
            <Pause className="w-3.5 h-3.5 mr-1" /> Pause all
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.info("Stop signal sent (demo)")}
          >
            <Square className="w-3.5 h-3.5 mr-1" /> Stop all
          </Button>
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Max concurrent crawlers</Label>
              <Badge variant="outline" className="tabular-nums">{maxConcurrent}</Badge>
            </div>
            <Slider
              value={[maxConcurrent]}
              min={1}
              max={20}
              step={1}
              onValueChange={(arr) => setMaxConcurrent(arr[0] ?? maxConcurrent)}
            />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>1</span>
              <span>20</span>
            </div>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Crawl timeout</Label>
              <Badge variant="outline" className="tabular-nums">{crawlTimeout.toLocaleString()} ms</Badge>
            </div>
            <Slider
              value={[crawlTimeout]}
              min={1000}
              max={60000}
              step={500}
              onValueChange={(arr) => setCrawlTimeout(arr[0] ?? crawlTimeout)}
            />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>1,000 ms</span>
              <span>60,000 ms</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Running crawlers table */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-emerald-600" /> Running Crawlers
          <Badge variant="secondary" className="ml-1">{running.length}</Badge>
          {paused && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
              Paused
            </Badge>
          )}
        </h3>
        <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[50vh]`}>
          {loading ? (
            <SkeletonRows rows={3} cols={7} />
          ) : running.length === 0 ? (
            <EmptyState msg="No crawlers currently running" icon={Activity} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crawl ID</TableHead>
                  <TableHead className="min-w-[200px]">URL</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="min-w-[140px]">Progress</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Pages</TableHead>
                  <TableHead className="text-right">CPU</TableHead>
                  <TableHead className="text-right">Memory</TableHead>
                  <TableHead className="whitespace-nowrap">Started</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {running.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {truncate(c.id, 12)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm truncate max-w-[220px]" title={c.url}>
                        {c.url}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm truncate max-w-[140px]">{c.userId}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 h-2 min-w-[80px] rounded-full bg-muted overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-emerald-500 transition-all"
                            style={{ width: `${c.progress}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-xs w-9 text-right">{c.progress}%</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {c.pagesCrawled} / {formatCompact(c.totalPages)} pages
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      {formatCompact(c.pagesCrawled)} / {formatCompact(c.totalPages)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      <span className={c.cpu > 80 ? "text-red-600 dark:text-red-400" : ""}>
                        {c.cpu}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{formatCompact(c.memory)} MB</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {relativeTime(c.startedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7"
                          onClick={() => toast.info(`Viewing ${truncate(c.id, 12)} (demo)`)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7"
                          onClick={() => toast.info(`Paused ${truncate(c.id, 12)} (demo)`)}
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-red-600 hover:text-red-700"
                          onClick={() => setCancelCrawl(c)}
                        >
                          <Square className="w-3.5 h-3.5" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queued crawlers */}
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-emerald-600" /> Queued Crawlers
            <Badge variant="secondary" className="ml-1">{queued.length}</Badge>
          </h3>
          {loading ? (
            <SkeletonRows rows={2} cols={3} />
          ) : queued.length === 0 ? (
            <EmptyState msg="Queue is empty" icon={Clock} />
          ) : (
            <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[40vh] space-y-2`}>
              {queued.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 shrink-0 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 flex items-center justify-center text-xs font-bold">
                      {q.position}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate max-w-[200px]" title={q.url}>
                        {q.url}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {q.userId} · {relativeTime(q.enqueuedAt)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-red-600 hover:text-red-700"
                    onClick={() => cancelQueued(q)}
                  >
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Failed crawlers */}
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" /> Failed Crawlers
            <Badge variant="secondary" className="ml-1">{failed.length}</Badge>
          </h3>
          {loading ? (
            <SkeletonRows rows={2} cols={3} />
          ) : failed.length === 0 ? (
            <EmptyState msg="No failed crawlers" icon={CheckCircle2} />
          ) : (
            <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[40vh] space-y-2`}>
              {failed.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-lg border bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate max-w-[200px]" title={f.url}>
                        {f.url}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {f.userId} · {relativeTime(f.failedAt)}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-mono">
                        {f.error}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0"
                      onClick={() => retryFailed(f)}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retry
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Completed crawlers */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Completed Crawlers
          <Badge variant="secondary" className="ml-1">{completed.length}</Badge>
        </h3>
        <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[50vh]`}>
          {loading ? (
            <SkeletonRows rows={3} cols={6} />
          ) : completed.length === 0 ? (
            <EmptyState msg="No completed crawls yet" icon={CheckCircle2} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">URL</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Pages</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="whitespace-nowrap">Completed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {completed.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium text-sm truncate max-w-[220px]" title={c.url}>
                        {c.url}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm truncate max-w-[140px]">{c.userId}</div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      {formatCompact(c.pagesCrawled)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-md font-bold tabular-nums text-xs"
                        style={{ backgroundColor: `${scoreHex(c.score)}15`, color: scoreHex(c.score) }}
                      >
                        {c.score}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs text-muted-foreground">
                      {formatDuration(c.duration)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {relativeTime(c.completedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7"
                          onClick={() => toast.info(`Viewing ${truncate(c.id, 12)} (demo)`)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7"
                          onClick={() => toast.info(`Re-running ${truncate(c.id, 12)} (demo)`)}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
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

      <AlertDialog open={!!cancelCrawl} onOpenChange={(o) => { if (!o) setCancelCrawl(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel crawl?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately terminate the in-progress crawl for{" "}
              <span className="font-medium text-foreground">{cancelCrawl?.url}</span>.
              Pages crawled so far ({formatCompact(cancelCrawl?.pagesCrawled ?? 0)}) will be retained,
              but the audit will be marked as cancelled. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep running</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void cancelCrawlJob();
              }}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelling && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              Cancel crawl
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MetricBar({
  icon: Icon,
  label,
  value,
  max,
  suffix,
  current,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  max: number;
  suffix: string;
  current: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const barColor =
    pct >= 90
      ? "bg-red-500"
      : pct >= 70
        ? "bg-amber-500"
        : "bg-emerald-500";
  const textColor =
    pct >= 90
      ? "text-red-600 dark:text-red-400"
      : pct >= 70
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400";
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={`text-xs tabular-nums font-mono ${textColor}`}>
          {current}
        </span>
      </div>
      <div className="relative w-full h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {suffix && (
        <div className="text-[10px] text-muted-foreground mt-1">
          {pct.toFixed(0)}% of {max.toLocaleString()} {suffix}
        </div>
      )}
    </div>
  );
}
