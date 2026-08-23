"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Score ring — circular progress 0-100
export function ScoreRing({
  value,
  size = 140,
  stroke = 12,
  label,
  sublabel,
  color,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  const scoreColor = color || (value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : value >= 40 ? "#f97316" : "#ef4444");
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-muted" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={scoreColor}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums" style={{ color: scoreColor }}>
          {value}
        </span>
        {label && <span className="text-xs text-muted-foreground mt-1">{label}</span>}
        {sublabel && <span className="text-[10px] text-muted-foreground">{sublabel}</span>}
      </div>
    </div>
  );
}

// Mini bar for category score
export function ScoreBar({ value, color }: { value: number; color?: string }) {
  const c = color || (value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : value >= 40 ? "#f97316" : "#ef4444");
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: c, transition: "width 0.6s ease" }} />
    </div>
  );
}

export function MiniBadge({ children, variant = "default", className }: { children: React.ReactNode; variant?: "default" | "outline" | "secondary"; className?: string }) {
  const styles = {
    default: "bg-primary text-primary-foreground",
    outline: "border border-border text-foreground",
    secondary: "bg-secondary text-secondary-foreground",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", styles[variant], className)}>{children}</span>;
}
