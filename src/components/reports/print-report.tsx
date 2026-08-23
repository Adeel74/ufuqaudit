"use client";

import * as React from "react";
import type { AuditResult } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";

interface PrintReportProps {
  audit: AuditResult;
  agencyName?: string;
  clientName?: string;
  brandColor?: string;
  templateId?: string;
}

/**
 * A hidden printable report. Renders into #print-root and triggers window.print().
 * Styled for print via the @media print rules in globals.css.
 */
export function PrintReport({ audit, agencyName, clientName, brandColor = "#10b981", templateId = "full" }: PrintReportProps) {
  const cats = [
    { key: "technical" as const, label: "Technical SEO", value: audit.scores.technical },
    { key: "content" as const, label: "Content SEO", value: audit.scores.content },
    { key: "performance" as const, label: "Performance", value: audit.scores.performance },
    { key: "aeo" as const, label: "AEO", value: audit.scores.aeo },
    { key: "geo" as const, label: "GEO / AI Visibility", value: audit.scores.geo },
    { key: "security" as const, label: "Security", value: audit.scores.security },
  ];

  const scoreColor = (v: number) => v >= 80 ? "#10b981" : v >= 60 ? "#f59e0b" : v >= 40 ? "#f97316" : "#ef4444";

  return (
    <div id="ufuq-print-report" className="hidden print:block" style={{ color: "#0f172a", padding: "32px", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `3px solid ${brandColor}`, paddingBottom: "16px", marginBottom: "24px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Website Audit Report</div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "4px 0 0" }}>{agencyName || "UfuqAudit"}</h1>
          <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>Prepared for: <strong>{clientName || audit.url}</strong></div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "32px", fontWeight: 800, color: scoreColor(audit.overallScore) }}>{audit.overallScore}</div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>Ufuq Score / 100</div>
          <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "6px" }}>{new Date(audit.createdAt || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
        </div>
      </div>

      {/* URL & summary */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "12px", color: "#64748b" }}>Audited URL</div>
        <div style={{ fontSize: "14px", fontWeight: 600 }}>{audit.url}</div>
        {audit.summary && (
          <p style={{ fontSize: "13px", color: "#334155", marginTop: "12px", lineHeight: 1.6 }}>{audit.summary}</p>
        )}
      </div>

      {/* Category scores */}
      <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", color: "#0f172a" }}>Category Scores</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
            <th style={{ textAlign: "left", padding: "8px 0", fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Category</th>
            <th style={{ textAlign: "right", padding: "8px 0", fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Score</th>
            <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Rating</th>
          </tr>
        </thead>
        <tbody>
          {cats.map((c) => (
            <tr key={c.key} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "10px 0", fontSize: "13px", fontWeight: 500 }}>{c.label}</td>
              <td style={{ padding: "10px 0", fontSize: "18px", fontWeight: 700, textAlign: "right", color: scoreColor(c.value) }}>{c.value}</td>
              <td style={{ padding: "10px 12px", fontSize: "12px" }}>
                <span style={{ backgroundColor: `${scoreColor(c.value)}20`, color: scoreColor(c.value), padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                  {c.value >= 80 ? "Excellent" : c.value >= 60 ? "Good" : c.value >= 40 ? "Needs Work" : "Poor"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Issue counts */}
      <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Issues Summary</h2>
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Critical", count: audit.counts.critical, color: "#ef4444" },
          { label: "Errors", count: audit.counts.error, color: "#f97316" },
          { label: "Warnings", count: audit.counts.warning, color: "#f59e0b" },
          { label: "Opportunities", count: audit.counts.opportunity, color: "#10b981" },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Top issues */}
      {templateId !== "exec-summary" && (
        <>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Top Issues</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ textAlign: "left", padding: "8px 0", fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Severity</th>
                <th style={{ textAlign: "left", padding: "8px 0", fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Issue</th>
                <th style={{ textAlign: "left", padding: "8px 0", fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {audit.issues.slice(0, 15).map((issue, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "8px 0", fontSize: "11px", verticalAlign: "top" }}>
                    <span style={{ textTransform: "capitalize", fontWeight: 600, color: issue.severity === "critical" ? "#ef4444" : issue.severity === "error" ? "#f97316" : issue.severity === "warning" ? "#f59e0b" : "#10b981" }}>{issue.severity}</span>
                  </td>
                  <td style={{ padding: "8px 12px", fontSize: "12px", fontWeight: 500, verticalAlign: "top" }}>{issue.title}</td>
                  <td style={{ padding: "8px 12px", fontSize: "11px", color: "#475569", verticalAlign: "top", maxWidth: "300px" }}>{issue.recommendation || issue.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* AI action plan */}
      {audit.aiActionPlan.length > 0 && (
        <>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Recommended Action Plan</h2>
          <ol style={{ paddingLeft: "20px", marginBottom: "24px" }}>
            {audit.aiActionPlan.map((p, i) => (
              <li key={i} style={{ fontSize: "12px", color: "#334155", marginBottom: "6px", lineHeight: 1.5 }}>{p}</li>
            ))}
          </ol>
        </>
      )}

      {/* Footer */}
      <div style={{ marginTop: "32px", paddingTop: "16px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8" }}>
        <div>Generated by {agencyName || "UfuqAudit"} · {audit.pagesCrawled} pages crawled</div>
        <div>Confidential — for {clientName} only</div>
      </div>
    </div>
  );
}

/**
 * Triggers the browser print dialog with the report rendered.
 * Mounts the report into #print-root, applies print mode, calls window.print(), then cleans up.
 */
export function printAuditReport(opts: {
  audit: AuditResult;
  agencyName?: string;
  clientName?: string;
  brandColor?: string;
  templateId?: string;
}) {
  // We use a global function injected by the PrintReportPortal component
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ufuq-print-report", { detail: opts }));
  }
}
