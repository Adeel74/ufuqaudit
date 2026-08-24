"use client";

import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { GaugeCircle, Menu, X, Sparkles } from "lucide-react";
import * as React from "react";

const NAV_LINKS = [
  { label: "Features", view: "features" as const },
  { label: "Pricing", view: "pricing" as const },
  { label: "Docs", view: "docs" as const },
  { label: "Blog", view: "blog-public" as const },
  { label: "About", view: "about" as const },
];

export function PublicNav() {
  const { setView } = useAppStore();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (view: any) => {
    setView(view);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? "border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm" : "bg-transparent"}`}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={() => go("landing")} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
              <GaugeCircle className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">UfuqAudit</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => go(link.view)}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => go("login")}>
              Sign in
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => go("register")}>
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Get Started
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-muted/50"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => go(link.view)}
                className="block w-full text-left px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="flex gap-2 pt-2 px-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => go("login")}>
                Sign in
              </Button>
              <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => go("register")}>
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
