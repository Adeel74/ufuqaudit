"use client";

import { useAppStore, ADMIN_VIEWS } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Menu, Search, Sun, Moon, Home, Plus, ChevronDown,
} from "lucide-react";
import * as React from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { NotificationsPopover } from "@/components/layout/notifications-popover";

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { view, setView, user, currentAudit, logout } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [url, setUrl] = React.useState("");
  const [running, setRunning] = React.useState(false);

  const runAudit = async () => {
    if (!url.trim()) {
      toast.error("Enter a website URL");
      return;
    }
    setRunning(true);
    setView("audit-progress");
    try {
      const res = await fetch("/api/audit/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Audit failed");
      useAppStore.getState().setCurrentAudit(data);
      useAppStore.getState().setView("dashboard");
      toast.success(`Audit complete — Ufuq Score ${data.overallScore}/100`);
    } catch (e: any) {
      toast.error(e?.message || "Audit failed");
      setView("landing");
    } finally {
      setRunning(false);
    }
  };

  const viewLabel = ADMIN_VIEWS.find((v) => v.key === view)?.label || "Dashboard";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-[57px]">
      <div className="flex h-full items-center gap-3 px-4 sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu}>
          <Menu className="w-5 h-5" />
        </Button>

        {/* Brand on mobile */}
        <button className="lg:hidden flex items-center gap-2 font-bold" onClick={() => setView("landing")}>
          UfuqAudit
        </button>

        {/* Search / run audit */}
        <div className="hidden md:flex flex-1 max-w-xl items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runAudit()}
              placeholder="Enter a URL to audit — e.g. example.com"
              className="pl-9 pr-24 h-9"
              disabled={running}
            />
            <Button
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
              onClick={runAudit}
              disabled={running}
            >
              Run Audit
            </Button>
          </div>
        </div>

        <div className="flex-1 md:hidden" />

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2 h-9 px-2 text-muted-foreground" onClick={() => { const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: navigator.platform.includes("Win") }); window.dispatchEvent(e); }}>
            <Search className="w-3.5 h-3.5" />
            <kbd className="px-1 py-0.5 rounded border bg-muted text-[9px] font-mono">⌘K</kbd>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
            <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <NotificationsPopover />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-2 gap-2">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs">
                    {(user?.name || user?.email || "U").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">{user?.name || user?.email}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setView("settings")}>Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView("billing")}>Billing</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView("admin")}>Admin Panel</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { logout(); setView("landing"); }} className="text-red-600">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
