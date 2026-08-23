"use client";

import { useAppStore } from "@/lib/store";
import { GaugeCircle, Github, Twitter, Linkedin, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as React from "react";
import { toast } from "sonner";

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { label: "Features", view: "features" as const },
      { label: "Pricing", view: "pricing" as const },
      { label: "Documentation", view: "docs" as const },
      { label: "Blog", view: "blog-public" as const },
      { label: "Changelog", view: "landing" as const },
    ],
  },
  {
    title: "Engines",
    links: [
      { label: "Technical SEO", view: "landing" as const },
      { label: "AEO", view: "landing" as const },
      { label: "GEO / AI Visibility", view: "landing" as const },
      { label: "Performance", view: "landing" as const },
      { label: "Security", view: "landing" as const },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", view: "about" as const },
      { label: "Contact", view: "about" as const },
      { label: "Careers", view: "landing" as const },
      { label: "Privacy", view: "landing" as const },
      { label: "Terms", view: "landing" as const },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "SEO Tools", view: "tools" as const },
      { label: "API Docs", view: "api-docs" as const },
      { label: "Integrations", view: "integrations" as const },
      { label: "Status", view: "landing" as const },
      { label: "Community", view: "landing" as const },
    ],
  },
];

export function Footer() {
  const { setView } = useAppStore();
  const [email, setEmail] = React.useState("");

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email");
      return;
    }
    toast.success("Subscribed!", { description: "You'll get weekly SEO tips." });
    setEmail("");
  };

  const go = (view: any) => {
    setView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="mt-auto border-t bg-muted/20">
      {/* Newsletter band */}
      <div className="border-b bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="text-xl font-bold">Get weekly SEO insights</h3>
              <p className="text-sm text-muted-foreground mt-1">Join 4,500+ marketers getting actionable SEO & AEO tips every week.</p>
            </div>
            <form onSubmit={subscribe} className="flex gap-2 w-full max-w-md">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-10"
              />
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-4">
                Subscribe <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-2">
            <button onClick={() => go("landing")} className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                <GaugeCircle className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg">UfuqAudit</span>
            </button>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              AI-powered website audit for SEO, AEO, GEO, performance & security. Find what's wrong, understand why, get the fix.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted/50 transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted/50 transition-colors" aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted/50 transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="mailto:hello@ufuqaudit.app" className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted/50 transition-colors" aria-label="Email">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => go(link.view)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} UfuqAudit. All rights reserved.</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> All systems operational
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button onClick={() => go("landing")} className="hover:text-foreground transition-colors">Privacy</button>
            <button onClick={() => go("landing")} className="hover:text-foreground transition-colors">Terms</button>
            <button onClick={() => go("landing")} className="hover:text-foreground transition-colors">Cookies</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
