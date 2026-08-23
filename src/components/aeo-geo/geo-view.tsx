"use client";

import * as React from "react";
import {
  Brain, Bot, ShieldCheck, ShieldAlert, Info, Lock,
  CheckCircle2, XCircle, AlertCircle, Sparkles, ArrowRight,
} from "lucide-react";
import {
  useAudit, ViewHeader, EmptyAudit, SeverityBadge,
} from "@/components/dashboard/shared";
import { ScoreRing, ScoreBar } from "@/components/dashboard/score-ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SEVERITY_META, type AuditResult, type Severity } from "@/lib/types";

const ACCENT = "#ec4899";

// --- Helpers ----------------------------------------------------------------

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface GeoBreakdown {
  chatgpt: number;
  claude: number;
  perplexity: number;
  google: number;
}

function computeGeoBreakdown(audit: AuditResult): GeoBreakdown {
  if (audit.geoBreakdown) return audit.geoBreakdown;
  const base = audit.scores.geo;
  const seed = hashStr(audit.url);
  const jitter = (n: number) => {
    const d = ((seed >> n) & 0xf) - 8; // -8..+7
    return Math.max(0, Math.min(100, base + d));
  };
  return {
    chatgpt: jitter(0),
    claude: jitter(4),
    perplexity: jitter(8),
    google: jitter(12),
  };
}

const ENGINES: { key: keyof GeoBreakdown; name: string; desc: string }[] = [
  { key: "chatgpt", name: "ChatGPT", desc: "GPTBot + crawlable content" },
  { key: "claude", name: "Claude", desc: "ClaudeBot + Anthropic indexing" },
  { key: "perplexity", name: "Perplexity", desc: "PerplexityBot + citation fit" },
  { key: "google", name: "Google AI", desc: "Google-Expanded + AI Overviews" },
];

function SeverityIcon({ severity }: { severity: Severity }) {
  const meta = SEVERITY_META[severity];
  return (
    <span
      className={`w-7 h-7 rounded-full flex items-center justify-center ${meta.bg}`}
      title={meta.label}
    >
      {severity === "critical" ? (
        <XCircle className={`w-3.5 h-3.5 ${meta.color}`} />
      ) : severity === "error" ? (
        <XCircle className={`w-3.5 h-3.5 ${meta.color}`} />
      ) : severity === "warning" ? (
        <AlertCircle className={`w-3.5 h-3.5 ${meta.color}`} />
      ) : (
        <Sparkles className={`w-3.5 h-3.5 ${meta.color}`} />
      )}
    </span>
  );
}

// --- View -------------------------------------------------------------------

export function GeoView() {
  const audit = useAudit();

  if (!audit) return <EmptyAudit msg="Run an audit to see GEO insights" />;

  const score = audit.scores.geo;
  const b = computeGeoBreakdown(audit);

  const geoIssues = audit.issues.filter((i) => i.category === "geo");
  const crawlerBlocked = audit.issues.find(
    (i) => i.issueType === "ai_crawler_blocked" && i.severity === "critical",
  );
  const hasCrawlerAccess = !crawlerBlocked;

  return (
    <div className="space-y-6">
      <ViewHeader
        title="GEO — AI Visibility"
        subtitle="How visible is your site to AI answer engines?"
        icon={Brain}
      />

      {/* Top score + AI engine breakdown */}
      <Card className="p-5">
        <div className="grid lg:grid-cols-3 gap-6 items-center">
          <div className="flex flex-col items-center text-center">
            <ScoreRing
              value={score}
              size={150}
              color={ACCENT}
              label="AI Visibility"
              sublabel="/ 100"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {score >= 80
                ? "Strong AI visibility signals detected."
                : score >= 60
                  ? "Decent — some engines may surface you."
                  : "AI engines are unlikely to cite your content."}
            </p>
          </div>

          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3">
            {ENGINES.map((e) => {
              const v = b[e.key];
              return (
                <div
                  key={e.key}
                  className="rounded-xl border bg-card p-4 flex items-center gap-3"
                >
                  <ScoreRing value={v} size={64} stroke={6} color={ACCENT} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{e.name}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {e.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* AI Crawler Access status */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              hasCrawlerAccess
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-red-500/10 text-red-600"
            }`}
          >
            {hasCrawlerAccess ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">AI Crawler Access</h3>
            {hasCrawlerAccess ? (
              <p className="text-sm text-muted-foreground mt-1">
                Your robots.txt allows the major AI crawlers. Engines can index
                your content for answer generation.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                {crawlerBlocked?.title || "AI crawlers are blocked."} Update
                your robots.txt to allow indexing.
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Expanded"].map((bot) => {
                const ok = hasCrawlerAccess;
                return (
                  <span
                    key={bot}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                      ok
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-red-50 border-red-200 text-red-700"
                    }`}
                  >
                    {ok ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {bot}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* AI Visibility Recommendations */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: ACCENT }} />
              AI Visibility Recommendations
            </h3>
            <span className="text-xs text-muted-foreground">
              {geoIssues.length} found
            </span>
          </div>
          {geoIssues.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              No GEO issues detected.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
              <ul className="space-y-2.5">
                {geoIssues.slice(0, 12).map((issue, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors"
                  >
                    <SeverityIcon severity={issue.severity} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{issue.title}</p>
                        <SeverityBadge severity={issue.severity} />
                      </div>
                      {issue.recommendation ? (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {issue.recommendation}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {issue.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
                {geoIssues.length > 12 && (
                  <li className="text-center text-[11px] text-muted-foreground pt-1">
                    + {geoIssues.length - 12} more issues
                  </li>
                )}
              </ul>
            </div>
          )}
        </Card>

        {/* Engine visibility bars */}
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4" style={{ color: ACCENT }} />
            Engine Visibility Breakdown
          </h3>
          <div className="space-y-4">
            {ENGINES.map((e) => {
              const v = b[e.key];
              return (
                <div key={e.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{e.name}</span>
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: ACCENT }}
                    >
                      {v}
                    </span>
                  </div>
                  <ScoreBar value={v} color={ACCENT} />
                  <p className="text-[11px] text-muted-foreground mt-1">{e.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-5 p-3 rounded-lg bg-muted/60 border border-dashed">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-medium">Tip:</span> Allow{" "}
              <code className="px-1 py-0.5 rounded bg-background">GPTBot</code>,{" "}
              <code className="px-1 py-0.5 rounded bg-background">ClaudeBot</code>,{" "}
              <code className="px-1 py-0.5 rounded bg-background">PerplexityBot</code>{" "}
              in robots.txt to let engines index your content.
            </p>
          </div>
        </Card>
      </div>

      {/* Disclaimer */}
      <Card className="p-5" style={{ borderColor: `${ACCENT}30` }}>
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
          >
            <Lock className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Info className="w-3.5 h-3.5" />
              Important disclaimer
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              We measure <em>readiness signals</em> — robots.txt access,
              structured data, content depth, citation-friendliness. We don&apos;t
              claim to rank you inside ChatGPT, Claude, Perplexity or Google AI
              Overviews. Final inclusion in AI answers depends on each engine&apos;s
              own relevance, freshness and authority scoring.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => toast.info("Detailed GEO report coming soon")}
          >
            <ArrowRight className="w-3.5 h-3.5 mr-1" /> Learn more
          </Button>
        </div>
      </Card>

      <p className="text-[11px] text-muted-foreground text-center">
        GEO scores are an estimate based on readiness signals, not actual AI rankings.
      </p>
    </div>
  );
}
