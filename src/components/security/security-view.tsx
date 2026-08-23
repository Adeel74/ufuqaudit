"use client";

import * as React from "react";
import {
  Shield, ShieldCheck, ShieldAlert, Lock, FileCode, Copy, Check,
  AlertTriangle, AlertOctagon, AlertCircle, Lightbulb, Server, Bug,
} from "lucide-react";
import {
  useAudit, ViewHeader, EmptyAudit, SeverityBadge,
} from "@/components/dashboard/shared";
import { ScoreRing } from "@/components/dashboard/score-ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { AuditResult } from "@/lib/types";

const ACCENT = "#06b6d4";

// --- Helpers ----------------------------------------------------------------

type SecStatus = "pass" | "warn" | "fail";

interface SecCheck {
  name: string;
  status: SecStatus;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

function computeSecurityChecklist(audit: AuditResult): SecCheck[] {
  const home = audit.pages[0] ?? {};
  const https = !!home.https;
  const secIssues = audit.issues.filter((i) => i.category === "security");

  const statusOf = (type: string): SecStatus => {
    const issue = secIssues.find((i) => i.issueType === type);
    if (!issue) return "pass";
    if (issue.severity === "critical" || issue.severity === "error") return "fail";
    return "warn";
  };

  const mixedStatus: SecStatus = https
    ? (secIssues.some((i) => i.issueType === "mixed_content") ? "fail" : "pass")
    : "warn";

  const malwareStatus: SecStatus = secIssues.some((i) => i.issueType === "malware_detected")
    ? "fail"
    : "pass";

  const items: SecCheck[] = [
    {
      name: "HTTPS enabled",
      status: https ? "pass" : "fail",
      desc: https ? "All pages served over HTTPS" : "Site served over HTTP",
      icon: Lock,
    },
    {
      name: "SSL certificate valid",
      status: https ? "pass" : "fail",
      desc: https ? "TLS handshake succeeded" : "No valid TLS certificate",
      icon: ShieldCheck,
    },
    { name: "HSTS header", status: statusOf("hsts_missing"), desc: "Strict-Transport-Security", icon: Lock },
    { name: "Content-Security-Policy", status: statusOf("csp_missing"), desc: "Mitigates XSS & injection", icon: FileCode },
    { name: "X-Frame-Options", status: statusOf("x_frame_options_missing"), desc: "Clickjacking protection", icon: Shield },
    { name: "X-Content-Type-Options", status: statusOf("x_content_type_options_missing"), desc: "Prevents MIME sniffing", icon: FileCode },
    { name: "Referrer-Policy", status: statusOf("referrer_policy_missing"), desc: "Controls referrer leakage", icon: Shield },
    { name: "Mixed content", status: mixedStatus, desc: mixedStatus === "pass" ? "No HTTP sub-resources" : mixedStatus === "warn" ? "Enable HTTPS to evaluate" : "HTTP resources on HTTPS page", icon: AlertTriangle },
    { name: "Malware / phishing", status: malwareStatus, desc: malwareStatus === "pass" ? "No malicious signatures" : "Suspicious signatures detected", icon: Bug },
    { name: "Security headers (overall)", status: "pass", desc: "Aggregate score across the above", icon: Server },
  ];

  // Overall status = worst of first 9
  const rest = items.slice(0, 9);
  const worst: SecStatus = rest.some((i) => i.status === "fail")
    ? "fail"
    : rest.some((i) => i.status === "warn")
      ? "warn"
      : "pass";
  items[9].status = worst;
  return items;
}

const RECOMMENDED_HEADERS = `# Recommended security headers
# nginx (in server block) OR Next.js next.config.ts headers()

Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:;
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()`;

function StatusIcon({ status }: { status: SecStatus }) {
  if (status === "pass")
    return (
      <span className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
        <Check className="w-3.5 h-3.5 text-emerald-600" />
      </span>
    );
  if (status === "warn")
    return (
      <span className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
      </span>
    );
  return (
    <span className="w-7 h-7 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
      <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
    </span>
  );
}

function statusLabel(s: SecStatus): string {
  return s === "pass" ? "Pass" : s === "warn" ? "Warning" : "Fail";
}

// --- View -------------------------------------------------------------------

export function SecurityView() {
  const audit = useAudit();
  const [copied, setCopied] = React.useState(false);

  if (!audit) return <EmptyAudit msg="Run an audit to see security insights" />;

  const score = audit.scores.security;
  const checklist = computeSecurityChecklist(audit);
  const secIssues = audit.issues.filter((i) => i.category === "security");
  const passCount = checklist.filter((i) => i.status === "pass").length;

  const copyHeaders = async () => {
    try {
      await navigator.clipboard.writeText(RECOMMENDED_HEADERS);
      setCopied(true);
      toast.success("Security headers config copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy — please select & copy manually");
    }
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Security — HTTPS & Headers"
        subtitle="Transport security, response headers and malware checks across your audited pages."
        icon={Shield}
      />

      {/* Top score + checklist */}
      <Card className="p-5">
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <div className="flex flex-col items-center text-center lg:sticky lg:top-4">
            <ScoreRing
              value={score}
              size={150}
              color={ACCENT}
              label="Security"
              sublabel="/ 100"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {score >= 80
                ? "Strong security posture."
                : score >= 60
                  ? "Some headers missing — fix recommended."
                  : "Critical security gaps — address immediately."}
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {passCount} / {checklist.length} checks passed
            </p>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4" style={{ color: ACCENT }} />
              Security Checklist
            </h3>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {checklist.map((c, i) => {
                const Icon = c.icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <StatusIcon status={c.status} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          {c.name}
                        </p>
                        <span
                          className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor:
                              c.status === "pass"
                                ? "#10b98115"
                                : c.status === "warn"
                                  ? "#f59e0b15"
                                  : "#ef444415",
                            color:
                              c.status === "pass"
                                ? "#0f766e"
                                : c.status === "warn"
                                  ? "#92400e"
                                  : "#b91c1c",
                          }}
                        >
                          {statusLabel(c.status)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        {c.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Security issues list */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" style={{ color: ACCENT }} />
              Security Issues
            </h3>
            <span className="text-xs text-muted-foreground">{secIssues.length} found</span>
          </div>
          {secIssues.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              No security issues detected.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
              <ul className="space-y-2.5">
                {secIssues.map((issue, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors"
                  >
                    <div className="pt-0.5">
                      <SeverityBadge severity={issue.severity} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{issue.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {issue.description}
                      </p>
                      {issue.recommendation && (
                        <p className="text-[11px] mt-1.5 p-2 rounded-md bg-muted/60">
                          <span className="font-medium text-muted-foreground">Fix:</span>{" "}
                          {issue.recommendation}
                        </p>
                      )}
                    </div>
                    {issue.severity === "critical" ? (
                      <AlertOctagon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    ) : issue.severity === "error" ? (
                      <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    ) : issue.severity === "warning" ? (
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <Lightbulb className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Recommended headers */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <FileCode className="w-4 h-4" style={{ color: ACCENT }} />
              Recommended Security Headers
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={copyHeaders}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Drop this into your nginx server block, or set as{" "}
            <code className="px-1 py-0.5 rounded bg-muted text-[11px]">headers()</code>{" "}
            in your <code className="px-1 py-0.5 rounded bg-muted text-[11px]">next.config.ts</code>{" "}
            file.
          </p>
          <pre className="text-[11px] leading-relaxed p-4 rounded-lg bg-muted/70 border overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
            <code className="font-mono text-foreground">{RECOMMENDED_HEADERS}</code>
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            {["nginx", "next.config.ts", "Apache", "Cloudflare"].map((t) => (
              <span
                key={t}
                className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Security checks are derived from response headers & TLS state. Run a
        dedicated penetration test for production-grade assurance.
      </p>
    </div>
  );
}
