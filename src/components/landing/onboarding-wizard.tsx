"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  GaugeCircle, ArrowRight, ArrowLeft, Check, Sparkles, Search, Shield,
  Bot, FileBarChart, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: OnboardingStep[] = [
  { id: 1, title: "Welcome to UfuqAudit", subtitle: "AI-powered SEO, AEO & GEO auditing in 4 steps", icon: Sparkles },
  { id: 2, title: "Enter your website", subtitle: "We'll crawl it and analyze 200+ signals", icon: Search },
  { id: 3, title: "Choose audit focus", subtitle: "Pick what matters most to you right now", icon: Shield },
  { id: 4, title: "Run your first audit", subtitle: "Get scores, issues & AI fixes in ~10 seconds", icon: FileBarChart },
];

const FOCUS_OPTIONS = [
  { id: "full", label: "Full Audit", desc: "All 6 engines — SEO, AEO, GEO, Performance, Security", icon: GaugeCircle, color: "#10b981" },
  { id: "technical", label: "Technical SEO", desc: "Crawlability, indexability, schema, redirects", icon: Shield, color: "#6366f1" },
  { id: "aeo", label: "AEO / GEO", desc: "AI answer engine readiness + visibility", icon: Bot, color: "#8b5cf6" },
  { id: "performance", label: "Performance", desc: "Core Web Vitals & page weight", icon: GaugeCircle, color: "#f59e0b" },
];

export function OnboardingWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setView, setCurrentAudit } = useAppStore();
  const [step, setStep] = React.useState(0);
  const [url, setUrl] = React.useState("");
  const [focus, setFocus] = React.useState("full");
  const [running, setRunning] = React.useState(false);

  const current = STEPS[step];

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const runAudit = async () => {
    if (!url.trim()) {
      toast.error("Please enter your website URL");
      return;
    }
    setRunning(true);
    onClose();
    setView("audit-progress");
    try {
      const res = await fetch("/api/audit/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Audit failed");
      setCurrentAudit(data);
      setView("dashboard");
      toast.success(`Audit complete — Ufuq Score ${data.overallScore}/100`);
    } catch (e: any) {
      toast.error(e?.message || "Audit failed");
      setView("landing");
    } finally {
      setRunning(false);
    }
  };

  const handleClose = () => {
    if (running) return;
    onClose();
    setStep(0);
    setUrl("");
    setFocus("full");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <current.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium opacity-80">Step {step + 1} of {STEPS.length}</p>
              <h2 className="text-lg font-bold">{current.title}</h2>
            </div>
          </div>
          <p className="text-sm opacity-90">{current.subtitle}</p>

          {/* Progress bar */}
          <div className="mt-4 h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                UfuqAudit analyzes your website across <strong>6 engines</strong> — Technical SEO, Content, AEO, GEO/AI Visibility, Performance & Security — then hands you a prioritized action plan with AI-generated fixes.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { l: "216+", d: "Checks" },
                  { l: "6", d: "Engines" },
                  { l: "~10s", d: "Per audit" },
                ].map((s) => (
                  <div key={s.d} className="rounded-lg border bg-muted/30 p-3 text-center">
                    <div className="text-lg font-bold text-emerald-600">{s.l}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{s.d}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                This quick wizard takes ~30 seconds. You can skip it any time.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Your website URL</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && next()}
                    placeholder="https://yourwebsite.com"
                    className="pl-9 h-11"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  We&apos;ll crawl up to 50 pages (free plan). No signup required.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {["https://example.com", "https://stripe.com", "https://vercel.com", "https://shopify.com"].map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setUrl(ex)}
                    className="text-left text-xs px-3 py-2 rounded-lg border bg-card hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-colors truncate"
                  >
                    {ex.replace("https://", "")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">
                Pick a focus area. (You can always run a full audit later.)
              </p>
              {FOCUS_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFocus(opt.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                    focus === opt.id
                      ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                      : "border-border hover:border-emerald-500/30 hover:bg-muted/30"
                  )}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${opt.color}15`, color: opt.color }}
                  >
                    <opt.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{opt.label}</span>
                      {focus === opt.id && (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/30 p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Website</span>
                  <span className="font-medium truncate max-w-[200px]">{url || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Focus</span>
                  <span className="font-medium capitalize">{FOCUS_OPTIONS.find((f) => f.id === focus)?.label || "Full"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pages</span>
                  <span className="font-medium">Up to 50 (free)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. time</span>
                  <span className="font-medium">~10 seconds</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Ready to find what&apos;s hurting your website? 🚀
              </p>
            </div>
          )}

          {/* Footer nav */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={step === 0 ? handleClose : prev}
              disabled={running}
              className="text-muted-foreground"
            >
              {step === 0 ? "Skip" : <><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back</>}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                size="sm"
                onClick={next}
                disabled={step === 1 && !url.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Continue <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={runAudit}
                disabled={running || !url.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Run Audit
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
