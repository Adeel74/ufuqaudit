"use client";

import { useAppStore, ADMIN_VIEWS } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ListChecks, FileText, MessageSquare, Brain, Gauge,
  Shield, Sparkles, FileBarChart, Plug, CreditCard, Settings as SettingsIcon,
  ShieldCheck, Home, X, GaugeCircle, ChevronRight, History, Swords, Bot, Wrench,
  Search, Link2, PenLine, Network,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { useAppStore as useStore } from "@/lib/store";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, ListChecks, FileText, MessageSquare, Brain, Gauge,
  Shield, Sparkles, FileBarChart, Plug, CreditCard, Settings: SettingsIcon,
  ShieldCheck, Home, History, Swords, Bot, Wrench, Search, Link2, PenLine, Network,
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { view, setView, currentAudit, user } = useAppStore();

  const go = (v: typeof view) => {
    setView(v);
    onNavigate?.();
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r bg-sidebar h-[calc(100vh-57px)] sticky top-[57px]">
      <SidebarContent view={view} setView={go} currentAudit={currentAudit} user={user} />
    </aside>
  );
}

function SidebarContent({
  view, setView, currentAudit, user,
}: {
  view: any;
  setView: (v: any) => void;
  currentAudit: any;
  user: any;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-4 border-b shrink-0">
        <button onClick={() => setView("landing")} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
            <GaugeCircle className="w-5 h-5" />
          </div>
          <div className="font-bold text-lg tracking-tight">UfuqAudit</div>
        </button>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
        <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Audit</div>
        {ADMIN_VIEWS.filter((v) => !["admin", "settings", "billing", "integrations"].includes(v.key)).map((v) => {
          const Icon = ICONS[v.icon] || FileText;
          const active = view === v.key;
          // history, competitors, ai-chat, tools have their own data, so always enabled
          const alwaysEnabled = ["admin", "history", "competitors", "ai-chat", "tools", "keywords", "backlinks", "content", "link-graph"].includes(v.key);
          const disabled = !currentAudit && !alwaysEnabled;
          return (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              disabled={disabled}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent",
                disabled && "opacity-40 pointer-events-none"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{v.label}</span>
            </button>
          );
        })}

        <div className="px-2 pt-4 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Account</div>
        {ADMIN_VIEWS.filter((v) => ["settings", "billing", "integrations"].includes(v.key)).map((v) => {
          const Icon = ICONS[v.icon] || SettingsIcon;
          const active = view === v.key;
          return (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{v.label}</span>
            </button>
          );
        })}

        {user?.role === "admin" && (
          <>
            <div className="px-2 pt-4 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">System</div>
            {ADMIN_VIEWS.filter((v) => v.key === "admin").map((v) => {
              const Icon = ICONS[v.icon] || ShieldCheck;
              const active = view === v.key;
              return (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors",
                    active ? "bg-primary text-primary-foreground shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{v.label}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Plan card */}
      <div className="border-t p-3 shrink-0">
        <div className="rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-200/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">{user?.plan?.toUpperCase() || "FREE"} PLAN</span>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => setView("billing")}>
              Upgrade <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">10,000 URLs · 20 projects</div>
        </div>
      </div>
    </div>
  );
}
