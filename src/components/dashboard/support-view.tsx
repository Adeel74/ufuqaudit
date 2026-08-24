"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  LifeBuoy, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle,
  Send, ChevronRight, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  subject: string;
  user: string;
  email: string;
  org: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "pending" | "in_progress" | "resolved" | "closed";
  category: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  messages: { from: "user" | "agent"; text: string; timestamp: string }[];
}

const PRIORITY_META = {
  urgent: { label: "Urgent", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
  high: { label: "High", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
  medium: { label: "Medium", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  low: { label: "Low", color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-950/30" },
};

const STATUS_META = {
  open: { label: "Open", color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/30" },
  in_progress: { label: "In Progress", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  pending: { label: "Pending", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
  resolved: { label: "Resolved", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  closed: { label: "Closed", color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-950/30" },
};

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function SupportView() {
  const { user } = useAppStore();
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<Ticket | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [newSubject, setNewSubject] = React.useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newCategory, setNewCategory] = useState("Bug");

  React.useEffect(() => {
    fetch("/api/admin/tickets")
      .then((r) => r.json())
      .then((d) => { setTickets(d.tickets || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return t.subject.toLowerCase().includes(q) || t.user.toLowerCase().includes(q) || t.email.toLowerCase().includes(q);
    }
    return true;
  });

  const openCount = tickets.filter((t) => t.status === "open").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;
  const urgentCount = tickets.filter((t) => t.priority === "urgent").length;

  const createTicket = () => {
    if (!newSubject.trim() || !newMessage.trim()) { toast.error("Subject and message are required"); return; }
    const ticket: Ticket = {
      id: `tk_${Date.now()}`,
      subject: newSubject,
      user: user?.name || "You",
      email: user?.email || "you@example.com",
      org: "Your Organization",
      priority: newPriority as any,
      status: "open",
      category: newCategory,
      assignedTo: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [{ from: "user", text: newMessage, timestamp: new Date().toISOString() }],
    };
    setTickets([ticket, ...tickets]);
    setShowCreate(false);
    setNewSubject(""); setNewMessage(""); setNewPriority("medium"); setNewCategory("Bug");
    toast.success("Ticket created — we'll respond within 2 hours");
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Support"
        subtitle="Get help, track tickets & view conversations"
        icon={LifeBuoy}
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowCreate(true)}><Plus className="w-3.5 h-3.5 mr-1" /> New Ticket</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Tickets" value={tickets.length} icon={MessageSquare} color="#6366f1" />
        <StatCard label="Open" value={openCount} icon={AlertCircle} color="#0ea5e9" />
        <StatCard label="Urgent" value={urgentCount} icon={AlertCircle} color="#ef4444" />
        <StatCard label="Resolved" value={resolvedCount} icon={CheckCircle2} color="#10b981" />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets..." className="pl-9 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets table */}
      <Card className="p-0 overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="min-w-[200px]">Subject</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="zebra">
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No tickets found</TableCell></TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer hover:bg-accent/40" onClick={() => setSelected(t)}>
                    <TableCell>
                      <div className="font-medium text-sm">{t.subject}</div>
                      <div className="text-xs text-muted-foreground">#{t.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{t.user}</div>
                      <div className="text-xs text-muted-foreground">{t.email}</div>
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", PRIORITY_META[t.priority].bg, PRIORITY_META[t.priority].color)}>
                        {PRIORITY_META[t.priority].label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", STATUS_META[t.status].bg, STATUS_META[t.status].color)}>
                        {STATUS_META[t.status].label}
                      </span>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{t.category}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{relTime(t.updatedAt)}</TableCell>
                    <TableCell><ChevronRight className="w-4 h-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Ticket detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg">{selected.subject}</SheetTitle>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", PRIORITY_META[selected.priority].bg, PRIORITY_META[selected.priority].color)}>
                    {PRIORITY_META[selected.priority].label}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_META[selected.status].bg, STATUS_META[selected.status].color)}>
                    {STATUS_META[selected.status].label}
                  </span>
                  <Badge variant="outline" className="text-xs">{selected.category}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {selected.user} · {selected.email} · Created {relTime(selected.createdAt)}
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {selected.messages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.from === "user" ? "justify-start" : "justify-end")}>
                    <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                      msg.from === "user" ? "bg-muted rounded-bl-sm" : "bg-emerald-600 text-white rounded-br-sm")}>
                      <p className="leading-relaxed">{msg.text}</p>
                      <p className={cn("text-[10px] mt-1", msg.from === "user" ? "text-muted-foreground" : "text-emerald-100")}>
                        {msg.from === "user" ? selected.user : "Support Agent"} · {relTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-2">
                <Textarea placeholder="Type a reply..." className="flex-1" rows={2} />
                <Button size="icon" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create ticket dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreate(false)}>
          <Card className="p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">New Support Ticket</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Subject</label>
                <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Briefly describe the issue" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bug">Bug</SelectItem>
                      <SelectItem value="How-to">How-to</SelectItem>
                      <SelectItem value="Billing">Billing</SelectItem>
                      <SelectItem value="Integration">Integration</SelectItem>
                      <SelectItem value="Feature Request">Feature Request</SelectItem>
                      <SelectItem value="API">API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Priority</label>
                  <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Message</label>
                <Textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Describe your issue in detail..." rows={4} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={createTicket}>Create Ticket</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// useState shim for textarea value
function useState(initial: string) {
  return React.useState(initial);
}
