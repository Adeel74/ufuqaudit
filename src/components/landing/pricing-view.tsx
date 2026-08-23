"use client";

import { useAppStore } from "@/lib/store";
import { PLAN_TIERS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ArrowLeft, Zap, Star } from "lucide-react";
import { toast } from "sonner";

export function PricingView() {
  const { setView } = useAppStore();
  const [annual, setAnnual] = useBilling();

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <button onClick={() => setView("landing")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>

        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">Plans for every team</h1>
          <p className="mt-3 text-muted-foreground">Start free. Upgrade when you need more URLs, GSC, white-label reports or API.</p>

          {/* Billing toggle */}
          <div className="mt-6 inline-flex items-center gap-3 p-1 rounded-full bg-muted">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!annual ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >Monthly</button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${annual ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >Annual <span className="text-emerald-600">-17%</span></button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAN_TIERS.map((t) => {
            const price = annual ? Math.round(t.priceYearly / 12) : t.priceMonthly;
            return (
              <div
                key={t.id}
                className={`relative rounded-2xl border bg-card p-6 flex flex-col ${t.popular ? "border-emerald-500 shadow-lg ring-1 ring-emerald-500/20" : ""}`}
              >
                {t.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase flex items-center gap-1">
                    <Star className="w-3 h-3" /> Most popular
                  </span>
                )}
                <div className="text-sm font-semibold text-muted-foreground">{t.name}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${price}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                {annual && t.priceMonthly > 0 && (
                  <div className="text-xs text-emerald-600 mt-1">Billed ${t.priceYearly}/year</div>
                )}
                <div className="mt-3 text-xs text-muted-foreground min-h-[36px]">
                  {t.urlLimit.toLocaleString()} URLs · {t.projectLimit} {t.projectLimit === 1 ? "project" : "projects"}
                </div>

                <Button
                  className="mt-5 w-full"
                  variant={t.popular ? "default" : "outline"}
                  onClick={() => { toast.success(`Selected ${t.name} plan — checkout coming soon`); setView("billing"); }}
                >
                  {t.cta}
                </Button>

                <ul className="mt-6 space-y-2.5 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* FAQ-ish extra */}
        <div className="mt-16 grid md:grid-cols-3 gap-4">
          {[
            { i: Zap, t: "No credit card to start", d: "Run your first audit free, no signup wall." },
            { i: Sparkles, t: "Cancel anytime", d: "Monthly plans, no lock-in. Keep your audit history." },
            { i: Star, t: "Agency white-label", d: "Custom branding, client logins & API on the Agency plan." },
          ].map((c) => (
            <div key={c.t} className="rounded-xl border bg-card p-5">
              <c.i className="w-5 h-5 text-emerald-600 mb-2" />
              <div className="font-semibold text-sm">{c.t}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// tiny inline hook (kept local)
import * as React from "react";
function useBilling(): [boolean, (v: boolean) => void] {
  const [annual, setAnnual] = React.useState(false);
  return [annual, setAnnual];
}
