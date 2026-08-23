"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users, UserCheck, Shield, UserPlus, Plus, MoreVertical, Trash2,
  UserCog, CreditCard, Loader2, RefreshCw, Search, Eye, KeyRound,
  Ban, CheckCircle2, Download, Mail,
} from "lucide-react";
import {
  SCROLLBAR_CLS, SkeletonRows, EmptyState,
  EMERALD_BTN,
  type AdminUser,
  formatDateLong, relativeTime, formatCompact,
  planBadgeClass, roleBadgeClass, initials, downloadCsv,
} from "../admin-helpers";

const ROLES = ["user", "admin"] as const;
const PLANS = ["free", "starter", "pro", "agency"] as const;

type SortKey = "date" | "name" | "plan";

interface EnrichedUser extends AdminUser {
  status: "active" | "suspended";
  projects: number;
  audits: number;
  apiUsage: number;
  aiUsage: number;
  lastLogin: string;
}

function enrichUsers(users: AdminUser[]): EnrichedUser[] {
  // Mock enrichment — would come from richer API in production
  return users.map((u, i) => {
    const seed = u.id.charCodeAt(0) + u.id.charCodeAt(u.id.length - 1) + i;
    return {
      ...u,
      status: u.role === "admin" ? "active" : seed % 7 === 0 ? "suspended" : "active",
      projects: seed % 12,
      audits: seed % 40,
      apiUsage: 100 + (seed * 37) % 5000,
      aiUsage: 1000 + (seed * 191) % 40000,
      lastLogin: new Date(Date.now() - (seed % 14) * 86_400_000).toISOString(),
    };
  });
}

export function AdminUsersSection({ refreshKey }: { refreshKey: number }) {
  const [users, setUsers] = React.useState<EnrichedUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [totalUsers, setTotalUsers] = React.useState(0);
  const [newThisMonth, setNewThisMonth] = React.useState(0);
  const [adminCount, setAdminCount] = React.useState(0);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | "admin" | "user">("all");
  const [planFilter, setPlanFilter] = React.useState<"all" | (typeof PLANS)[number]>("all");
  const [sort, setSort] = React.useState<SortKey>("date");

  const [addOpen, setAddOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<EnrichedUser | null>(null);
  const [profileUser, setProfileUser] = React.useState<EnrichedUser | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/stats").then((r) => r.json());
      setTotalUsers(r.counts?.users ?? 0);
      setNewThisMonth(r.counts?.usersThisMonth ?? 0);
    } catch (e) {
      console.error(e);
    }
    try {
      const r = await fetch("/api/admin/users").then((r) => r.json() as Promise<{ users: AdminUser[] }>);
      const enriched = enrichUsers(r.users ?? []);
      setUsers(enriched);
      setAdminCount(enriched.filter((u) => u.role === "admin").length);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function patchUser(id: string, patch: { role?: string; plan?: string }) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      if (!res.ok) throw new Error("patch failed");
      toast.success("User updated");
      void load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update user");
    }
  }

  async function deleteUser() {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(userToDelete.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
      toast.success(`Removed ${userToDelete.email}`);
      setUserToDelete(null);
      void load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  }

  // ---- Filter + sort ----
  const filtered = React.useMemo(() => {
    let list = users;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((u) => (u.name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    if (roleFilter !== "all") list = list.filter((u) => u.role === roleFilter);
    if (planFilter !== "all") list = list.filter((u) => u.plan === planFilter);
    list = [...list].sort((a, b) => {
      if (sort === "name") return (a.name ?? a.email).localeCompare(b.name ?? b.email);
      if (sort === "plan") return (a.plan).localeCompare(b.plan);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [users, search, roleFilter, planFilter, sort]);

  // ---- Bulk actions ----
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((u) => u.id)));
  }
  function bulkAction(action: "suspend" | "activate" | "export") {
    if (selected.size === 0) return;
    if (action === "export") {
      const rows = filtered
        .filter((u) => selected.has(u.id))
        .map((u) => ({
          id: u.id, name: u.name ?? "", email: u.email, role: u.role, plan: u.plan,
          status: u.status, projects: u.projects, audits: u.audits,
          apiUsage: u.apiUsage, aiUsage: u.aiUsage, createdAt: u.createdAt,
        }));
      downloadCsv(rows, `users-${Date.now()}.csv`);
      toast.success(`Exported ${rows.length} users to CSV`);
      return;
    }
    toast.success(`${action === "suspend" ? "Suspended" : "Activated"} ${selected.size} user(s)`, {
      description: "Bulk action simulated in this preview build",
    });
    setSelected(new Set());
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="User Management"
        subtitle="Manage all platform users, roles, and plans"
        icon={Users}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => load()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <Button size="sm" className={EMERALD_BTN} onClick={() => setAddOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add user
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={totalUsers} icon={Users} color="#10b981" />
        <StatCard label="Active" value={Math.round(totalUsers * 0.65)} hint="~65% active" icon={UserCheck} color="#10b981" />
        <StatCard label="Admins" value={adminCount} icon={Shield} color="#14b8a6" />
        <StatCard label="New This Month" value={newThisMonth} icon={UserPlus} color="#f59e0b" />
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as typeof planFilter)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                {PLANS.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort: Newest</SelectItem>
                <SelectItem value="name">Sort: Name</SelectItem>
                <SelectItem value="plan">Sort: Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40">
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {selected.size} selected
          </span>
          <div className="h-4 w-px bg-emerald-200 dark:bg-emerald-800" />
          <Button size="sm" variant="outline" onClick={() => bulkAction("suspend")}>
            <Ban className="w-3.5 h-3.5 mr-1" /> Suspend
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction("activate")}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Activate
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction("export")}>
            <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* Users table */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-emerald-600" /> Users
          <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
        </h3>
        <div className={`-mx-2 px-2 ${SCROLLBAR_CLS} max-h-[60vh]`}>
          {loading ? (
            <SkeletonRows rows={6} cols={10} />
          ) : filtered.length === 0 ? (
            <EmptyState msg="No users match your filters" icon={Users} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="min-w-[180px]">User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Projects</TableHead>
                  <TableHead className="text-right">Audits</TableHead>
                  <TableHead className="text-right">API Usage</TableHead>
                  <TableHead className="text-right">AI Usage</TableHead>
                  <TableHead className="whitespace-nowrap">Created</TableHead>
                  <TableHead className="whitespace-nowrap">Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="zebra">
                {filtered.map((u) => (
                  <TableRow key={u.id} data-state={selected.has(u.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(u.id)}
                        onCheckedChange={() => toggleOne(u.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold">
                            {initials(u.name, u.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{u.name ?? u.email}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${roleBadgeClass(u.role)}`}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${planBadgeClass(u.plan)}`}>
                        {u.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.status === "active" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Suspended
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{u.projects}</TableCell>
                    <TableCell className="text-right tabular-nums">{u.audits}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{formatCompact(u.apiUsage)}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{formatCompact(u.aiUsage)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDateLong(u.createdAt)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{relativeTime(u.lastLogin)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Manage user</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setProfileUser(u)}>
                            <Eye className="w-3.5 h-3.5 mr-2" /> View profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Edit dialog (demo)")}>
                            <UserCog className="w-3.5 h-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.success(u.status === "active" ? "User suspended (demo)" : "User activated (demo)")}>
                            {u.status === "active" ? (
                              <>
                                <Ban className="w-3.5 h-3.5 mr-2" /> Suspend
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="flex items-center gap-2">
                              <CreditCard className="w-3.5 h-3.5" /> Change plan
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {PLANS.map((p) => (
                                <DropdownMenuItem
                                  key={p}
                                  onClick={() => patchUser(u.id, { plan: p })}
                                  className="capitalize"
                                >
                                  {p}
                                  {u.plan === p && (
                                    <span className="ml-auto text-emerald-600">●</span>
                                  )}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="flex items-center gap-2">
                              <Shield className="w-3.5 h-3.5" /> Change role
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {ROLES.map((r) => (
                                <DropdownMenuItem
                                  key={r}
                                  onClick={() => patchUser(u.id, { role: r })}
                                  className="capitalize"
                                >
                                  {r}
                                  {u.role === r && (
                                    <span className="ml-auto text-emerald-600">●</span>
                                  )}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuItem onClick={() => toast.success("Password reset email sent (demo)")}>
                            <KeyRound className="w-3.5 h-3.5 mr-2" /> Reset password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setUserToDelete(u)}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete user
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

      <AddUserDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => void load()}
      />

      {/* Profile sheet */}
      <Sheet open={!!profileUser} onOpenChange={(o) => { if (!o) setProfileUser(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {profileUser && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {initials(profileUser.name, profileUser.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-base font-semibold">{profileUser.name ?? "Unnamed user"}</div>
                    <div className="text-xs font-normal text-muted-foreground">{profileUser.email}</div>
                  </div>
                </SheetTitle>
                <SheetDescription>
                  User ID <span className="font-mono">{profileUser.id}</span>
                </SheetDescription>
              </SheetHeader>

              <div className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-[10px] text-muted-foreground">Role</div>
                    <Badge variant="outline" className={`mt-1 capitalize ${roleBadgeClass(profileUser.role)}`}>
                      {profileUser.role}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-[10px] text-muted-foreground">Plan</div>
                    <Badge variant="outline" className={`mt-1 capitalize ${planBadgeClass(profileUser.plan)}`}>
                      {profileUser.plan}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-[10px] text-muted-foreground">Status</div>
                    <div className="text-sm font-medium mt-1 capitalize">
                      {profileUser.status}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-[10px] text-muted-foreground">Created</div>
                    <div className="text-sm font-medium mt-1">{formatDateLong(profileUser.createdAt)}</div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm font-semibold mb-3">Usage meters</div>
                  <UsageMeter label="Projects" value={profileUser.projects} max={50} color="#10b981" />
                  <UsageMeter label="Audits" value={profileUser.audits} max={100} color="#14b8a6" />
                  <UsageMeter label="API requests" value={profileUser.apiUsage} max={10000} color="#f59e0b" format />
                  <UsageMeter label="AI tokens" value={profileUser.aiUsage} max={100000} color="#8b5cf6" format />
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm font-semibold mb-3">API keys</div>
                  <div className="space-y-2">
                    {["Production API", "Development"].map((n) => (
                      <div key={n} className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-2">
                          <KeyRound className="w-3 h-3 text-muted-foreground" /> {n}
                        </span>
                        <Badge variant="outline" className="text-emerald-700 border-emerald-200 dark:text-emerald-300 dark:border-emerald-800">
                          Active
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm font-semibold mb-3">Login history</div>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { date: "Today, 9:42 AM", ip: "182.71.0.1", loc: "Lahore, PK" },
                      { date: "Yesterday, 5:21 PM", ip: "182.71.0.1", loc: "Lahore, PK" },
                      { date: "2 days ago", ip: "74.6.18.42", loc: "San Jose, US" },
                    ].map((h) => (
                      <div key={h.date} className="flex items-center justify-between">
                        <span>{h.date}</span>
                        <span className="text-muted-foreground">{h.ip} · {h.loc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" className={`flex-1 ${EMERALD_BTN}`} onClick={() => toast.info("Edit dialog (demo)")}>
                    <UserCog className="w-3.5 h-3.5 mr-1" /> Edit user
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.success("Password reset email sent (demo)")}>
                    <Mail className="w-3.5 h-3.5 mr-1" /> Reset
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!userToDelete} onOpenChange={(o) => { if (!o) setUserToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">{userToDelete?.email}</span> and remove their
              access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void deleteUser();
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

function UsageMeter({ label, value, max, color, format }: {
  label: string; value: number; max: number; color: string; format?: boolean;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">
          {format ? formatCompact(value) : value} / {format ? formatCompact(max) : max}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function AddUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState<string>("user");
  const [plan, setPlan] = React.useState<string>("free");
  const [saving, setSaving] = React.useState(false);

  async function submit() {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          role,
          plan,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "create failed");
      }
      toast.success("User created");
      setEmail("");
      setName("");
      setRole("user");
      setPlan("free");
      onOpenChange(false);
      onCreated();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add new user</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="au-email">Email</Label>
            <Input
              id="au-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="au-name">Name (optional)</Label>
            <Input
              id="au-name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Plan</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={saving}>Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={saving} className={EMERALD_BTN}>
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            Create user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
