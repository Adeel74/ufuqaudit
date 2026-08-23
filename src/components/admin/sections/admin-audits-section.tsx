"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  FileSearch, RefreshCw, Search, MoreVertical, Eye, Ban, RotateCcw,
  Trash2, Download, FileText, Loader2, CheckCircle2, XCircle,
  PlayCircle,
} from "lucide-react";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState,
  type AuditRow, type AuditStats,
  relativeTime, formatDuration, truncate, scoreHex,
  statusBadgeClass,
} from "../admin-helpers";

type StatusFilter = "all" | "running" | "completed" | "failed";
type ScoreFilter = "all" | "0-40" | "40-60" | "60-80" | "80-100";

export function AdminAuditsSection({ refreshKey }: { refreshKey: number }) {
  const [audits, setAudits] = React.useState<AuditRow[]>([]);
  const [stats, setStats] = React.useState<AuditStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [scoreFilter, setScoreFilter] = React.useState<ScoreFilter>("all");
  const [auditToDelete, setAuditToDelete] = React.useState<AuditRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/all-audits").then((r) => r.json() as Promise<{ audits: AuditRow[]; stats: AuditStats }>);
      setAudits(r.audits ?? []);
      setStats(r.stats ?? null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load audits");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const filtered = React.useMemo(() => {
    let list = audits;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((a) => a.url.toLowerCase().includes(q) || a.userName.toLowerCase().includes(q) || a.user.toLowerCase().includes(q));
    if (statusFilter !== "all") {
      if (statusFilter === "completed") list = list.filter((a) => a.status === "done");
      else list = list.filter((a) => a.status === statusFilter);
    }
    if (scoreFilter !== "all") {
      const [lo, hi] = scoreFilter.split("-").map(Number);
      list = list.filter((a) => a.overallScore >= lo && a.overallScore <= hi);
    }
    return list;
  }, [audits, search, statusFilter, scoreFilter]);

  async function deleteAudit() {
    if (!auditToDelete) return;
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 600));
    setAudits((prev) => prev.filter((a) => a.id !== auditToDelete.id));
    toast.success(`Deleted audit ${truncate(auditToDelete.id, 12)}`);
    setAuditToDelete(null);
    setDeleting(false);
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="All Audits"
        subtitle="Monitor every audit running across the platform"
        icon={FileSearch}
        actions={
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Audits" value={stats?.total ?? 0} icon={FileSearch} color="#10b981" />
        <StatCard label="Running" value={stats?.running ?? 0} icon={PlayCircle} color="#f59e0b" />
        <StatCard label="Completed" value={stats?.completed ?? 0} icon={CheckCircle2} color="#10b981" />
        <StatCard label="Failed" value={stats?.failed ?? 0} icon={XCircle} color="#ef4444" />
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by URL or user…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={scoreFilter} onValueChange={(v) => setScoreFilter(v as ScoreFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All scores</SelectItem>
                <SelectItem value="0-40">0 – 40 (poor)</SelectItem>
                <SelectItem value="40-60">40 – 60 (fair)</SelectItem>
                <SelectItem value="60-80">60 – 80 (good)</SelectItem>
                <SelectItem value="80-100">80 – 100 (great)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <FileSearch className="w-4 h-4 text-emerald-600" /> Audits
          <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
        </h3>
        <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[60vh]`}>
          {loading ? (
            <SkeletonRows rows={6} cols={10} />
          ) : filtered.length === 0 ? (
            <EmptyState msg="No audits match your filters" icon={FileSearch} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Audit ID</TableHead>
                  <TableHead className="min-w-[200px]">URL</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Pages</TableHead>
                  <TableHead className="text-right">Issues</TableHead>
                  <TableHead className="text-right">Critical</TableHead>
                  <TableHead className="whitespace-nowrap">Duration</TableHead>
                  <TableHead className="whitespace-nowrap">Started</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {truncate(a.id, 12)}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-medium text-sm truncate max-w-[220px] inline-block cursor-help" title={a.url}>
                            {a.url}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md">
                          <span className="font-mono text-xs break-all">{a.url}</span>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm truncate max-w-[140px]">{a.userName}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[140px]">{a.user}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-md font-bold tabular-nums text-xs"
                        style={{ backgroundColor: `${scoreHex(a.overallScore)}15`, color: scoreHex(a.overallScore) }}
                      >
                        {a.overallScore}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${statusBadgeClass(a.status === "done" ? "completed" : a.status)}`}>
                        {a.status === "done" ? "completed" : a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{a.pagesCrawled}</TableCell>
                    <TableCell className="text-right tabular-nums">{a.issuesCount}</TableCell>
                    <TableCell className="text-right">
                      {a.criticalCount > 0 ? (
                        <Badge className="bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
                          {a.criticalCount}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {a.duration ? formatDuration(a.duration) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{relativeTime(a.started)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toast.info(`View audit ${truncate(a.id, 12)} (demo)`)}>
                            <Eye className="w-3.5 h-3.5 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={a.status !== "running"}
                            onClick={() => toast.info(`Cancelling audit ${truncate(a.id, 12)} (demo)`)}
                          >
                            <Ban className="w-3.5 h-3.5 mr-2" /> Cancel
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={a.status === "running"}
                            onClick={() => toast.info(`Retrying audit ${truncate(a.id, 12)} (demo)`)}>
                            <RotateCcw className="w-3.5 h-3.5 mr-2" /> Retry
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info(`Exporting ${truncate(a.id, 12)} (demo)`)}>
                            <Download className="w-3.5 h-3.5 mr-2" /> Export
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info(`Generating report for ${truncate(a.id, 12)} (demo)`)}>
                            <FileText className="w-3.5 h-3.5 mr-2" /> Generate report
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setAuditToDelete(a)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
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

      <AlertDialog open={!!auditToDelete} onOpenChange={(o) => { if (!o) setAuditToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete audit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the audit for{" "}
              <span className="font-medium text-foreground">{auditToDelete?.url}</span> along with
              its issues and AI recommendations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void deleteAudit();
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
    </div>
  );
}
