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
import { Separator } from "@/components/ui/separator";
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
import { toast } from "sonner";
import {
  Megaphone, RefreshCw, Plus, Pencil, Trash2, Square, Loader2,
  Eye, Mail, Bell, Info, CheckCircle2, AlertTriangle, Wrench,
} from "lucide-react";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState, EMERALD_BTN,
  formatDateLong, formatCompact,
} from "../admin-helpers";

// ----- API types -----
type AnnouncementType = "info" | "success" | "warning" | "maintenance";
type AnnouncementStatus = "active" | "scheduled" | "ended";
type Audience = "all" | "free" | "starter" | "pro" | "agency" | "trial";

interface Channels {
  dashboard: boolean;
  email: boolean;
  popup: boolean;
}

interface Announcement {
  id: string;
  title: string;
  description: string;
  type: AnnouncementType;
  audience: Audience;
  channels: Channels;
  status: AnnouncementStatus;
  startDate: string;
  endDate: string;
  ctaLabel: string;
  ctaHref: string;
  createdAt: string;
  views: number;
  clicks: number;
}

interface AnnouncementStats {
  total: number;
  active: number;
  scheduled: number;
  ended: number;
  totalViews: number;
  totalClicks: number;
}

interface AnnouncementResponse {
  announcements: Announcement[];
  stats: AnnouncementStats;
}

const TYPE_BADGE: Record<AnnouncementType, string> = {
  info: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  maintenance: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
};

const STATUS_BADGE: Record<AnnouncementStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  scheduled: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  ended: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
};

const TYPE_ICON: Record<AnnouncementType, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  maintenance: Wrench,
};

const TYPE_COLOR_HEX: Record<AnnouncementType, string> = {
  info: "#0ea5e9",
  success: "#10b981",
  warning: "#f59e0b",
  maintenance: "#f97316",
};

const AUDIENCE_BADGE: Record<Audience, string> = {
  all: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
  free: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
  starter: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  pro: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  agency: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  trial: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
};

function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

export function AdminAnnouncementsSection({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = React.useState<AnnouncementResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Announcement | null>(null);
  const [toDelete, setToDelete] = React.useState<Announcement | null>(null);
  const [endNow, setEndNow] = React.useState<Announcement | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [ending, setEnding] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/announcements").then((r) => r.json() as Promise<AnnouncementResponse>);
      setData(r);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const stats = data?.stats;
  const announcements = data?.announcements ?? [];

  function addAnnouncement(a: Announcement) {
    setData((prev) => (prev ? { ...prev, announcements: [a, ...prev.announcements] } : prev));
  }

  function patchAnnouncement(id: string, patch: Partial<Announcement>) {
    setData((prev) =>
      prev
        ? { ...prev, announcements: prev.announcements.map((a) => (a.id === id ? { ...a, ...patch } : a)) }
        : prev,
    );
  }

  async function deleteAnn() {
    if (!toDelete) return;
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 400));
    setData((prev) =>
      prev ? { ...prev, announcements: prev.announcements.filter((a) => a.id !== toDelete.id) } : prev,
    );
    toast.success(`Deleted "${toDelete.title}"`);
    setToDelete(null);
    setDeleting(false);
  }

  async function endNowConfirm() {
    if (!endNow) return;
    setEnding(true);
    await new Promise((r) => setTimeout(r, 300));
    patchAnnouncement(endNow.id, {
      status: "ended",
      endDate: new Date().toISOString(),
    });
    toast.success(`Ended "${endNow.title}"`);
    setEndNow(null);
    setEnding(false);
  }

  // The first active announcement for the preview card
  const previewTarget = announcements.find((a) => a.status === "active") ?? announcements[0] ?? null;

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Announcements"
        subtitle="Platform-wide banners & notifications"
        icon={Megaphone}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => load()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <Button size="sm" className={EMERALD_BTN} onClick={() => { setEditTarget(null); setCreateOpen(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Create announcement
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats?.total ?? 0} icon={Megaphone} color="#10b981" />
        <StatCard label="Active" value={stats?.active ?? 0} icon={Bell} color="#14b8a6" />
        <StatCard label="Scheduled" value={stats?.scheduled ?? 0} icon={RefreshCw} color="#f59e0b" />
        <StatCard label="Total Views" value={formatCompact(stats?.totalViews ?? 0)} icon={Eye} color="#8b5cf6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Announcements list */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Megaphone className="w-4 h-4 text-emerald-600" /> Announcements
              <Badge variant="secondary" className="ml-1">{announcements.length}</Badge>
            </h3>
            <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[60vh] space-y-3`}>
              {loading ? (
                <SkeletonRows rows={3} cols={2} />
              ) : announcements.length === 0 ? (
                <EmptyState msg="No announcements yet" icon={Megaphone} />
              ) : (
                announcements.map((a) => {
                  const TIcon = TYPE_ICON[a.type];
                  const tColor = TYPE_COLOR_HEX[a.type];
                  const ctr = a.views > 0 ? Math.round((a.clicks / a.views) * 1000) / 10 : 0;
                  return (
                    <div
                      key={a.id}
                      className="rounded-lg border bg-card p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${tColor}15`, color: tColor }}
                          >
                            <TIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm truncate" title={a.title}>
                              {a.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {a.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className={`capitalize text-[10px] ${TYPE_BADGE[a.type]}`}>
                            {a.type}
                          </Badge>
                          <Badge variant="outline" className={`capitalize text-[10px] ${STATUS_BADGE[a.status]}`}>
                            {a.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground mb-2">
                        <Badge variant="outline" className={`capitalize text-[10px] ${AUDIENCE_BADGE[a.audience]}`}>
                          {a.audience}
                        </Badge>
                        <span className="mx-0.5">·</span>
                        {a.channels.dashboard && (
                          <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-700">
                            <Eye className="w-2.5 h-2.5 mr-0.5" /> Dashboard
                          </Badge>
                        )}
                        {a.channels.email && (
                          <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-700">
                            <Mail className="w-2.5 h-2.5 mr-0.5" /> Email
                          </Badge>
                        )}
                        {a.channels.popup && (
                          <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-700">
                            <Bell className="w-2.5 h-2.5 mr-0.5" /> Popup
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span>
                          {formatDateLong(a.startDate)} → {formatDateLong(a.endDate)}
                        </span>
                        {a.ctaLabel && a.ctaHref && (
                          <span className="text-emerald-700 dark:text-emerald-400">
                            CTA: <span className="font-medium">{a.ctaLabel}</span> → <span className="font-mono">{a.ctaHref}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-muted-foreground">
                            <span className="font-semibold text-foreground tabular-nums">{formatCompact(a.views)}</span> views
                          </span>
                          <span className="text-muted-foreground">
                            <span className="font-semibold text-foreground tabular-nums">{formatCompact(a.clicks)}</span> clicks
                          </span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium tabular-nums">
                            {ctr}% CTR
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7"
                            onClick={() => { setEditTarget(a); setCreateOpen(true); }}
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          {a.status === "active" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-amber-600 hover:text-amber-700"
                              onClick={() => setEndNow(a)}
                              title="End now"
                            >
                              <Square className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-red-600 hover:text-red-700"
                            onClick={() => setToDelete(a)}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Preview sidebar */}
        <div className="lg:sticky lg:top-2 lg:self-start">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-emerald-600" /> Live Preview
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              How the active announcement appears in the user dashboard.
            </p>
            {previewTarget ? (
              <BannerPreview announcement={previewTarget} />
            ) : (
              <EmptyState msg="No announcement to preview" icon={Eye} />
            )}
          </Card>
        </div>
      </div>

      <AnnouncementDialog
        open={createOpen}
        onOpenChange={(o) => { if (!o) { setCreateOpen(false); setEditTarget(null); } }}
        existing={editTarget}
        onCreated={(a) => {
          if (editTarget) {
            patchAnnouncement(editTarget.id, a);
            toast.success("Announcement updated (demo)");
          } else {
            addAnnouncement(a);
            toast.success("Announcement scheduled (demo)");
          }
          setCreateOpen(false);
          setEditTarget(null);
        }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => { if (!o) setToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">{toDelete?.title}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void deleteAnn();
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

      <AlertDialog open={!!endNow} onOpenChange={(o) => { if (!o) setEndNow(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End announcement now?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{endNow?.title}</span> will be immediately marked as ended.
              Users will no longer see the banner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ending}>Keep active</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void endNowConfirm();
              }}
              disabled={ending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {ending && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              End now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BannerPreview({ announcement }: { announcement: Announcement }) {
  const TIcon = TYPE_ICON[announcement.type];
  const tColor = TYPE_COLOR_HEX[announcement.type];
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        backgroundColor: `${tColor}10`,
        borderColor: `${tColor}40`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${tColor}25`, color: tColor }}
        >
          <TIcon className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm" style={{ color: tColor }}>
            {announcement.title}
          </div>
          <p className="text-xs text-foreground/80 mt-1 line-clamp-3">
            {announcement.description}
          </p>
          {announcement.ctaLabel && (
            <button
              className="mt-2 text-xs font-medium px-2.5 py-1 rounded-md text-white"
              style={{ backgroundColor: tColor }}
              onClick={() => toast.info(`CTA click → ${announcement.ctaHref}`)}
            >
              {announcement.ctaLabel}
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: `${tColor}25` }}>
        <Badge variant="outline" className={`capitalize text-[10px] ${TYPE_BADGE[announcement.type]}`}>
          {announcement.type}
        </Badge>
        <Badge variant="outline" className={`capitalize text-[10px] ${AUDIENCE_BADGE[announcement.audience]}`}>
          {announcement.audience}
        </Badge>
        <span className="text-[10px] text-muted-foreground ml-auto">
          Until {formatDateLong(announcement.endDate)}
        </span>
      </div>
    </div>
  );
}

function AnnouncementDialog({
  open,
  onOpenChange,
  onCreated,
  existing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (a: Announcement) => void;
  existing: Announcement | null;
}) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState<AnnouncementType>("info");
  const [audience, setAudience] = React.useState<Audience>("all");
  const [chDashboard, setChDashboard] = React.useState(true);
  const [chEmail, setChEmail] = React.useState(false);
  const [chPopup, setChPopup] = React.useState(false);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [ctaLabel, setCtaLabel] = React.useState("");
  const [ctaHref, setCtaHref] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description);
      setType(existing.type);
      setAudience(existing.audience);
      setChDashboard(existing.channels.dashboard);
      setChEmail(existing.channels.email);
      setChPopup(existing.channels.popup);
      setStartDate(toLocalInput(existing.startDate));
      setEndDate(toLocalInput(existing.endDate));
      setCtaLabel(existing.ctaLabel);
      setCtaHref(existing.ctaHref);
    } else {
      setTitle("");
      setDescription("");
      setType("info");
      setAudience("all");
      setChDashboard(true);
      setChEmail(false);
      setChPopup(false);
      const now = new Date();
      const later = new Date(now.getTime() + 7 * 86400000);
      setStartDate(toLocalInput(now.toISOString()));
      setEndDate(toLocalInput(later.toISOString()));
      setCtaLabel("Learn more");
      setCtaHref("#");
    }
  }, [open, existing]);

  async function submit() {
    if (!title.trim()) {
      toast.error("Title required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        type,
        audience,
        channels: { dashboard: chDashboard, email: chEmail, popup: chPopup },
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
        ctaLabel: ctaLabel.trim(),
        ctaHref: ctaHref.trim() || "#",
      };
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let created: Announcement | null = null;
      if (res.ok) {
        const json = (await res.json()) as { announcement: Announcement };
        created = json.announcement;
      } else {
        created = {
          id: existing?.id ?? `ann_${Date.now()}`,
          ...body,
          status: "scheduled",
          createdAt: new Date().toISOString(),
          views: existing?.views ?? 0,
          clicks: existing?.clicks ?? 0,
        };
      }
      onCreated(created);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save announcement");
    } finally {
      setSaving(false);
    }
  }

  const TIcon = TYPE_ICON[type];
  const tColor = TYPE_COLOR_HEX[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? `Edit announcement` : "Create announcement"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="an-title">Title</Label>
            <Input
              id="an-title"
              placeholder="AEO scoring is now live!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="an-desc">Description</Label>
            <Textarea
              id="an-desc"
              placeholder="Short message users will see in the banner."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as AnnouncementType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div>
            <Label className="text-sm mb-2 block">Channels</Label>
            <div className="grid grid-cols-3 gap-2">
              <ChannelSwitch
                label="Dashboard"
                icon={Eye}
                checked={chDashboard}
                onCheckedChange={setChDashboard}
              />
              <ChannelSwitch
                label="Email"
                icon={Mail}
                checked={chEmail}
                onCheckedChange={setChEmail}
              />
              <ChannelSwitch
                label="Popup"
                icon={Bell}
                checked={chPopup}
                onCheckedChange={setChPopup}
              />
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="an-start">Start date</Label>
              <Input
                id="an-start"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="an-end">End date</Label>
              <Input
                id="an-end"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="an-cta-label">CTA label</Label>
              <Input
                id="an-cta-label"
                placeholder="Learn more"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="an-cta-href">CTA href</Label>
              <Input
                id="an-cta-href"
                placeholder="/dashboard"
                value={ctaHref}
                onChange={(e) => setCtaHref(e.target.value)}
              />
            </div>
          </div>
          <Separator />
          <div className="rounded-lg border p-3 bg-muted/30">
            <div className="text-[10px] text-muted-foreground mb-2">Live preview</div>
            <div
              className="rounded-md border p-3"
              style={{ backgroundColor: `${tColor}10`, borderColor: `${tColor}40` }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${tColor}25`, color: tColor }}
                >
                  <TIcon className="w-3.5 h-3.5" />
                </div>
                <div className="font-semibold text-sm" style={{ color: tColor }}>
                  {title || "Untitled announcement"}
                </div>
              </div>
              <p className="text-xs text-foreground/80 mt-2 line-clamp-2">
                {description || "Description preview appears here."}
              </p>
              {ctaLabel && (
                <button
                  className="mt-2 text-xs font-medium px-2 py-1 rounded-md text-white"
                  style={{ backgroundColor: tColor }}
                  type="button"
                >
                  {ctaLabel}
                </button>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={saving}>Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={saving} className={EMERALD_BTN}>
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            {existing ? "Save changes" : "Schedule announcement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChannelSwitch({
  label,
  icon: Icon,
  checked,
  onCheckedChange,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border">
      <Switch checked={checked} onCheckedChange={onCheckedChange} id={`ch-${label}`} />
      <Label htmlFor={`ch-${label}`} className="text-xs flex items-center gap-1 cursor-pointer">
        <Icon className="w-3 h-3" /> {label}
      </Label>
    </div>
  );
}
