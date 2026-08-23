"use client";

import * as React from "react";
import { useAppStore, ADMIN_VIEWS, type ViewKey } from "@/lib/store";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import {
  LayoutDashboard, ListChecks, FileText, MessageSquare, Brain, Gauge,
  Shield, Sparkles, FileBarChart, Plug, CreditCard, Settings as SettingsIcon,
  ShieldCheck, History, Swords, Bot, Wrench, Search, Link2, PenLine, Network,
  CalendarClock, Share2, Home, Zap, ArrowRight, CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, ListChecks, FileText, MessageSquare, Brain, Gauge,
  Shield, Sparkles, FileBarChart, Plug, CreditCard, Settings: SettingsIcon,
  ShieldCheck, History, Swords, Bot, Wrench, Search, Link2, PenLine, Network,
  CalendarClock, Share2, Home,
};

const ACTIONS: { id: string; label: string; hint: string; view?: ViewKey; icon: string; keywords?: string }[] = [
  { id: "go-dashboard", label: "Dashboard", hint: "Go to dashboard", view: "dashboard", icon: "LayoutDashboard", keywords: "home overview score" },
  { id: "go-issues", label: "Issues", hint: "View all audit issues", view: "issues", icon: "ListChecks", keywords: "problems errors warnings" },
  { id: "go-pages", label: "Pages", hint: "View crawled pages", view: "pages", icon: "FileText", keywords: "urls crawled" },
  { id: "go-history", label: "Audit History", hint: "Past audits + trends", view: "history", icon: "History", keywords: "trend past compare" },
  { id: "go-competitors", label: "Competitors", hint: "Compare with competitors", view: "competitors", icon: "Swords", keywords: "compare vs battle" },
  { id: "go-aeo", label: "AEO", hint: "Answer Engine Optimization", view: "aeo", icon: "MessageSquare", keywords: "answer chatgpt perplexity" },
  { id: "go-geo", label: "GEO / AI Visibility", hint: "AI visibility score", view: "geo", icon: "Brain", keywords: "ai visibility citation" },
  { id: "go-performance", label: "Performance", hint: "Core Web Vitals", view: "performance", icon: "Gauge", keywords: "lcp inp cls speed" },
  { id: "go-security", label: "Security", hint: "HTTPS + headers", view: "security", icon: "Shield", keywords: "ssl https headers" },
  { id: "go-ai-recos", label: "AI Recommendations", hint: "Generate AI fixes", view: "ai-recommendations", icon: "Sparkles", keywords: "fix generate ai" },
  { id: "go-ai-chat", label: "AI Chat", hint: "Ask the AI assistant", view: "ai-chat", icon: "Bot", keywords: "ask question chat" },
  { id: "go-tools", label: "SEO Tools", hint: "Generators + checkers", view: "tools", icon: "Wrench", keywords: "meta robots schema sitemap" },
  { id: "go-keywords", label: "Keywords", hint: "Keyword rank tracker", view: "keywords", icon: "Search", keywords: "rank serp position" },
  { id: "go-backlinks", label: "Backlinks", hint: "Backlink monitor", view: "backlinks", icon: "Link2", keywords: "links domain authority" },
  { id: "go-content", label: "Content Analyzer", hint: "Readability + keyword density", view: "content", icon: "PenLine", keywords: "readability flesch words" },
  { id: "go-link-graph", label: "Link Graph", hint: "Internal link visualization", view: "link-graph", icon: "Network", keywords: "node graph architecture" },
  { id: "go-scheduled", label: "Scheduled Audits", hint: "Recurring audit schedules", view: "scheduled", icon: "CalendarClock", keywords: "schedule recurring automatic" },
  { id: "go-portal", label: "Client Portal", hint: "Shareable branded links", view: "portal", icon: "Share2", keywords: "share client white label" },
  { id: "go-reports", label: "Reports", hint: "PDF + white-label reports", view: "reports", icon: "FileBarChart", keywords: "pdf export white label" },
  { id: "go-billing", label: "Billing", hint: "Plan + usage", view: "billing", icon: "CreditCard", keywords: "plan payment invoice" },
  { id: "go-settings", label: "Settings", hint: "Profile + preferences", view: "settings", icon: "Settings", keywords: "profile api team" },
  { id: "go-integrations", label: "Integrations", hint: "GSC, GA4, Slack", view: "integrations", icon: "Plug", keywords: "google analytics slack" },
  { id: "go-admin", label: "Admin Panel", hint: "System admin", view: "admin", icon: "ShieldCheck", keywords: "users system logs" },
  { id: "go-pricing", label: "Pricing", hint: "View plans", view: "pricing", icon: "CreditCard", keywords: "plans price upgrade" },
  { id: "go-landing", label: "Home / Landing", hint: "Back to landing page", view: "landing", icon: "Home", keywords: "marketing hero" },
  { id: "action-new-audit", label: "Run New Audit", hint: "Enter a URL to audit", view: "landing", icon: "Zap", keywords: "run start crawl audit new" },
];

export function CommandPalette() {
  const { setView, currentAudit } = useAppStore();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Global Cmd+K / Ctrl+K shortcut
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  // Filter actions
  const filtered = React.useMemo(() => {
    if (!query.trim()) return ACTIONS;
    const q = query.toLowerCase();
    return ACTIONS.filter((a) =>
      a.label.toLowerCase().includes(q) ||
      a.hint.toLowerCase().includes(q) ||
      (a.keywords || "").toLowerCase().includes(q)
    );
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const action = filtered[activeIndex];
      if (action) {
        if (action.view) {
          setView(action.view);
          setOpen(false);
        }
      }
    }
  };

  // Scroll active item into view
  React.useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden top-[15%] translate-y-0">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search views, actions, or type a command…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border bg-muted text-[10px] text-muted-foreground font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto p-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {query.trim() && (
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {filtered.length} result{filtered.length === 1 ? "" : "s"}
                </div>
              )}
              {filtered.map((action, idx) => {
                const Icon = ICONS[action.icon] || FileText;
                const active = idx === activeIndex;
                return (
                  <button
                    key={action.id}
                    data-idx={idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      if (action.view) {
                        setView(action.view);
                        setOpen(false);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      active ? "bg-emerald-500/10 text-emerald-700" : "hover:bg-muted/50"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", active ? "text-emerald-600" : "text-muted-foreground")} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{action.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{action.hint}</div>
                    </div>
                    {active && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border bg-background font-mono">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border bg-background font-mono">↵</kbd> select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <ArrowRight className="w-2.5 h-2.5" /> UfuqAudit Command
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
