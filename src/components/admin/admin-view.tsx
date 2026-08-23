"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ShieldCheck,
  Users,
  FileSearch,
  FolderTree,
  AlertOctagon,
  Activity,
  Plus,
  MoreVertical,
  Trash2,
  UserCog,
  CreditCard,
  Loader2,
  RefreshCw,
  Settings as SettingsIcon,
  Clock,
} from "lucide-react";

// ---- API response shapes ----
interface AdminStats {
  counts: { users: number; audits: number; projects: number; issues: number };
  avgScore: number;
  recentAudits: Array<{
    id: string;
    url: string;
    overallScore: number;
    status: string;
    createdAt: string;
    user: string | null;
  }>;
}
interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  createdAt: string;
}
interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

const ROLES = ["user", "admin"] as const;
const PLANS = ["free", "starter", "pro", "agency"] as const;

const EMERALD_BTN = "bg-emerald-600 hover:bg-emerald-700 text-white";

function planBadge(plan: string): string {
  const map: Record<string, string> = {
    free: "bg-slate-100 text-slate-700 border-slate-200",
    starter: "bg-sky-50 text-sky-700 border-sky-200",
    pro: "bg-emerald-50 text-emerald-700 border-emerald-200",
    agency: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return map[plan] ?? "bg-slate-100 text-slate-700 border-slate-200";
}

function roleBadge(role: string): string {
  return role === "admin"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-slate-100 text-slate-700 border-slate-200";
}

function scoreColor(v: number): string {
  return v >= 80 ? "text-emerald-600" : v >= 60 ? "text-amber-600" : v >= 40 ? "text-orange-600" : "text-red-600";
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "");
  }
  return email.slice(0, 2);
}

export function AdminView() {
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addOpen, setAddOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<AdminUser | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const [sysSettings, setSysSettings] = React.useState({
    maintenance: false,
    signups: true,
    aiRecs: true,
    freeAudit: true,
  });

  const refreshAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [statsR, usersR, logsR] = await Promise.all([
        fetch("/api/admin/stats").then((r) => r.json() as Promise<AdminStats>),
        fetch("/api/admin/users").then((r) => r.json() as Promise<{ users: AdminUser[] }>),
        fetch("/api/admin/audit-logs").then((r) => r.json() as Promise<{ logs: AuditLog[] }>),
      ]);
      setStats(statsR);
      setUsers(usersR.users ?? []);
      setLogs(logsR.logs ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshAll();
  }, [refreshAll, refreshKey]);

  async function patchUser(id: string, patch: { role?: string; plan?: string }) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      if (!res.ok) throw new Error("patch failed");
      toast.success("User updated");
      setRefreshKey((k) => k + 1);
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
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Admin Panel"
        subtitle="System overview, user management & audit logs"
        icon={ShieldCheck}
        actions={
          <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Users" value={stats?.counts.users ?? "—"} icon={Users} color="#10b981" />
        <StatCard label="Total Audits" value={stats?.counts.audits ?? "—"} icon={FileSearch} color="#10b981" />
        <StatCard label="Projects" value={stats?.counts.projects ?? "—"} icon={FolderTree} color="#10b981" />
        <StatCard label="Issues" value={stats?.counts.issues ?? "—"} icon={AlertOctagon} color="#10b981" />
        <StatCard
          label="Avg Score"
          value={stats?.avgScore != null ? `${stats.avgScore}/100` : "—"}
          hint="Across all audits"
          icon={Activity}
          color="#10b981"
        />
      </div>

      {/* Recent Audits + System Logs */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <FileSearch className="w-4 h-4 text-emerald-600" /> Recent Audits
          </h3>
          <div className="max-h-[40vh] overflow-y-auto -mx-2 px-2">
            {loading ? (
              <SkeletonRows />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.recentAudits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        No audits yet
                      </TableCell>
                    </TableRow>
                  )}
                  {stats?.recentAudits.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="max-w-[200px] truncate font-medium" title={a.url}>
                        {a.url}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.user ?? "—"}</TableCell>
                      <TableCell className={`font-semibold tabular-nums ${scoreColor(a.overallScore)}`}>
                        {a.overallScore}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(a.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-emerald-600" /> System Audit Logs
          </h3>
          <div className="max-h-[40vh] overflow-y-auto -mx-2 px-2">
            {loading ? (
              <SkeletonRows />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                        No logs yet
                      </TableCell>
                    </TableRow>
                  )}
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <Clock className="inline w-3 h-3 mr-1" />
                        {formatDate(l.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{l.action}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {l.entity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={l.details ?? ""}>
                        {l.details ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>

      {/* User management */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" /> User Management
          </h3>
          <Button size="sm" className={EMERALD_BTN} onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add user
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto -mx-2 px-2">
          {loading ? (
            <SkeletonRows />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      No users yet
                    </TableCell>
                  </TableRow>
                )}
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs font-semibold">
                            {initials(u.name, u.email).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{u.name ?? u.email}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${roleBadge(u.role)}`}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${planBadge(u.plan)}`}>
                        {u.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Manage</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="flex items-center gap-2">
                              <UserCog className="w-3.5 h-3.5" /> Change role
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

      {/* System settings */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <SettingsIcon className="w-4 h-4 text-emerald-600" /> System Settings
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <ToggleRow
            label="Maintenance mode"
            desc="Show a maintenance page to all visitors"
            checked={sysSettings.maintenance}
            onToggle={(v) => {
              setSysSettings({ ...sysSettings, maintenance: v });
              toast.success("Saved");
            }}
          />
          <ToggleRow
            label="New signups"
            desc="Allow new account registration"
            checked={sysSettings.signups}
            onToggle={(v) => {
              setSysSettings({ ...sysSettings, signups: v });
              toast.success("Saved");
            }}
          />
          <ToggleRow
            label="AI recommendations"
            desc="Enable AI-generated fixes for audits"
            checked={sysSettings.aiRecs}
            onToggle={(v) => {
              setSysSettings({ ...sysSettings, aiRecs: v });
              toast.success("Saved");
            }}
          />
          <ToggleRow
            label="Free audit"
            desc="Allow running a free audit without signup"
            checked={sysSettings.freeAudit}
            onToggle={(v) => {
              setSysSettings({ ...sysSettings, freeAudit: v });
              toast.success("Saved");
            }}
          />
        </div>
      </Card>

      <AddUserDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(o) => {
          if (!o) setUserToDelete(null);
        }}
      >
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

function ToggleRow({
  label,
  desc,
  checked,
  onToggle,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2 py-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-8 rounded-md bg-muted/60 animate-pulse" />
      ))}
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
                    <SelectItem key={r} value={r} className="capitalize">
                      {r}
                    </SelectItem>
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
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            Create user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
