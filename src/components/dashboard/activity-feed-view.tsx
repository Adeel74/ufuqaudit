"use client";

import * as React from "react";
import { ViewHeader, StatCard } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity, Search, Loader2, AlertCircle, FileText, Gauge,
  Users, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------- Types ----------
type ActivityCategory =
  | "audit"
  | "report"
  | "keyword"
  | "backlink"
  | "team"
  | "settings"
  | "integration";

interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  targetType: string;
  targetName: string;
  description: string;
  timestamp: string;
  category: ActivityCategory;
}

interface ActivityResponse {
  activities: ActivityItem[];
  total: number;
}

// ---------- Constants ----------
const EMERALD_BTN = "bg-emerald-600 hover:bg-emerald-700 text-white";

const SCROLLBAR_CLS =
  "max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent";

// Category → color (badge background + text + dot/line color)
const CATEGORY_META: Record<
  ActivityCategory,
  { label: string; badge: string; dot: string }
> = {
  audit: {
    label: "Audit",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    dot: "#10b981",
  },
  report: {
    label: "Report",
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
    dot: "#8b5cf6",
  },
  keyword: {
    label: "Keyword",
    badge:
      "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400",
    dot: "#0ea5e9",
  },
  backlink: {
    label: "Backlink",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    dot: "#f59e0b",
  },
  team: {
    label: "Team",
    badge:
      "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400",
    dot: "#14b8a6",
  },
  settings: {
    label: "Settings",
    badge:
      "bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
    dot: "#64748b",
  },
  integration: {
    label: "Integration",
    badge:
      "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
    dot: "#f43f5e",
  },
};

// Filter pills
const FILTER_OPTIONS: { key: "all" | ActivityCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "audit", label: "Audits" },
  { key: "report", label: "Reports" },
  { key: "keyword", label: "Keywords" },
  { key: "backlink", label: "Backlinks" },
  { key: "team", label: "Team" },
  { key: "settings", label: "Settings" },
  { key: "integration", label: "Integrations" },
];

// Avatar color palette (no indigo/blue primary — uses emerald, teal, amber,
// rose, violet, sky as distinct hues for the seeded-by-name assignment)
const AVATAR_COLORS = [
  "#10b981", // emerald
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#8b5cf6", // violet
  "#0ea5e9", // sky
  "#ec4899", // pink
  "#84cc16", // lime
];

// ---------- Helpers ----------
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function userColor(name: string): string {
  return AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length];
}

function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  if (diff < 0) return "just now";
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// Split description so targetName becomes bold.
function renderDescription(item: ActivityItem): React.ReactNode {
  const { description, targetName } = item;
  if (!targetName) return description;
  const idx = description.indexOf(targetName);
  if (idx < 0) return description;
  return (
    <>
      {description.slice(0, idx)}
      <span className="font-semibold text-foreground">{targetName}</span>
      {description.slice(idx + targetName.length)}
    </>
  );
}

// =================== Component ===================
export function ActivityFeedView() {
  const [items, setItems] = React.useState<ActivityItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [category, setCategory] = React.useState<"all" | ActivityCategory>("all");
  const [search, setSearch] = React.useState("");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/activity", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as ActivityResponse;
      setItems(Array.isArray(j.activities) ? j.activities : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load activity feed";
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------- Derived stats ----------
  const total = items.length;
  const auditCount = items.filter((i) => i.category === "audit").length;
  const reportCount = items.filter((i) => i.category === "report").length;
  const teamCount = items.filter((i) => i.category === "team").length;

  // ---------- Filtered list ----------
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((i) => (category === "all" ? true : i.category === category))
      .filter((i) => {
        if (!q) return true;
        return (
          i.userName.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.targetName.toLowerCase().includes(q) ||
          i.action.toLowerCase().includes(q)
        );
      })
      .slice()
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }, [items, category, search]);

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="Team Activity"
          subtitle="Recent actions across your workspace"
          icon={Activity}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ---------- Error ----------
  if (error) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="Team Activity"
          subtitle="Recent actions across your workspace"
          icon={Activity}
          actions={
            <Button size="sm" className={EMERALD_BTN} onClick={fetchData}>
              <Loader2 className="w-3.5 h-3.5 mr-1" /> Retry
            </Button>
          }
        />
        <Card className="p-10 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-3" />
          <p className="text-sm text-muted-foreground mb-1">
            Couldn’t load activity feed
          </p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Team Activity"
        subtitle="Recent actions across your workspace"
        icon={Activity}
      />

      {/* ---------- Stat cards ---------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Activities"
          value={total}
          hint="All-time workspace actions"
          icon={Activity}
          color="#10b981"
        />
        <StatCard
          label="Audits Run"
          value={auditCount}
          hint="Scheduled + on-demand"
          icon={Gauge}
          color="#10b981"
        />
        <StatCard
          label="Reports Generated"
          value={reportCount}
          hint="PDF + portal shares"
          icon={FileText}
          color="#8b5cf6"
        />
        <StatCard
          label="Team Actions"
          value={teamCount}
          hint="Invites + role changes"
          icon={Users}
          color="#14b8a6"
        />
      </div>

      {/* ---------- Filter bar ---------- */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTER_OPTIONS.map((opt) => {
              const active = category === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setCategory(opt.key)}
                  aria-pressed={active}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                    active
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="relative sm:ml-auto sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search activity…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
      </Card>

      {/* ---------- Activity timeline ---------- */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-semibold">Timeline</h3>
          </div>
          <Badge variant="outline" className="font-mono text-[11px]">
            {filtered.length} shown
          </Badge>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
              <Activity className="w-5 h-5 text-muted-foreground opacity-50" />
            </div>
            <p className="text-sm text-muted-foreground">
              {items.length === 0
                ? "No activity in this workspace yet"
                : "No activities match your filters"}
            </p>
            {(search || category !== "all") && (
              <Button
                size="sm"
                variant="ghost"
                className="mt-3 text-emerald-700 dark:text-emerald-400"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <ol className={cn("relative", SCROLLBAR_CLS)}>
            {/* Vertical connector line — runs through all rows on the left. */}
            <div className="absolute left-[18px] top-2 bottom-2 w-px bg-border" aria-hidden />
            <div className="space-y-1">
              {filtered.map((item) => {
                const cat = CATEGORY_META[item.category];
                const color = userColor(item.userName);
                return (
                  <li
                    key={item.id}
                    className="group relative flex gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    {/* Avatar with colored ring — sits on top of the connector line */}
                    <div className="relative shrink-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-background"
                        style={{ backgroundColor: color }}
                      >
                        {item.userAvatar}
                      </div>
                      {/* Category dot — anchored to avatar bottom-right */}
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-background"
                        style={{ backgroundColor: cat.dot }}
                        aria-hidden
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm">
                            <span className="font-semibold text-foreground">
                              {item.userName}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {renderDescription(item)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                                cat.badge,
                              )}
                            >
                              {cat.label}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {relTime(item.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </div>
          </ol>
        )}
      </Card>
    </div>
  );
}
