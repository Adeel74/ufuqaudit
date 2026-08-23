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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
  UserPlus, RefreshCw, Search, Eye, Download, Mail, CheckCircle2,
  XCircle, Loader2, FunnelIcon,
} from "lucide-react";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState, EMERALD_BTN,
  formatDateLong, relativeTime, scoreHex, downloadCsv,
} from "../admin-helpers";

// ----- API types -----
type LeadStatus = "new" | "contacted" | "converted" | "lost";

interface Lead {
  id: string;
  website: string;
  email: string;
  score: number;
  issues: number;
  criticalIssues: number;
  source: string;
  campaign: string;
  status: LeadStatus;
  createdAt: string;
  convertedAt: string | null;
  plan: string | null;
}

interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  converted: number;
  lost: number;
  conversionRate: number;
  avgScore: number;
  avgIssues: number;
}

interface LeadResponse {
  leads: Lead[];
  stats: LeadStats;
}

const STATUS_BADGE: Record<LeadStatus, string> = {
  new: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  contacted: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  converted: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  lost: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
};

const PLAN_BADGE: Record<string, string> = {
  free: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
  starter: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  pro: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  agency: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
};

const CAMPAIGNS = ["All", "Organic", "Google Ads", "Twitter", "LinkedIn", "Referral", "Product Hunt", "Newsletter"];

export function AdminLeadsSection({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = React.useState<LeadResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | LeadStatus>("all");
  const [sourceFilter, setSourceFilter] = React.useState("All");
  const [campaignFilter, setCampaignFilter] = React.useState("All");
  const [profileLead, setProfileLead] = React.useState<Lead | null>(null);
  const [convertLead, setConvertLead] = React.useState<Lead | null>(null);
  const [lostLead, setLostLead] = React.useState<Lead | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/leads").then((r) => r.json() as Promise<LeadResponse>);
      setData(r);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const leads = data?.leads ?? [];
  const stats = data?.stats;

  const filtered = React.useMemo(() => {
    let list = leads;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (l) => l.website.toLowerCase().includes(q) || l.email.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") list = list.filter((l) => l.status === statusFilter);
    if (sourceFilter !== "All") list = list.filter((l) => l.source === sourceFilter);
    if (campaignFilter !== "All") list = list.filter((l) => l.campaign === campaignFilter);
    return list;
  }, [leads, search, statusFilter, sourceFilter, campaignFilter]);

  function patchLead(id: string, patch: Partial<Lead>) {
    setData((prev) =>
      prev
        ? { ...prev, leads: prev.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) }
        : prev,
    );
  }

  function exportCsv() {
    const rows = filtered.map((l) => ({
      id: l.id, website: l.website, email: l.email, score: l.score,
      issues: l.issues, criticalIssues: l.criticalIssues, source: l.source,
      campaign: l.campaign, status: l.status, createdAt: l.createdAt,
      convertedAt: l.convertedAt ?? "", plan: l.plan ?? "",
    }));
    downloadCsv(rows, `leads-${Date.now()}.csv`);
    toast.success(`Exported ${rows.length} leads to CSV`);
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Leads"
        subtitle="Free audit lead generation & conversion"
        icon={UserPlus}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => load()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Leads" value={stats?.total ?? 0} icon={UserPlus} color="#10b981" />
        <StatCard label="New" value={stats?.new ?? 0} icon={UserPlus} color="#0ea5e9" />
        <StatCard label="Contacted" value={stats?.contacted ?? 0} icon={Mail} color="#f59e0b" />
        <StatCard label="Conversion Rate" value={`${stats?.conversionRate ?? 0}%`} icon={CheckCircle2} color="#14b8a6" />
        <StatCard label="Avg Score" value={stats?.avgScore ?? 0} icon={FunnelIcon} color="#8b5cf6" />
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by website or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All sources</SelectItem>
                <SelectItem value="Free Audit">Free Audit</SelectItem>
              </SelectContent>
            </Select>
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Campaign" />
              </SelectTrigger>
              <SelectContent>
                {CAMPAIGNS.map((c) => (
                  <SelectItem key={c} value={c}>{c === "All" ? "All campaigns" : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads table */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4 text-emerald-600" /> Leads
              <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
            </h3>
            <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[60vh]`}>
              {loading ? (
                <SkeletonRows rows={5} cols={10} />
              ) : filtered.length === 0 ? (
                <EmptyState msg="No leads match your filters" icon={UserPlus} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[160px]">Website</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Issues</TableHead>
                      <TableHead className="text-right">Critical</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="whitespace-nowrap">Created</TableHead>
                      <TableHead className="whitespace-nowrap">Converted</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="zebra">
                    {filtered.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>
                          <div className="font-medium text-sm truncate max-w-[160px]" title={l.website}>
                            {l.website}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[180px]">{l.email}</TableCell>
                        <TableCell className="text-right">
                          <span
                            className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-md font-bold tabular-nums text-xs"
                            style={{
                              backgroundColor: `${scoreHex(l.score)}15`,
                              color: scoreHex(l.score),
                            }}
                          >
                            {l.score}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{l.issues}</TableCell>
                        <TableCell className="text-right">
                          {l.criticalIssues > 0 ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 tabular-nums">
                              {l.criticalIssues}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{l.source}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{l.campaign}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`capitalize text-xs ${STATUS_BADGE[l.status]}`}>
                            {l.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {relativeTime(l.createdAt)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {l.convertedAt ? formatDateLong(l.convertedAt) : "—"}
                        </TableCell>
                        <TableCell>
                          {l.plan ? (
                            <Badge variant="outline" className={`capitalize text-xs ${PLAN_BADGE[l.plan] ?? PLAN_BADGE.free}`}>
                              {l.plan}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={() => setProfileLead(l)}
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={() => toast.success(`Email drafted to ${l.email} (demo)`)}
                              title="Contact"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-emerald-600 hover:text-emerald-700"
                              onClick={() => setConvertLead(l)}
                              title="Mark converted"
                              disabled={l.status === "converted"}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-red-600 hover:text-red-700"
                              onClick={() => setLostLead(l)}
                              title="Mark lost"
                              disabled={l.status === "lost"}
                            >
                              <XCircle className="w-3.5 h-3.5" />
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
        </div>

        {/* Funnel */}
        <div className="lg:sticky lg:top-2 lg:self-start">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <FunnelIcon className="w-4 h-4 text-emerald-600" /> Conversion Funnel
            </h3>
            <ConversionFunnel leads={leads} />
          </Card>
        </div>
      </div>

      {/* Profile sheet */}
      <Sheet open={!!profileLead} onOpenChange={(o) => { if (!o) setProfileLead(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {profileLead && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center text-sm font-bold">
                    {profileLead.website.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-base font-semibold truncate">{profileLead.website}</div>
                    <div className="text-xs font-normal text-muted-foreground">{profileLead.email}</div>
                  </div>
                </SheetTitle>
                <SheetDescription>
                  Lead ID <span className="font-mono">{profileLead.id}</span>
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-[10px] text-muted-foreground">Status</div>
                    <Badge variant="outline" className={`mt-1 capitalize text-xs ${STATUS_BADGE[profileLead.status]}`}>
                      {profileLead.status}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-[10px] text-muted-foreground">Score</div>
                    <div className="text-sm font-bold tabular-nums mt-1" style={{ color: scoreHex(profileLead.score) }}>
                      {profileLead.score}/100
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-[10px] text-muted-foreground">Issues</div>
                    <div className="text-sm font-medium mt-1">{profileLead.issues} total · {profileLead.criticalIssues} critical</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-[10px] text-muted-foreground">Plan</div>
                    <div className="text-sm font-medium mt-1 capitalize">{profileLead.plan ?? "—"}</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-[10px] text-muted-foreground">Source</div>
                    <div className="text-sm font-medium mt-1">{profileLead.source}</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-[10px] text-muted-foreground">Campaign</div>
                    <div className="text-sm font-medium mt-1">{profileLead.campaign}</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-[10px] text-muted-foreground">Created</div>
                    <div className="text-sm font-medium mt-1">{formatDateLong(profileLead.createdAt)}</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-[10px] text-muted-foreground">Converted</div>
                    <div className="text-sm font-medium mt-1">
                      {profileLead.convertedAt ? formatDateLong(profileLead.convertedAt) : "—"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => toast.success(`Email drafted to ${profileLead.email} (demo)`)}
                  >
                    <Mail className="w-3.5 h-3.5 mr-1" /> Contact
                  </Button>
                  <Button
                    size="sm"
                    className={`flex-1 ${EMERALD_BTN}`}
                    disabled={profileLead.status === "converted"}
                    onClick={() => {
                      setConvertLead(profileLead);
                      setProfileLead(null);
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark converted
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Convert dialog */}
      <ConvertLeadDialog
        lead={convertLead}
        onClose={() => setConvertLead(null)}
        onConfirm={(plan) => {
          if (!convertLead) return;
          patchLead(convertLead.id, {
            status: "converted",
            plan,
            convertedAt: new Date().toISOString(),
          });
          toast.success(`${convertLead.website} marked converted to ${plan}`);
          setConvertLead(null);
        }}
        busy={busy}
        setBusy={setBusy}
      />

      {/* Lost confirm */}
      <AlertDialog open={!!lostLead} onOpenChange={(o) => { if (!o) setLostLead(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark lead as lost?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{lostLead?.website}</span> will be marked as lost
              and removed from your active pipeline. You can still re-contact them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (!lostLead) return;
                patchLead(lostLead.id, { status: "lost" });
                toast.info(`${lostLead.website} marked lost`);
                setLostLead(null);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Mark as lost
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ConversionFunnel({ leads }: { leads: Lead[] }) {
  const freeAudit = leads.length;
  const contacted = leads.filter((l) => l.status === "contacted" || l.status === "converted").length;
  const converted = leads.filter((l) => l.status === "converted").length;
  const stages = [
    { label: "Free Audit", value: freeAudit, color: "#10b981" },
    { label: "Contacted", value: contacted, color: "#14b8a6" },
    { label: "Converted", value: converted, color: "#0d9488" },
  ];
  const max = Math.max(1, freeAudit);
  return (
    <div className="space-y-3">
      {stages.map((s, i) => {
        const pct = max > 0 ? Math.round((s.value / max) * 100) : 0;
        const convRate = i > 0 && stages[i - 1].value > 0
          ? Math.round((s.value / stages[i - 1].value) * 100)
          : null;
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-1 text-xs">
              <span className="font-medium">{s.label}</span>
              <span className="tabular-nums">
                {s.value.toLocaleString()}
                {convRate !== null && (
                  <span className="text-muted-foreground ml-1">({convRate}%)</span>
                )}
              </span>
            </div>
            <div className="h-7 w-full rounded-md bg-muted overflow-hidden">
              <div
                className="h-full rounded-md transition-all flex items-center justify-end pr-2"
                style={{ width: `${pct}%`, backgroundColor: s.color, color: "white" }}
              >
                {pct > 12 && (
                  <span className="text-[10px] font-medium tabular-nums">{pct}%</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div className="mt-4 p-3 rounded-lg border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50">
        <div className="text-xs text-muted-foreground mb-1">Overall conversion rate</div>
        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
          {freeAudit > 0 ? ((converted / freeAudit) * 100).toFixed(1) : "0.0"}%
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {converted.toLocaleString()} of {freeAudit.toLocaleString()} leads converted
        </div>
      </div>
    </div>
  );
}

function ConvertLeadDialog({
  lead,
  onClose,
  onConfirm,
  busy,
  setBusy,
}: {
  lead: Lead | null;
  onClose: () => void;
  onConfirm: (plan: string) => void;
  busy: boolean;
  setBusy: (b: boolean) => void;
}) {
  const [plan, setPlan] = React.useState("pro");
  React.useEffect(() => {
    if (lead) setPlan(lead.plan ?? "pro");
  }, [lead]);

  return (
    <Dialog open={!!lead} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark lead converted</DialogTitle>
          <DialogDescription>
            Select the plan <span className="font-medium text-foreground">{lead?.website}</span> subscribed to.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Plan</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="agency">Agency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={busy}>Cancel</Button>
          </DialogClose>
          <Button
            className={EMERALD_BTN}
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setTimeout(() => {
                onConfirm(plan);
                setBusy(false);
              }, 300);
            }}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            Mark converted
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
