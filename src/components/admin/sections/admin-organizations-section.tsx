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
  Building2, Building, MoreVertical, Plus, RefreshCw, Search,
  Eye, Ban, CheckCircle2, Trash2, Globe, Loader2,
} from "lucide-react";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState,
  EMERALD_BTN,
  type OrgRow, type OrgStats,
  formatDateLong, relativeTime, formatCompact,
  planBadgeClass, statusBadgeClass,
} from "../admin-helpers";

export function AdminOrganizationsSection({ refreshKey }: { refreshKey: number }) {
  const [orgs, setOrgs] = React.useState<OrgRow[]>([]);
  const [stats, setStats] = React.useState<OrgStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "suspended">("all");
  const [planFilter, setPlanFilter] = React.useState<"all" | string>("all");
  const [createOpen, setCreateOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/organizations").then((r) => r.json() as Promise<{ orgs: OrgRow[]; stats: OrgStats }>);
      setOrgs(r.orgs ?? []);
      setStats(r.stats ?? null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const filtered = React.useMemo(() => {
    let list = orgs;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((o) => o.name.toLowerCase().includes(q) || o.domain.toLowerCase().includes(q));
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    if (planFilter !== "all") list = list.filter((o) => o.plan === planFilter);
    return list;
  }, [orgs, search, statusFilter, planFilter]);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Organizations"
        subtitle="Manage workspaces, members and org-level limits"
        icon={Building2}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => load()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <Button size="sm" className={EMERALD_BTN} onClick={() => setCreateOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Create organization
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Orgs" value={stats?.total ?? 0} icon={Building2} color="#10b981" />
        <StatCard label="Active" value={stats?.active ?? 0} icon={CheckCircle2} color="#10b981" />
        <StatCard label="Suspended" value={stats?.suspended ?? 0} icon={Ban} color="#ef4444" />
        <StatCard label="Total Members" value={stats?.totalMembers ?? 0} icon={Building} color="#14b8a6" />
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name or domain…"
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
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                {["free", "starter", "pro", "agency"].map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Orgs table */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-emerald-600" /> Organizations
          <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
        </h3>
        <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[60vh]`}>
          {loading ? (
            <SkeletonRows rows={6} cols={10} />
          ) : filtered.length === 0 ? (
            <EmptyState msg="No organizations found" icon={Building2} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Organization</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                  <TableHead className="text-right">Projects</TableHead>
                  <TableHead className="text-right">Websites</TableHead>
                  <TableHead className="text-right">Audits</TableHead>
                  <TableHead className="text-right">API Requests</TableHead>
                  <TableHead className="text-right">AI Tokens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="whitespace-nowrap">Created</TableHead>
                  <TableHead className="whitespace-nowrap">Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center text-xs font-semibold">
                          {o.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{o.name}</div>
                          <div className="text-xs text-muted-foreground truncate inline-flex items-center gap-1">
                            <Globe className="w-3 h-3" /> {o.domain}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{o.industry}</TableCell>
                    <TableCell className="text-xs">{o.country}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${planBadgeClass(o.plan)}`}>
                        {o.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{o.members}</TableCell>
                    <TableCell className="text-right tabular-nums">{o.projects}</TableCell>
                    <TableCell className="text-right tabular-nums">{o.websites}</TableCell>
                    <TableCell className="text-right tabular-nums">{o.audits}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{formatCompact(o.apiRequests)}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{formatCompact(o.aiTokens)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${statusBadgeClass(o.status)}`}>
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDateLong(o.createdAt)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{relativeTime(o.lastActive)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Manage org</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toast.info(`View ${o.name}`)}>
                            <Eye className="w-3.5 h-3.5 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Edit dialog (demo)")}>
                            <Building className="w-3.5 h-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          {o.status === "active" ? (
                            <DropdownMenuItem onClick={() => toast.success(`${o.name} suspended (demo)`)}>
                              <Ban className="w-3.5 h-3.5 mr-2" /> Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => toast.success(`${o.name} reactivated (demo)`)}>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => toast.error(`Delete not implemented for ${o.name}`)}
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
        {filtered.length > 0 && (
          <p className="text-[10px] text-muted-foreground mt-2">
            Showing {filtered.length} of {orgs.length} organizations
          </p>
        )}
      </Card>

      <CreateOrgDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => { void load(); }}
      />
    </div>
  );
}

function CreateOrgDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = React.useState("");
  const [domain, setDomain] = React.useState("");
  const [industry, setIndustry] = React.useState("Digital Marketing");
  const [country, setCountry] = React.useState("United States");
  const [plan, setPlan] = React.useState<string>("free");
  const [saving, setSaving] = React.useState(false);

  async function submit() {
    if (!name.trim()) {
      toast.error("Organization name is required");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    toast.success(`Created "${name.trim()}" (demo)`);
    setName("");
    setDomain("");
    onOpenChange(false);
    onCreated();
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              placeholder="Acme Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="org-domain">Domain</Label>
            <Input
              id="org-domain"
              placeholder="acme.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Digital Marketing", "Web Development", "SaaS", "E-commerce", "Consulting", "Technology", "Other"].map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["United States", "United Kingdom", "Pakistan", "Germany", "Canada", "Australia", "Other"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Plan</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["free", "starter", "pro", "agency"].map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={saving}>Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={saving} className={EMERALD_BTN}>
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
