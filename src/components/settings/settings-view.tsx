"use client";

import * as React from "react";
import { ViewHeader } from "@/components/dashboard/shared";
import { useAppStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  User,
  Sliders,
  KeyRound,
  Users,
  Bell,
  Copy,
  Plus,
  Trash2,
  Check,
  Loader2,
  Shield,
} from "lucide-react";

const EMERALD_BTN = "bg-emerald-600 hover:bg-emerald-700 text-white";

const TIMEZONES = [
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

interface ApiKey {
  id: string;
  name: string;
  keyMasked: string;
  createdAt: string;
  lastUsed: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  invitedAt: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function maskKey(prefix: string, full?: string): string {
  if (full) return `${full.slice(0, 12)}…${full.slice(-4)}`;
  return `${prefix}_************************************`;
}

function genApiKey(): string {
  const seg = (n: number) =>
    Array.from({ length: n }, () =>
      "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
    ).join("");
  return `ufa_live_${seg(8)}${seg(8)}${seg(8)}`;
}

export function SettingsView() {
  const user = useAppStore((s) => s.user);
  const email = user?.email ?? "demo@ufuqaudit.app";
  const name = user?.name ?? "Demo User";
  const initials = name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Settings"
        subtitle="Profile, preferences & API"
        icon={SettingsIcon}
      />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex-wrap h-auto bg-muted/60 p-1">
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="w-3.5 h-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-1.5">
            <Sliders className="w-3.5 h-3.5" /> Preferences
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="gap-1.5">
            <KeyRound className="w-3.5 h-3.5" /> API Keys
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="w-3.5 h-3.5" /> Team
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="w-3.5 h-3.5" /> Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab initials={initials} name={name} email={email} />
        </TabsContent>
        <TabsContent value="preferences">
          <PreferencesTab />
        </TabsContent>
        <TabsContent value="api-keys">
          <ApiKeysTab />
        </TabsContent>
        <TabsContent value="team">
          <TeamTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FieldRow({
  label,
  desc,
  htmlFor,
  children,
}: {
  label: string;
  desc?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid sm:grid-cols-[220px_1fr] gap-2 sm:gap-4 items-start py-4 border-b last:border-b-0">
      <div>
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </Label>
        {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}

function ProfileTab({
  initials,
  name,
  email,
}: {
  initials: string;
  name: string;
  email: string;
}) {
  const [nameValue, setNameValue] = React.useState(name);
  const [bio, setBio] = React.useState("Building better websites with UfuqAudit — one crawl at a time.");
  const [tz, setTz] = React.useState("Asia/Karachi");

  return (
    <Card className="p-5 sm:p-6 mt-4">
      <div className="flex items-center gap-4 mb-6 pb-6 border-b">
        <Avatar className="w-16 h-16">
          <AvatarFallback className="bg-emerald-600 text-white text-xl font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-sm text-muted-foreground">{email}</p>
          <Button variant="outline" size="sm" className="mt-2 h-7" onClick={() => toast.info("Upload avatar (mock)")}>
            Change avatar
          </Button>
        </div>
      </div>

      <FieldRow label="Full name" htmlFor="su-name">
        <Input id="su-name" value={nameValue} onChange={(e) => setNameValue(e.target.value)} />
      </FieldRow>

      <FieldRow label="Email" desc="Contact your admin to change your email address." htmlFor="su-email">
        <Input id="su-email" value={email} readOnly disabled className="opacity-70" />
      </FieldRow>

      <FieldRow label="Bio" htmlFor="su-bio">
        <Textarea
          id="su-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
        />
      </FieldRow>

      <FieldRow label="Timezone" htmlFor="su-tz">
        <Select value={tz} onValueChange={setTz}>
          <SelectTrigger id="su-tz" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRow>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline">Cancel</Button>
        <Button className={EMERALD_BTN} onClick={() => toast.success("Profile saved")}>
          Save changes
        </Button>
      </div>
    </Card>
  );
}

function PreferencesTab() {
  const [depth, setDepth] = React.useState("standard");
  const [defaultView, setDefaultView] = React.useState("dashboard");
  const [theme, setTheme] = React.useState("system");
  const [digest, setDigest] = React.useState("weekly");
  const [autoRun, setAutoRun] = React.useState(true);
  const [shareAnon, setShareAnon] = React.useState(false);

  return (
    <Card className="p-5 sm:p-6 mt-4">
      <FieldRow label="Default audit depth" desc="Used when starting a new audit from the dashboard.">
        <Select value={depth} onValueChange={setDepth}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quick">Quick (50 URLs)</SelectItem>
            <SelectItem value="standard">Standard (500 URLs)</SelectItem>
            <SelectItem value="deep">Deep (10,000 URLs)</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>

      <FieldRow label="Default landing view" desc="Where you land after an audit completes.">
        <Select value={defaultView} onValueChange={setDefaultView}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dashboard">Dashboard</SelectItem>
            <SelectItem value="issues">Issues</SelectItem>
            <SelectItem value="pages">Pages</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>

      <FieldRow label="Theme" desc="Light, dark or follow system.">
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>

      <FieldRow label="Email digest frequency" desc="Receive a summary of audit changes.">
        <Select value={digest} onValueChange={setDigest}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>

      <FieldRow label="Auto-run on schedule" desc="Re-run audits weekly for active projects.">
        <Switch checked={autoRun} onCheckedChange={setAutoRun} />
      </FieldRow>

      <FieldRow label="Anonymous usage analytics" desc="Help improve UfuqAudit by sharing usage data.">
        <Switch checked={shareAnon} onCheckedChange={setShareAnon} />
      </FieldRow>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline">Reset</Button>
        <Button className={EMERALD_BTN} onClick={() => toast.success("Preferences saved")}>
          Save preferences
        </Button>
      </div>
    </Card>
  );
}

const INITIAL_KEYS: ApiKey[] = [
  {
    id: "k1",
    name: "Production API key",
    keyMasked: "ufa_live_aBc…4242",
    createdAt: "2025-06-12",
    lastUsed: "2025-08-21",
  },
  {
    id: "k2",
    name: "CI / GitHub Actions",
    keyMasked: "ufa_live_xYz…9f3c",
    createdAt: "2025-04-02",
    lastUsed: "2025-08-22",
  },
];

function ApiKeysTab() {
  const [keys, setKeys] = React.useState<ApiKey[]>(INITIAL_KEYS);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newKeyName, setNewKeyName] = React.useState("");
  const [newKeyFull, setNewKeyFull] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  function createKey() {
    setCreating(true);
    setTimeout(() => {
      const full = genApiKey();
      const k: ApiKey = {
        id: `k${Date.now()}`,
        name: newKeyName.trim() || "Untitled key",
        keyMasked: maskKey("ufa_live", full),
        createdAt: new Date().toISOString(),
        lastUsed: null,
      };
      setKeys([k, ...keys]);
      setNewKeyFull(full);
      setCopied(false);
      setCreating(false);
    }, 500);
  }

  function revokeKey(id: string) {
    setKeys(keys.filter((k) => k.id !== id));
    toast.success("API key revoked");
  }

  async function copyKey() {
    if (!newKeyFull) return;
    try {
      await navigator.clipboard.writeText(newKeyFull);
      setCopied(true);
      toast.success("API key copied");
    } catch {
      toast.error("Clipboard unavailable — copy manually");
    }
  }

  return (
    <Card className="p-5 sm:p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">API Keys</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Use these to access UfuqAudit&apos;s REST API.
          </p>
        </div>
        <Button size="sm" className={EMERALD_BTN} onClick={() => { setCreateOpen(true); setNewKeyFull(null); setNewKeyName(""); }}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Create new key
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  No API keys yet
                </TableCell>
              </TableRow>
            )}
            {keys.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">{k.name}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{k.keyMasked}</code>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(k.createdAt)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {k.lastUsed ? formatDate(k.lastUsed) : "Never"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => revokeKey(k.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) {
            setNewKeyFull(null);
            setNewKeyName("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{newKeyFull ? "Your new API key" : "Create API key"}</DialogTitle>
          </DialogHeader>
          {newKeyFull ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Copy your new key now. For security, you won&apos;t be able to see it again.
              </p>
              <div className="flex gap-2">
                <Input readOnly value={newKeyFull} className="font-mono text-xs" />
                <Button onClick={copyKey} className={EMERALD_BTN} size="sm">
                  {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex gap-2">
                <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Treat this key like a password. Do not commit it to source control.</span>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ak-name">Name</Label>
                <Input
                  id="ak-name"
                  placeholder="e.g. Production API key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{newKeyFull ? "Done" : "Cancel"}</Button>
            </DialogClose>
            {!newKeyFull && (
              <Button className={EMERALD_BTN} onClick={createKey} disabled={creating}>
                {creating && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                Generate key
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

const INITIAL_TEAM: TeamMember[] = [
  {
    id: "t1",
    name: "Demo User",
    email: "demo@ufuqaudit.app",
    role: "Owner",
    invitedAt: "2025-01-10",
  },
  {
    id: "t2",
    name: "Aisha Khan",
    email: "aisha@ufuqtechs.com",
    role: "Admin",
    invitedAt: "2025-03-04",
  },
  {
    id: "t3",
    name: "Bilal Raza",
    email: "bilal@ufuqtechs.com",
    role: "Member",
    invitedAt: "2025-05-21",
  },
];

function TeamTab() {
  const [members, setMembers] = React.useState<TeamMember[]>(INITIAL_TEAM);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("Member");

  function invite() {
    if (!email.trim()) {
      toast.error("Enter an email to invite");
      return;
    }
    const m: TeamMember = {
      id: `t${Date.now()}`,
      name: email.split("@")[0],
      email: email.trim(),
      role,
      invitedAt: new Date().toISOString(),
    };
    setMembers([m, ...members]);
    toast.success(`Invitation sent to ${email}`);
    setEmail("");
    setRole("Member");
    setInviteOpen(false);
  }

  function remove(id: string) {
    setMembers(members.filter((m) => m.id !== id));
    toast.success("Member removed");
  }

  return (
    <Card className="p-5 sm:p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Team members</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Invite teammates and control what they can access.
          </p>
        </div>
        <Button size="sm" className={EMERALD_BTN} onClick={() => setInviteOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Invite member
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Invited</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs font-semibold">
                        {m.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      m.role === "Owner"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : m.role === "Admin"
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                    }
                  >
                    {m.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(m.invitedAt)}</TableCell>
                <TableCell className="text-right">
                  {m.role !== "Owner" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => remove(m.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a teammate</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="iv-email">Email</Label>
              <Input
                id="iv-email"
                type="email"
                placeholder="teammate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Member">Member</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button className={EMERALD_BTN} onClick={invite}>
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function NotificationsTab() {
  const [settings, setSettings] = React.useState({
    auditComplete: true,
    criticalIssue: true,
    weeklyDigest: true,
    monthlyReport: false,
    billing: true,
  });

  function update<K extends keyof typeof settings>(k: K, v: boolean) {
    setSettings({ ...settings, [k]: v });
  }

  const items: Array<{ key: keyof typeof settings; label: string; desc: string }> = [
    { key: "auditComplete", label: "Audit complete", desc: "When a scheduled or manual audit finishes." },
    { key: "criticalIssue", label: "Critical issue found", desc: "Immediate alert when a critical SEO/security issue is detected." },
    { key: "weeklyDigest", label: "Weekly digest", desc: "A weekly summary of score changes and new issues." },
    { key: "monthlyReport", label: "Monthly report", desc: "A downloadable PDF at the end of each month." },
    { key: "billing", label: "Billing & invoices", desc: "Receipts, payment failures, plan changes." },
  ];

  return (
    <Card className="p-5 sm:p-6 mt-4">
      <div className="divide-y">
        {items.map((it) => (
          <div
            key={it.key}
            className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
          >
            <div>
              <div className="text-sm font-medium">{it.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{it.desc}</div>
            </div>
            <Switch
              checked={settings[it.key]}
              onCheckedChange={(v) => update(it.key, v)}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-4 pt-4 border-t">
        <Button className={EMERALD_BTN} onClick={() => toast.success("Notification preferences saved")}>
          Save preferences
        </Button>
      </div>
    </Card>
  );
}
