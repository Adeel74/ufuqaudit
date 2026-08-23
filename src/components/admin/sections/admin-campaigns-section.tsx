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
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { toast } from "sonner";
import {
  Mail, RefreshCw, Plus, Eye, Trash2, Copy, Loader2,
  Send, Clock, FileText, MailOpen, MousePointerClick,
} from "lucide-react";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState, EMERALD_BTN,
  formatCompact, formatDateLong, relativeTime,
} from "../admin-helpers";

// ----- API types -----
type CampaignType = "newsletter" | "promotional" | "onboarding" | "announcement";
type CampaignStatus = "sent" | "scheduled" | "draft" | "sending";

interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  subject: string;
  audience: string;
  status: CampaignStatus;
  recipients: number;
  opens: number;
  clicks: number;
  bounceRate: number;
  unsubscribes: number;
  sentAt: string | null;
  createdAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  lastUsed: string;
}

interface CampaignStats {
  total: number;
  sent: number;
  scheduled: number;
  drafts: number;
  totalRecipients: number;
  avgOpenRate: number;
  avgCtr: number;
}

interface CampaignResponse {
  campaigns: Campaign[];
  templates: EmailTemplate[];
  stats: CampaignStats;
}

const TYPE_BADGE: Record<CampaignType, string> = {
  newsletter: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  promotional: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  onboarding: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  announcement: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
};

const STATUS_BADGE: Record<CampaignStatus, string> = {
  sent: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  scheduled: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  draft: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
  sending: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
};

const TEMPLATE_CAT_BADGE: Record<string, string> = {
  onboarding: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  auth: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
  billing: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  audit: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  system: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
  marketing: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
};

function templateCatCls(cat: string): string {
  return TEMPLATE_CAT_BADGE[cat?.toLowerCase()] ?? "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700";
}

export function AdminCampaignsSection({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = React.useState<CampaignResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<Campaign | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/campaigns").then((r) => r.json() as Promise<CampaignResponse>);
      setData(r);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const stats = data?.stats;
  const campaigns = data?.campaigns ?? [];
  const templates = data?.templates ?? [];

  // Top 6 sent campaigns by recipients for BarChart (open rate %)
  const chartData = React.useMemo(() => {
    return campaigns
      .filter((c) => c.status === "sent" || c.status === "sending")
      .slice(0, 6)
      .map((c) => ({
        name: c.name.length > 18 ? c.name.slice(0, 18) + "…" : c.name,
        openRate: c.recipients > 0 ? Math.round((c.opens / c.recipients) * 1000) / 10 : 0,
        ctr: c.recipients > 0 ? Math.round((c.clicks / c.recipients) * 1000) / 10 : 0,
      }));
  }, [campaigns]);

  function addCampaign(c: Campaign) {
    setData((prev) => (prev ? { ...prev, campaigns: [c, ...prev.campaigns] } : prev));
  }

  async function deleteCampaign() {
    if (!toDelete) return;
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 400));
    setData((prev) =>
      prev ? { ...prev, campaigns: prev.campaigns.filter((c) => c.id !== toDelete.id) } : prev,
    );
    toast.success(`Deleted "${toDelete.name}"`);
    setToDelete(null);
    setDeleting(false);
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Email Campaigns"
        subtitle="Marketing campaigns & email templates"
        icon={Mail}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => load()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <Button size="sm" className={EMERALD_BTN} onClick={() => setCreateOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Create campaign
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Campaigns" value={stats?.total ?? 0} icon={Mail} color="#10b981" />
        <StatCard label="Sent" value={stats?.sent ?? 0} icon={Send} color="#14b8a6" />
        <StatCard label="Scheduled/Drafts" value={(stats?.scheduled ?? 0) + (stats?.drafts ?? 0)} icon={Clock} color="#f59e0b" />
        <StatCard label="Avg Open Rate" value={`${stats?.avgOpenRate ?? 0}%`} icon={MailOpen} color="#8b5cf6" />
        <StatCard label="Avg CTR" value={`${stats?.avgCtr ?? 0}%`} icon={MousePointerClick} color="#ec4899" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: campaigns table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-emerald-600" /> Campaigns
              <Badge variant="secondary" className="ml-1">{campaigns.length}</Badge>
            </h3>
            <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[60vh]`}>
              {loading ? (
                <SkeletonRows rows={5} cols={8} />
              ) : campaigns.length === 0 ? (
                <EmptyState msg="No campaigns yet" icon={Mail} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[220px]">Campaign</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Recipients</TableHead>
                      <TableHead className="text-right">Opens</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Bounces</TableHead>
                      <TableHead className="text-right">Unsubs</TableHead>
                      <TableHead className="whitespace-nowrap">Sent</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="zebra">
                    {campaigns.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-medium text-sm truncate max-w-[220px]" title={c.name}>
                            {c.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[220px]" title={c.subject}>
                            {c.subject}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`capitalize text-xs ${TYPE_BADGE[c.type]}`}>
                            {c.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{c.audience}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`capitalize text-xs ${STATUS_BADGE[c.status]}`}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          {formatCompact(c.recipients)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          <div>{formatCompact(c.opens)}</div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            {c.recipients > 0 ? ((c.opens / c.recipients) * 100).toFixed(1) : 0}%
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          <div>{formatCompact(c.clicks)}</div>
                          <div className="text-[10px] text-violet-600 dark:text-violet-400">
                            {c.recipients > 0 ? ((c.clicks / c.recipients) * 100).toFixed(1) : 0}%
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs text-amber-600 dark:text-amber-400">
                          {c.bounceRate}%
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs text-red-600 dark:text-red-400">
                          {c.unsubscribes}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {c.sentAt ? formatDateLong(c.sentAt) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={() => toast.info(`Viewing "${c.name}" (demo)`)}
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={() => toast.success(`Duplicated "${c.name}" (demo)`)}
                              title="Duplicate"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-red-600 hover:text-red-700"
                              onClick={() => setToDelete(c)}
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

          {/* Open rate mini-chart */}
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <MailOpen className="w-4 h-4 text-emerald-600" /> Campaign Performance
              <span className="text-xs text-muted-foreground font-normal">(top 6 sent — open rate %)</span>
            </h3>
            {loading ? (
              <SkeletonRows rows={3} cols={3} />
            ) : chartData.length === 0 ? (
              <EmptyState msg="No sent campaigns to chart" icon={MailOpen} />
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      cursor={{ fill: "#10b98115" }}
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => `${v}%`}
                    />
                    <Bar dataKey="openRate" name="Open Rate" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill="#10b981" />
                      ))}
                    </Bar>
                    <Bar dataKey="ctr" name="CTR" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill="#8b5cf6" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* Templates sidebar */}
        <div className="lg:sticky lg:top-2 lg:self-start">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" /> Email Templates
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => toast.info("Create template (demo)")}
              >
                <Plus className="w-3 h-3 mr-1" /> New
              </Button>
            </div>
            <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[60vh] space-y-1.5`}>
              {loading ? (
                <SkeletonRows rows={5} cols={2} />
              ) : templates.length === 0 ? (
                <EmptyState msg="No templates" icon={FileText} />
              ) : (
                templates.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{t.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Last used {t.lastUsed}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className={`text-[10px] capitalize ${templateCatCls(t.category)}`}>
                        {t.category}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7"
                        onClick={() => toast.info(`Editing template "${t.name}" (demo)`)}
                      >
                        <PencilIcon />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <CreateCampaignDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        templates={templates}
        onCreated={addCampaign}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => { if (!o) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">{toDelete?.name}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void deleteCampaign();
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

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    </svg>
  );
}

function CreateCampaignDialog({
  open,
  onOpenChange,
  templates,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  templates: EmailTemplate[];
  onCreated: (c: Campaign) => void;
}) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<CampaignType>("newsletter");
  const [subject, setSubject] = React.useState("");
  const [audience, setAudience] = React.useState("All subscribers");
  const [template, setTemplate] = React.useState(templates[0]?.id ?? "");
  const [scheduleDate, setScheduleDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName("");
      setType("newsletter");
      setSubject("");
      setAudience("All subscribers");
      setTemplate(templates[0]?.id ?? "");
      setScheduleDate("");
    }
  }, [open, templates]);

  function submit() {
    if (!name.trim()) {
      toast.error("Campaign name required");
      return;
    }
    if (!subject.trim()) {
      toast.error("Subject required");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const c: Campaign = {
        id: `camp_${Date.now()}`,
        name: name.trim(),
        type,
        subject: subject.trim(),
        audience,
        status: scheduleDate ? "scheduled" : "draft",
        recipients: 0,
        opens: 0,
        clicks: 0,
        bounceRate: 0,
        unsubscribes: 0,
        sentAt: null,
        createdAt: new Date().toISOString(),
      };
      onCreated(c);
      toast.success(scheduleDate ? "Campaign scheduled (demo)" : "Draft saved (demo)");
      setSaving(false);
      onOpenChange(false);
    }, 300);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create campaign</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="cmp-name">Campaign name</Label>
            <Input
              id="cmp-name"
              placeholder="Weekly SEO Tips — Issue #13"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as CampaignType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All subscribers">All subscribers</SelectItem>
                  <SelectItem value="Free + Starter users">Free + Starter users</SelectItem>
                  <SelectItem value="All active users">All active users</SelectItem>
                  <SelectItem value="Inactive (30 days)">Inactive (30 days)</SelectItem>
                  <SelectItem value="New signups (7 days)">New signups (7 days)</SelectItem>
                  <SelectItem value="Trial users">Trial users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cmp-subject">Subject line</Label>
            <Input
              id="cmp-subject"
              placeholder="5 SEO fixes you can make today"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Template</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cmp-schedule">Schedule date (optional)</Label>
              <Input
                id="cmp-schedule"
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={saving}>Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={saving} className={EMERALD_BTN}>
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            {scheduleDate ? "Schedule campaign" : "Save draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
