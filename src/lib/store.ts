// UfuqAudit client store (Zustand) — view routing, current audit, auth state.

"use client";

import { create } from "zustand";
import type { AuditResult } from "./types";

export type ViewKey =
  | "landing"
  | "audit-progress"
  | "onboarding"
  | "dashboard"
  | "issues"
  | "pages"
  | "history"
  | "competitors"
  | "aeo"
  | "geo"
  | "performance"
  | "security"
  | "ai-recommendations"
  | "ai-chat"
  | "tools"
  | "keywords"
  | "backlinks"
  | "content"
  | "link-graph"
  | "scheduled"
  | "portal"
  | "search-console"
  | "email"
  | "activity"
  | "api-docs"
  | "page-editor"
  | "crawl-settings"
  | "reports"
  | "admin"
  | "settings"
  | "billing"
  | "integrations"
  | "pricing";

interface AppState {
  view: ViewKey;
  setView: (v: ViewKey) => void;

  // auth (mocked client side for demo)
  user: { email: string; name: string; role: "user" | "admin"; plan: string } | null;
  login: (email: string) => void;
  logout: () => void;

  // current audit
  currentAudit: AuditResult | null;
  setCurrentAudit: (a: AuditResult | null) => void;

  // audit history (in-memory for chart)
  auditHistory: { date: string; score: number }[];

  // sidebar collapsed (mobile)
  sidebarOpen: boolean;
  setSidebarOpen: (b: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "landing",
  setView: (v) => set({ view: v }),

  user: { email: "demo@ufuqaudit.app", name: "Demo User", role: "admin", plan: "pro" },
  login: (email) => set({ user: { email, name: email.split("@")[0], role: "admin", plan: "pro" } }),
  logout: () => set({ user: null, view: "landing" }),

  currentAudit: null,
  setCurrentAudit: (a) => set({ currentAudit: a }),

  auditHistory: [],
  sidebarOpen: false,
  setSidebarOpen: (b) => set({ sidebarOpen: b }),
}));

export const ADMIN_VIEWS: { key: ViewKey; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { key: "issues", label: "Issues", icon: "ListChecks" },
  { key: "pages", label: "Pages", icon: "FileText" },
  { key: "history", label: "Audit History", icon: "History" },
  { key: "competitors", label: "Competitors", icon: "Swords" },
  { key: "aeo", label: "AEO", icon: "MessageSquare" },
  { key: "geo", label: "GEO / AI Visibility", icon: "Brain" },
  { key: "performance", label: "Performance", icon: "Gauge" },
  { key: "security", label: "Security", icon: "Shield" },
  { key: "ai-recommendations", label: "AI Recommendations", icon: "Sparkles" },
  { key: "ai-chat", label: "AI Chat", icon: "Bot" },
  { key: "tools", label: "SEO Tools", icon: "Wrench" },
  { key: "keywords", label: "Keywords", icon: "Search" },
  { key: "backlinks", label: "Backlinks", icon: "Link2" },
  { key: "content", label: "Content", icon: "PenLine" },
  { key: "link-graph", label: "Link Graph", icon: "Network" },
  { key: "scheduled", label: "Scheduled", icon: "CalendarClock" },
  { key: "search-console", label: "Search Console", icon: "BarChart3" },
  { key: "portal", label: "Client Portal", icon: "Share2" },
  { key: "email", label: "Email Reports", icon: "Mail" },
  { key: "activity", label: "Activity", icon: "Activity" },
  { key: "api-docs", label: "API Docs", icon: "Terminal" },
  { key: "page-editor", label: "Page Editor", icon: "FileEdit" },
  { key: "crawl-settings", label: "Crawl Settings", icon: "SlidersHorizontal" },
  { key: "reports", label: "Reports", icon: "FileBarChart" },
  { key: "integrations", label: "Integrations", icon: "Plug" },
  { key: "billing", label: "Billing", icon: "CreditCard" },
  { key: "settings", label: "Settings", icon: "Settings" },
  { key: "admin", label: "Admin", icon: "ShieldCheck" },
];
