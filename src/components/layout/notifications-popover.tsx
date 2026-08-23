"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Bell,
  CheckCheck,
  Settings,
  ChevronRight,
  CheckCircle,
  AlertOctagon,
  FileBarChart,
  TrendingUp,
  TrendingDown,
  Link2,
  Search,
  Info,
  type LucideIcon,
} from "lucide-react";

// ---------- Types ----------
type NotificationType =
  | "audit_complete"
  | "critical_issue"
  | "weekly_report"
  | "score_improved"
  | "score_dropped"
  | "new_backlink"
  | "keyword_lost"
  | "info";

interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: number; // unix ms
  read: boolean;
}

// ---------- Type metadata (semantic colors per spec) ----------
const TYPE_META: Record<
  NotificationType,
  { color: string; bg: string; icon: LucideIcon }
> = {
  audit_complete: { color: "#10b981", bg: "bg-emerald-100 dark:bg-emerald-950/40", icon: CheckCircle },
  critical_issue: { color: "#ef4444", bg: "bg-red-100 dark:bg-red-950/40", icon: AlertOctagon },
  weekly_report: { color: "#8b5cf6", bg: "bg-violet-100 dark:bg-violet-950/40", icon: FileBarChart },
  score_improved: { color: "#10b981", bg: "bg-emerald-100 dark:bg-emerald-950/40", icon: TrendingUp },
  score_dropped: { color: "#ef4444", bg: "bg-red-100 dark:bg-red-950/40", icon: TrendingDown },
  new_backlink: { color: "#0ea5e9", bg: "bg-sky-100 dark:bg-sky-950/40", icon: Link2 },
  keyword_lost: { color: "#f59e0b", bg: "bg-amber-100 dark:bg-amber-950/40", icon: Search },
  info: { color: "#64748b", bg: "bg-slate-100 dark:bg-slate-800/60", icon: Info },
};

const SCROLLBAR_CLS =
  "max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent";

// ---------- Mock data (deterministic — varied types + times) ----------
function createMockNotifications(now: number): AppNotification[] {
  const MIN = 60 * 1000;
  const HR = 60 * MIN;
  const DAY = 24 * HR;
  return [
    {
      id: "n1",
      type: "audit_complete",
      title: "Audit completed",
      description: "Your audit for example.com is ready to view.",
      createdAt: now - 3 * MIN,
      read: false,
    },
    {
      id: "n2",
      type: "critical_issue",
      title: "Critical issue found",
      description: "Missing meta description on /pricing page.",
      createdAt: now - 22 * MIN,
      read: false,
    },
    {
      id: "n3",
      type: "score_improved",
      title: "Score improved",
      description: "Ufuq Score for example.com went up by 4 points.",
      createdAt: now - 2 * HR,
      read: false,
    },
    {
      id: "n4",
      type: "new_backlink",
      title: "New backlink detected",
      description: "techcrunch.com linked to your /blog/scaling-postgres post.",
      createdAt: now - 5 * HR,
      read: true,
    },
    {
      id: "n5",
      type: "weekly_report",
      title: "Weekly report ready",
      description: "Your SEO performance summary for last week is available.",
      createdAt: now - 1 * DAY,
      read: true,
    },
    {
      id: "n6",
      type: "keyword_lost",
      title: "Keyword ranking dropped",
      description: "\u201caws pricing\u201d fell from position 4 to 11 on Google.",
      createdAt: now - 2 * DAY,
      read: true,
    },
    {
      id: "n7",
      type: "score_dropped",
      title: "Score dropped",
      description: "Performance score for example.com decreased by 3 points.",
      createdAt: now - 4 * DAY,
      read: true,
    },
    {
      id: "n8",
      type: "info",
      title: "New feature available",
      description: "Content Analyzer is now live — try it from the sidebar.",
      createdAt: now - 7 * DAY,
      read: true,
    },
  ];
}

// ---------- Helpers ----------
function relTime(ms: number): string {
  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  return `${mo}mo ago`;
}

// ---------- Single notification item ----------
function NotificationItem({
  n,
  onRead,
}: {
  n: AppNotification;
  onRead: (id: string) => void;
}) {
  const meta = TYPE_META[n.type];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={() => onRead(n.id)}
      className="w-full text-left flex items-start gap-2 p-2.5 rounded-lg hover:bg-muted/40 transition-colors"
    >
      {/* Unread indicator — emerald dot on the left */}
      <div className="w-2 shrink-0 self-center flex justify-center">
        {!n.read && (
          <span className="block w-2 h-2 rounded-full bg-emerald-500" aria-label="unread" />
        )}
      </div>
      {/* Type icon */}
      <span
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          meta.bg
        )}
      >
        <Icon className="w-4 h-4" style={{ color: meta.color }} />
      </span>
      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm truncate", n.read ? "font-medium text-foreground/80" : "font-semibold")}>
            {n.title}
          </p>
          <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
            {relTime(n.createdAt)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
          {n.description}
        </p>
      </div>
    </button>
  );
}

// =================== Component ===================
export function NotificationsPopover() {
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Generate mock notifications on mount (avoids SSR/CSR Date.now() mismatch).
  React.useEffect(() => {
    setMounted(true);
    setNotifications(createMockNotifications(Date.now()));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const onMarkAllRead = () => {
    if (unreadCount === 0) {
      toast.info("All caught up — no unread notifications");
      return;
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success(`Marked ${unreadCount} notification${unreadCount === 1 ? "" : "s"} as read`);
  };

  const onReadOne = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative"
          aria-label={`Notifications${mounted && unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="w-4 h-4" />
          {mounted && unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[calc(100vw-2rem)] sm:w-80 p-3"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-2.5 mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {mounted && unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold tabular-nums">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={onMarkAllRead}
              disabled={!mounted || unreadCount === 0}
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Mark all read
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => toast.info("Notification settings — coming soon")}
              aria-label="Notification settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* List */}
        {mounted && notifications.length > 0 ? (
          <div className={SCROLLBAR_CLS}>
            {notifications.map((n) => (
              <NotificationItem key={n.id} n={n} onRead={onReadOne} />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-muted flex items-center justify-center mb-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">No notifications yet</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t mt-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            onClick={() => {
              setOpen(false);
              toast.info("Opening full notifications log…");
            }}
          >
            View all notifications
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
