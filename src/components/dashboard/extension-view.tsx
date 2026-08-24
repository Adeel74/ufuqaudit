"use client";

import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Chrome, Search, AlertCircle, ArrowRight, Shield, FileText,
  Download, CheckCircle2, Link2, Zap, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { num: "1", title: "Download the extension", desc: "Get the UfuqLink Chrome Extension files from our GitHub repository or download the ZIP." },
  { num: "2", title: "Open Chrome Extensions", desc: "Navigate to chrome://extensions/ in your Chrome browser." },
  { num: "3", title: "Enable Developer Mode", desc: "Toggle 'Developer mode' in the top-right corner of the Extensions page." },
  { num: "4", title: "Load unpacked", desc: "Click 'Load unpacked' and select the chrome-extension folder you downloaded." },
  { num: "5", title: "Pin & scan", desc: "Pin UfuqLink to your toolbar and click it on any page to scan links instantly." },
];

const FEATURES = [
  { icon: Search, title: "Instant Link Scan", desc: "Extract all links from any page in 1 click", color: "#6366f1" },
  { icon: AlertCircle, title: "Broken Link Detection", desc: "Find 404s, 500s, and redirect loops", color: "#ef4444" },
  { icon: ArrowRight, title: "Redirect Analysis", desc: "Track redirect chains and hops", color: "#f59e0b" },
  { icon: FileText, title: "Anchor Analysis", desc: "Detect generic & empty anchor text", color: "#10b981" },
  { icon: Shield, title: "SEO Checks", desc: "Rel attributes, HTTPS, canonical, robots", color: "#06b6d4" },
  { icon: Link2, title: "Internal vs External", desc: "Automatic link classification", color: "#8b5cf6" },
  { icon: Download, title: "CSV Export", desc: "Export link data for reporting", color: "#ec4899" },
  { icon: Sparkles, title: "SEO Score", desc: "Per-page score based on link health", color: "#10b981" },
];

export function ExtensionView() {
  const { setView } = useAppStore();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <Card className="p-8 sm:p-12 bg-gradient-to-br from-emerald-50/50 via-teal-50/50 to-background dark:from-emerald-950/10 dark:via-teal-950/10 border-emerald-200/50 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-medium mb-4">
          <Chrome className="w-3.5 h-3.5" /> Chrome Extension
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold">
          UfuqLink — <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">SEO Link Checker</span>
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          Instantly find broken links, redirects, SEO issues, anchor text problems, and more — directly from your browser. Free Chrome extension.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => toast.success("Downloading UfuqLink extension...", { description: "Check your downloads folder" })}>
            <Download className="w-4 h-4 mr-1" /> Download Extension
          </Button>
          <Button size="lg" variant="outline" onClick={() => setView("ufuqlink")}>
            <Zap className="w-4 h-4 mr-1" /> Try In-App Scanner
          </Button>
        </div>
      </Card>

      {/* Features grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map((f) => (
          <Card key={f.title} className="p-4 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${f.color}15`, color: f.color }}>
              <f.icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm">{f.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
          </Card>
        ))}
      </div>

      {/* Install instructions */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-1">Installation Guide</h2>
        <p className="text-sm text-muted-foreground mb-6">5 simple steps to start scanning pages</p>
        <div className="space-y-4">
          {STEPS.map((step) => (
            <div key={step.num} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {step.num}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* CTA */}
      <Card className="p-6 bg-gradient-to-br from-violet-50/50 to-emerald-50/50 dark:from-violet-950/10 dark:to-emerald-950/10 border-violet-200/50">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">UfuqLink scans one page. UfuqAudit scans your entire website.</h3>
            <p className="text-sm text-muted-foreground mt-1">The extension is your free lead-gen tool. When you need a full audit with 200+ checks across all pages, escalate to UfuqAudit.</p>
            <Button size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setView("landing")}>
              Run Full Website Audit <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
