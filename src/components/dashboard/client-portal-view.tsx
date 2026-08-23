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
  Share2, Plus, Loader2, MoreHorizontal, Copy, ExternalLink,
  Ban, Eye, Link as LinkIcon, Users, Gauge, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------- Types ----------
interface PortalLink {
  id: string;
  token: string;
  clientName: string;
  clientEmail: string;
  auditUrl: string;
  overallScore: number;
  createdAt: string;
  expiresAt: string | null;
  views: number;
  lastViewedAt: string | null;
  branding: {
    agencyName: string;
    primaryColor: string;
    logoUrl: string | null;
  };
}

interface PortalCreateBody {
  clientName: string;
  clientEmail: string;
  auditUrl: string;
  overallScore: number;
  expiresInDays: number; // 0 = never
  agencyName: string;
  primaryColor: string;
}

// ---------- Constants ----------
const EMERALD = "#10b981";
const TEAL_DARK = "#0f766e";
const EMERALD_BTN = "bg-emerald-600 hover:bg-emerald-700 text-white";

const SCROLLBAR_CLS =
  "max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent";

const BRAND_SWATCHES: { name: string; value: string; ring: string }[] = [
  { name: "Emerald", value: "#10b981", ring: "ring-emerald-500" },
  { name: "Teal", value: "#14b8a6", ring: "ring-teal-500" },
  { name: "Amber", value: "#f59e0b", ring: "ring-amber-500" },
  { name: "Rose", value: "#f43f5e", ring: "ring-rose-500" },
  { name: "Violet", value: "#8b5cf6", ring: "ring-violet-500" },
];

const EXPIRY_OPTIONS: { label: string; value: number }[] = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "Never", value: 0 },
];

// ---------- Helpers ----------
function scoreColor(v: number): string {
  return v >= 80 ? "#10b981" : v >= 60 ? "#f59e0b" : v >= 40 ? "#f97316" : "#ef4444";
}

function truncateUrl(u: string, n = 28): string {
  const stripped = u.replace(/^https?:\/\//, "");
  if (stripped.length <= n) return stripped;
  return stripped.slice(0, n - 1) + "…";
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

function isExpired(link: PortalLink): boolean {
  if (!link.expiresAt) return false;
  return new Date(link.expiresAt).getTime() < Date.now();
}

function portalPath(token: string): string {
  return `/portal/${token}`;
}

function buildFullUrl(token: string): string {
  if (typeof window === "undefined") return portalPath(token);
  return `${window.location.origin}${portalPath(token)}`;
}

// =================== Component ===================
export function ClientPortalView() {
  const currentAudit = useAppStore((s) => s.currentAudit);

  const [links, setLinks] = React.useState<PortalLink[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState<PortalCreateBody>({
    clientName: "",
    clientEmail: "",
    auditUrl: "",
    overallScore: 0,
    expiresInDays: 30,
    agencyName: "UfuqAudit",
    primaryColor: "#10b981",
  });

  // Revoke target
  const [revokeTarget, setRevokeTarget] = React.useState<PortalLink | null>(null);
  const [revoking, setRevoking] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/portal", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as { links: PortalLink[] };
      setLinks(Array.isArray(j.links) ? j.links : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load portal links";
      setError(msg);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateDialog = React.useCallback(() => {
    setForm({
      clientName: "",
      clientEmail: "",
      auditUrl: currentAudit?.url ?? "",
      overallScore: currentAudit?.overallScore ?? 0,
      expiresInDays: 30,
      agencyName: "UfuqAudit",
      primaryColor: "#10b981",
    });
    setDialogOpen(true);
  }, [currentAudit]);

  const onCreate = async () => {
    const clientName = form.clientName.trim();
    const auditUrl = form.auditUrl.trim();
    if (!clientName) {
      toast.error("Enter a client name");
      return;
    }
    if (!auditUrl) {
      toast.error("Enter an audit URL to share");
      return;
    }
    setAdding(true);
    try {
      const r = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientEmail: form.clientEmail.trim(),
          auditUrl,
          overallScore: form.overallScore,
          expiresInDays: form.expiresInDays,
          agencyName: form.agencyName.trim() || "UfuqAudit",
          primaryColor: form.primaryColor,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      const j = (await r.json()) as { link: PortalLink };
      setLinks((prev) => [j.link, ...prev]);
      const full = buildFullUrl(j.link.token);
      toast.success("Portal link created", {
        description: full,
      });
      setDialogOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create link";
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  const onCopyLink = async (link: PortalLink) => {
    const full = buildFullUrl(link.token);
    try {
      await navigator.clipboard.writeText(full);
      toast.success("Link copied to clipboard", { description: full });
    } catch {
      toast.error("Couldn't copy — clipboard unavailable");
    }
  };

  const onView = (link: PortalLink) => {
    toast.info("Opening portal…", {
      description: `${link.clientName} · ${truncateUrl(link.auditUrl, 32)}`,
    });
  };

  const onConfirmRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      const r = await fetch(`/api/portal?id=${encodeURIComponent(revokeTarget.id)}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setLinks((prev) => prev.filter((l) => l.id !== revokeTarget.id));
      toast.success("Link revoked");
      setRevokeTarget(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to revoke link";
      toast.error(msg);
    } finally {
      setRevoking(false);
    }
  };

  // ---------- Derived stats ----------
  const totalLinks = links.length;
  const totalViews = links.reduce((sum, l) => sum + (l.views ?? 0), 0);
  const activeLinks = links.filter((l) => !isExpired(l)).length;
  const avgScore =
    totalLinks > 0
      ? Math.round(links.reduce((sum, l) => sum + (l.overallScore ?? 0), 0) / totalLinks)
      : 0;

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="Client Portal"
          subtitle="Share branded audit reports with clients"
          icon={Share2}
          actions={
            <Button size="sm" className={EMERALD_BTN} disabled>
              <Plus className="w-3.5 h-3.5 mr-1" /> Create link
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
  if (links.length === 0) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="Client Portal"
          subtitle="Share branded audit reports with clients"
          icon={Share2}
          actions={
            <Button size="sm" className={EMERALD_BTN} onClick={openCreateDialog}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Create link
            </Button>
          }
        />
        <Card className="p-10 text-center border-dashed">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-3">
            <Share2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-semibold text-lg">No client links yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {error
              ? `We couldn't load your portal links (${error}). Try again in a moment.`
              : "Create your first shareable audit link — clients get a branded, white-label report with your agency name and colors."}
          </p>
          <Button className={cn(EMERALD_BTN, "mt-5")} onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-1" /> Create link
          </Button>
        </Card>
        <CreateLinkDialog
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
        title="Client Portal"
        subtitle="Share branded audit reports with clients"
        icon={Share2}
        actions={
          <Button size="sm" className={EMERALD_BTN} onClick={openCreateDialog}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Create link
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Links"
          value={totalLinks}
          hint={activeLinks === totalLinks ? "All active" : `${activeLinks} active`}
          color={EMERALD}
          icon={LinkIcon}
        />
        <StatCard
          label="Total Views"
          value={totalViews}
          hint="Across all links"
          color={TEAL_DARK}
          icon={Eye}
        />
        <StatCard
          label="Active Links"
          value={activeLinks}
          hint={`${totalLinks - activeLinks} expired`}
          color={activeLinks === 0 ? "#ef4444" : EMERALD}
          icon={Users}
        />
        <StatCard
          label="Avg Score"
          value={avgScore}
          hint="Across shared audits"
          color={scoreColor(avgScore)}
          icon={Gauge}
        />
      </div>

      {/* Links table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Portal Links</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalLinks} {totalLinks === 1 ? "link" : "links"} · {activeLinks} active · {totalViews} total views
            </p>
          </div>
        </div>

        <div className={SCROLLBAR_CLS}>
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="min-w-[180px]">Client</TableHead>
                <TableHead className="min-w-[180px]">Audit URL</TableHead>
                <TableHead className="w-[80px] text-center">Score</TableHead>
                <TableHead className="min-w-[220px]">Share Link</TableHead>
                <TableHead className="w-[80px] text-center">Views</TableHead>
                <TableHead className="w-[110px]">Last Viewed</TableHead>
                <TableHead className="w-[110px]">Expires</TableHead>
                <TableHead className="w-[50px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="zebra">
              {links.map((link) => {
                const expired = isExpired(link);
                return (
                  <TableRow key={link.id} className="hover:bg-muted/40">
                    {/* Client */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-tight">
                          {link.clientName}
                        </span>
                        {link.clientEmail && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {link.clientEmail}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Audit URL */}
                    <TableCell className="max-w-[240px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <LinkIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground truncate cursor-help">
                              {truncateUrl(link.auditUrl)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[400px] break-all">
                            {link.auditUrl}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>

                    {/* Score */}
                    <TableCell className="text-center">
                      <span
                        className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold tabular-nums min-w-[34px]"
                        style={{
                          backgroundColor: `${scoreColor(link.overallScore)}1a`,
                          color: scoreColor(link.overallScore),
                        }}
                      >
                        {link.overallScore}
                      </span>
                    </TableCell>

                    {/* Share Link (copyable input + copy button) */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Input
                          readOnly
                          value={portalPath(link.token)}
                          className="h-7 text-[11px] font-mono truncate bg-muted/40"
                          aria-label={`Share path for ${link.clientName}`}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0 shrink-0"
                          onClick={() => onCopyLink(link)}
                          aria-label="Copy link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>

                    {/* Views */}
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "tabular-nums",
                          link.views === 0
                            ? "bg-muted/40 text-muted-foreground"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
                        )}
                      >
                        {link.views}
                      </Badge>
                    </TableCell>

                    {/* Last Viewed */}
                    <TableCell className="text-xs text-muted-foreground">
                      {relTime(link.lastViewedAt)}
                    </TableCell>

                    {/* Expires */}
                    <TableCell>
                      {expired ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                          <Ban className="w-3 h-3" /> Expired
                        </span>
                      ) : link.expiresAt ? (
                        <span className="text-xs text-muted-foreground">
                          {relTime(link.expiresAt)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Never</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            aria-label="Link actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem onClick={() => onCopyLink(link)}>
                            <Copy className="w-3.5 h-3.5" /> Copy link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onView(link)}>
                            <ExternalLink className="w-3.5 h-3.5" /> View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setRevokeTarget(link)}
                          >
                            <Ban className="w-3.5 h-3.5" /> Revoke
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

      <CreateLinkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        onCreate={onCreate}
        adding={adding}
      />

      {/* Revoke confirmation */}
      <AlertDialog
        open={revokeTarget !== null}
        onOpenChange={(o) => !o && !revoking && setRevokeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke portal link?</AlertDialogTitle>
            <AlertDialogDescription>
              The link shared with{" "}
              <span className="font-medium text-foreground">{revokeTarget?.clientName}</span>{" "}
              will stop working immediately. The client will no longer be able to access the audit report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Keep link</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirmRevoke();
              }}
              disabled={revoking}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {revoking ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Revoking…
                </>
              ) : (
                <>
                  <Ban className="w-3.5 h-3.5 mr-1" /> Revoke link
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------- Create link dialog ----------
interface CreateLinkDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  form: PortalCreateBody;
  setForm: React.Dispatch<React.SetStateAction<PortalCreateBody>>;
  onCreate: () => void;
  adding: boolean;
}

function CreateLinkDialog({
  open, onOpenChange, form, setForm, onCreate, adding,
}: CreateLinkDialogProps) {
  const update = <K extends keyof PortalCreateBody>(k: K, v: PortalCreateBody[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const scoreClr = scoreColor(form.overallScore || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create portal link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Client row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pl-name" className="text-xs">Client name</Label>
              <Input
                id="pl-name"
                placeholder="Acme Corp"
                value={form.clientName}
                onChange={(e) => update("clientName", e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pl-email" className="text-xs">Client email (optional)</Label>
              <Input
                id="pl-email"
                type="email"
                placeholder="john@acme.com"
                value={form.clientEmail}
                onChange={(e) => update("clientEmail", e.target.value)}
              />
            </div>
          </div>

          {/* URL + score row */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pl-url" className="text-xs">Audit URL</Label>
              <Input
                id="pl-url"
                placeholder="https://example.com"
                value={form.auditUrl}
                onChange={(e) => update("auditUrl", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pl-score" className="text-xs">Score</Label>
              <Input
                id="pl-score"
                type="number"
                min={0}
                max={100}
                value={form.overallScore}
                onChange={(e) => update("overallScore", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Expiry + Agency row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Expires in</Label>
              <Select
                value={String(form.expiresInDays)}
                onValueChange={(v) => update("expiresInDays", Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pl-agency" className="text-xs">Agency name</Label>
              <Input
                id="pl-agency"
                placeholder="UfuqAudit"
                value={form.agencyName}
                onChange={(e) => update("agencyName", e.target.value)}
              />
            </div>
          </div>

          {/* Brand color swatches */}
          <div className="space-y-1.5">
            <Label className="text-xs">Brand color</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {BRAND_SWATCHES.map((sw) => {
                const selected = form.primaryColor === sw.value;
                return (
                  <button
                    key={sw.value}
                    type="button"
                    onClick={() => update("primaryColor", sw.value)}
                    aria-label={sw.name}
                    aria-pressed={selected}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center",
                      selected
                        ? cn("ring-2 ring-offset-2 ring-offset-background", sw.ring)
                        : "border-transparent hover:scale-110",
                    )}
                    style={{ backgroundColor: sw.value }}
                  >
                    {selected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Branding preview */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Client preview
            </Label>
            <BrandingPreview
              agencyName={form.agencyName.trim() || "UfuqAudit"}
              brandColor={form.primaryColor}
              score={form.overallScore || 0}
              clientName={form.clientName.trim() || "Your client"}
              auditUrl={form.auditUrl}
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            Clients see a clean, white-labeled report — your branding, no UfuqAudit references in the report view.
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
                <Plus className="w-3.5 h-3.5 mr-1" /> Create link
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Branding preview card (mini mockup) ----------
function BrandingPreview({
  agencyName, brandColor, score, clientName, auditUrl,
}: {
  agencyName: string;
  brandColor: string;
  score: number;
  clientName: string;
  auditUrl: string;
}) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: `${brandColor}33` }}
    >
      {/* Header strip — brand color */}
      <div
        className="px-3 py-2.5 flex items-center justify-between"
        style={{ backgroundColor: brandColor }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-6 h-6 rounded-md bg-white/25 flex items-center justify-center shrink-0"
            aria-hidden
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-bold text-white truncate">{agencyName}</span>
        </div>
        <span className="text-[10px] text-white/80 shrink-0 hidden sm:inline">Audit Report</span>
      </div>

      {/* Body */}
      <div className="px-3 py-3 bg-card">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Prepared for</p>
            <p className="text-sm font-semibold truncate">{clientName}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {auditUrl ? truncateUrl(auditUrl, 36) : "—"}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div
              className="text-2xl font-bold tabular-nums leading-none"
              style={{ color: brandColor }}
            >
              {score}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Ufuq Score</div>
          </div>
        </div>

        {/* Mock score bars */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: "SEO", v: Math.min(100, score + 2) },
            { label: "Perf", v: Math.max(40, score - 8) },
            { label: "AEO", v: Math.max(40, score - 4) },
          ].map((b) => (
            <div key={b.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{b.label}</span>
                <span className="text-[10px] font-medium tabular-nums">{b.v}</span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${b.v}%`, backgroundColor: brandColor }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

