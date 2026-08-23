"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

// ----- Scrollbar utility (consistent across admin portal) -----
export const SCROLLBAR_CLS =
  "overflow-y-auto [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent";

// ----- Brand button color (emerald — NO indigo/blue primary) -----
export const EMERALD_BTN = "bg-emerald-600 hover:bg-emerald-700 text-white";

// ----- API response shapes -----
export interface AdminStats {
  counts: {
    users: number;
    audits: number;
    projects: number;
    issues: number;
    pages: number;
    recommendations: number;
    activeUsers: number;
    usersToday: number;
    usersThisMonth: number;
    totalApiRequests: number;
    aiTokensUsed: number;
    monthlyRevenue: number;
    annualRevenue: number;
    activeSubscriptions: number;
    trialUsers: number;
    cancelledSubscriptions: number;
    failedPayments: number;
  };
  avgScore: number;
  recentAudits: Array<{
    id: string;
    url: string;
    overallScore: number;
    status: string;
    createdAt: string;
    user: string | null;
  }>;
  planDistribution: Array<{ plan: string; count: number }>;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

export interface OrgRow {
  id: string;
  name: string;
  domain: string;
  industry: string;
  country: string;
  members: number;
  plan: string;
  status: "active" | "suspended";
  projects: number;
  websites: number;
  audits: number;
  apiRequests: number;
  aiTokens: number;
  createdAt: string;
  lastActive: string;
}

export interface OrgStats {
  total: number;
  active: number;
  suspended: number;
  totalMembers: number;
  totalProjects: number;
  totalWebsites: number;
  totalAudits: number;
}

export interface PlanConfig {
  id: string;
  name: string;
  internalId: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  trialDays: number;
  status: "active" | "archived";
  featured: boolean;
  displayOrder: number;
  limits: {
    projects: number;
    websites: number;
    urlsPerCrawl: number;
    monthlyAudits: number;
    scheduledAudits: number;
    teamMembers: number;
    apiRequests: number;
    apiRateLimit: number;
    aiRequests: number;
    aiCredits: number;
    pdfReports: number;
    whiteLabel: boolean;
    competitorAudits: number;
    gscIntegration: boolean;
    ga4Integration: boolean;
    aeo: boolean;
    geo: boolean;
    aiVisibility: boolean;
    keywordTracking: number;
    clientAccounts: number;
  };
}

export interface SubRow {
  id: string;
  user: string;
  email: string;
  org: string;
  plan: string;
  amount: number;
  cycle: string;
  status: "trial" | "active" | "past_due" | "cancelled";
  createdAt: string;
  renewalDate: string;
  trialEnds: string | null;
}

export interface SubStats {
  total: number;
  active: number;
  trial: number;
  pastDue: number;
  cancelled: number;
  mrr: number;
  arr: number;
}

export interface TxRow {
  id: string;
  user: string;
  email: string;
  org: string;
  plan: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  date: string;
}

export interface TxStats {
  total: number;
  totalRevenue: number;
  refunds: number;
  failed: number;
  netRevenue: number;
  mrr: number;
}

export interface AuditRow {
  id: string;
  url: string;
  user: string;
  userName: string;
  overallScore: number;
  status: string;
  pagesCrawled: number;
  issuesCount: number;
  criticalCount: number;
  duration: number;
  started: string;
  completed: string | null;
}

export interface AuditStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
}

export interface ApiKeyRow {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string | null;
  requests: number;
  status: "active" | "revoked";
}

// ----- Formatters -----
export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateLong(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return formatDateLong(iso);
}

export function formatCompact(n: number): string {
  if (n == null || isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatNumber(n: number): string {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("en-US");
}

export function formatCurrency(n: number, currency = "USD"): string {
  if (n == null || isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${n}`;
  }
}

export function formatDuration(seconds: number): string {
  if (seconds == null || isNaN(seconds)) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

// ----- Badge helpers -----
export function planBadgeClass(plan: string): string {
  const map: Record<string, string> = {
    free: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
    starter: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    pro: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    agency: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  };
  return map[plan?.toLowerCase()] ?? map.free;
}

export function roleBadgeClass(role: string): string {
  return role === "admin"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
    : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700";
}

export function scoreTextColor(v: number): string {
  return v >= 80
    ? "text-emerald-600 dark:text-emerald-400"
    : v >= 60
      ? "text-amber-600 dark:text-amber-400"
      : v >= 40
        ? "text-orange-600 dark:text-orange-400"
        : "text-red-600 dark:text-red-400";
}

export function scoreHex(v: number): string {
  return v >= 80 ? "#10b981" : v >= 60 ? "#f59e0b" : v >= 40 ? "#f97316" : "#ef4444";
}

export function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    done: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    trial: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    running: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
    past_due: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
    pastdue: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
    failed: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
    cancelled: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
    suspended: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
    refunded: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
    revoked: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
    archived: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
  };
  return map[status?.toLowerCase()] ?? map.archived;
}

export function providerBadgeClass(provider: string): string {
  const p = (provider || "").toLowerCase();
  if (p === "stripe")
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
  if (p === "paddle")
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
  if (p === "paypal")
    return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800";
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700";
}

// ----- Misc helpers -----
export function initials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase() || email.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function maskKey(key: string): string {
  if (!key) return "—";
  if (key.length < 16) return key;
  const head = key.slice(0, 12);
  const tail = key.slice(-4);
  return `${head}${"•".repeat(8)}${tail}`;
}

export function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function downloadCsv(rows: Array<Record<string, string | number | null>>, filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const body = rows
    .map((r) =>
      headers
        .map((h) => {
          const v = r[h];
          const s = v == null ? "" : String(v);
          return `"${s.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\n");
  const csv = `${headers.join(",")}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ----- Shared UI atoms -----
export function SkeletonRows({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 py-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((__, j) => (
            <Skeleton key={j} className="h-8 w-full rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ msg, icon: Icon }: { msg: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="text-center py-10">
      <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
        {Icon ? <Icon className="w-5 h-5 text-muted-foreground" /> : <AlertCircle className="w-5 h-5 text-muted-foreground" />}
      </div>
      <p className="text-sm text-muted-foreground">{msg}</p>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`capitalize ${statusBadgeClass(status)}`}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
