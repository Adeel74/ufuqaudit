"use client";

import { useAppStore } from "@/lib/store";
import { GaugeCircle, Github, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  const { setView } = useAppStore();
  return (
    <footer className="mt-auto border-t bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
              <GaugeCircle className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm">UfuqAudit</span>
            <span className="text-xs text-muted-foreground ml-2">© {new Date().getFullYear()} — AI-Powered Website Audit</span>
          </div>
          <nav className="flex items-center gap-4 text-xs text-muted-foreground">
            <button className="hover:text-foreground transition-colors" onClick={() => setView("landing")}>Home</button>
            <button className="hover:text-foreground transition-colors" onClick={() => setView("pricing")}>Pricing</button>
            <button className="hover:text-foreground transition-colors" onClick={() => setView("reports")}>Reports</button>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground"><Github className="w-3.5 h-3.5" /></a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-foreground"><Twitter className="w-3.5 h-3.5" /></a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-foreground"><Linkedin className="w-3.5 h-3.5" /></a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
