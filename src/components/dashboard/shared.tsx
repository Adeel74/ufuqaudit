"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import type { AuditResult, IssueData, Severity, Category } from "@/lib/types";
import { SEVERITY_META, CATEGORY_META } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlertOctagon, AlertTriangle, AlertCircle, Lightbulb,
} from "lucide-react";

// Title strip for each dashboard view
export function ViewHeader({ title, subtitle, icon: Icon, actions }: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function useAudit(): AuditResult | null {
  return useAppStore((s) => s.currentAudit);
}

export function EmptyAudit({ msg = "Run an audit first" }: { msg?: string }) {
  const setView = useAppStore((s) => s.setView);
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">{msg}</p>
      <button onClick={() => setView("landing")} className="text-sm font-medium text-primary hover:underline">Run an audit →</button>
    </div>
  );
}

export function StatCard({
  label, value, hint, color, icon: Icon,
}: {
  label: string; value: React.ReactNode; hint?: string; color?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      </div>
      <div className="mt-1.5 text-2xl font-bold tabular-nums" style={color ? { color } : undefined}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const meta = SEVERITY_META[severity];
  const Icon = severity === "critical" ? AlertOctagon : severity === "error" ? AlertTriangle : severity === "warning" ? AlertCircle : Lightbulb;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium", meta.bg, meta.color)}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

export function CategoryChip({ category }: { category: Category }) {
  const meta = CATEGORY_META[category];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
      {meta.label}
    </span>
  );
}

export function scoreColor(v: number): string {
  return v >= 80 ? "#10b981" : v >= 60 ? "#f59e0b" : v >= 40 ? "#f97316" : "#ef4444";
}
