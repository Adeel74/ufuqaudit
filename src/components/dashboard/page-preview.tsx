"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, AlertCircle, AlertTriangle, CheckCircle2, Lightbulb,
  Eye, Code2, FileText, Image as ImageIcon, Shield, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PageSnapshot {
  url: string;
  svg: string;
  meta: {
    title: string;
    metaDescription: string;
    h1: string;
    wordCount: number;
    loadTimeMs: number;
    pageSizeKb: number;
    canonical: string;
    robots: string;
    ogTitle: string;
    ogDescription: string;
    hasSchema: boolean;
    hasFAQ: boolean;
    hasViewport: boolean;
    hasLang: boolean;
    https: boolean;
    indexable: boolean;
    imagesTotal: number;
    imagesNoAlt: number;
    h2Count: number;
    internalLinks: number;
    externalLinks: number;
  };
  highlights: { x: number; y: number; w: number; h: number; type: string; label: string; severity: string }[];
  width: number;
  height: number;
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  error: "#f97316",
  warning: "#f59e0b",
  opportunity: "#10b981",
};

const META_ICONS: Record<string, any> = {
  title: FileText,
  description: FileText,
  h1: FileText,
  canonical: Code2,
  viewport: Eye,
  lang: Globe,
  schema: Code2,
  https: Shield,
  images: ImageIcon,
};

export function PagePreview({ url }: { url: string }) {
  const [data, setData] = React.useState<PageSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showHighlights, setShowHighlights] = React.useState(true);
  const [activeHighlight, setActiveHighlight] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!url) return;
    setLoading(true);
    fetch(`/api/page-snapshot?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading page preview...</span>
      </div>
    );
  }

  if (!data) return null;

  const { svg, meta, highlights, width, height } = data;

  return (
    <div className="space-y-4">
      {/* Visual preview with overlay highlights */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-mono truncate" title={url}>{url.replace(/^https?:\/\//, "")}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant={showHighlights ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setShowHighlights(!showHighlights)}
            >
              <Eye className="w-3 h-3 mr-1" /> {showHighlights ? "Hide" : "Show"} Issues
            </Button>
          </div>
        </div>

        <div className="relative overflow-x-auto bg-muted/20">
          <div className="relative inline-block" style={{ minWidth: "100%" }}>
            {/* SVG screenshot */}
            <div
              dangerouslySetInnerHTML={{ __html: svg }}
              className="block"
              style={{ width: "100%", maxWidth: width }}
            />

            {/* Highlight overlays */}
            {showHighlights && highlights.map((hl, i) => (
              <div
                key={i}
                className="absolute border-2 rounded transition-opacity cursor-pointer"
                style={{
                  left: `${(hl.x / width) * 100}%`,
                  top: `${(hl.y / data.height) * 100}%`,
                  width: `${(hl.w / width) * 100}%`,
                  height: `${(hl.h / data.height) * 100}%`,
                  borderColor: SEVERITY_COLOR[hl.severity] || "#f59e0b",
                  backgroundColor: `${SEVERITY_COLOR[hl.severity] || "#f59e0b"}20`,
                  opacity: activeHighlight && activeHighlight !== hl.type ? 0.3 : 0.7,
                }}
                onClick={() => setActiveHighlight(activeHighlight === hl.type ? null : hl.type)}
              >
                <span
                  className="absolute -top-6 left-0 text-[10px] font-medium px-1.5 py-0.5 rounded text-white whitespace-nowrap"
                  style={{ backgroundColor: SEVERITY_COLOR[hl.severity] || "#f59e0b" }}
                >
                  {hl.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* SEO Metadata inspector */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Code2 className="w-4 h-4 text-emerald-600" /> On-Page SEO Inspector
        </h3>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
          <MetaRow label="Title" value={meta.title} status={meta.title.length >= 30 && meta.title.length <= 60 ? "pass" : "warn"} />
          <MetaRow label="Meta Description" value={meta.metaDescription} status={meta.metaDescription.length >= 120 && meta.metaDescription.length <= 160 ? "pass" : "warn"} />
          <MetaRow label="H1" value={meta.h1} status={meta.h1 ? "pass" : "fail"} />
          <MetaRow label="Canonical" value={meta.canonical} status={meta.canonical ? "pass" : "warn"} />
          <MetaRow label="Robots" value={meta.robots} status={meta.indexable ? "pass" : "fail"} />
          <MetaRow label="HTTPS" value={meta.https ? "Enabled" : "Not enabled"} status={meta.https ? "pass" : "fail"} />
          <MetaRow label="Viewport" value={meta.hasViewport ? "Present" : "Missing"} status={meta.hasViewport ? "pass" : "fail"} />
          <MetaRow label="HTML Lang" value={meta.hasLang ? "Present" : "Missing"} status={meta.hasLang ? "pass" : "warn"} />
          <MetaRow label="Open Graph" value={meta.ogTitle ? "Present" : "Missing"} status={meta.ogTitle ? "pass" : "warn"} />
          <MetaRow label="Schema (JSON-LD)" value={meta.hasSchema ? "Present" : "Missing"} status={meta.hasSchema ? "pass" : "warn"} />
          <MetaRow label="FAQ Schema" value={meta.hasFAQ ? "Present" : "Missing"} status={meta.hasFAQ ? "pass" : "warn"} />
          <MetaRow label="Images without Alt" value={`${meta.imagesNoAlt} of ${meta.imagesTotal}`} status={meta.imagesNoAlt === 0 ? "pass" : "warn"} />
        </div>

        {/* Stats row */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatChip label="Word Count" value={meta.wordCount} icon={FileText} />
          <StatChip label="Load Time" value={`${meta.loadTimeMs}ms`} icon={Eye} />
          <StatChip label="Page Size" value={`${meta.pageSizeKb}KB`} icon={Code2} />
          <StatChip label="Internal Links" value={meta.internalLinks} icon={Globe} />
        </div>
      </Card>

      {/* Issue highlights list */}
      {highlights.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-500" /> Visual Issues ({highlights.length})
          </h3>
          <div className="space-y-2">
            {highlights.map((hl, i) => {
              const Icon = hl.severity === "critical" ? AlertCircle : hl.severity === "warning" ? AlertTriangle : Lightbulb;
              return (
                <button
                  key={i}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors",
                    activeHighlight === hl.type ? "bg-muted" : "hover:bg-muted/50"
                  )}
                  onClick={() => setActiveHighlight(activeHighlight === hl.type ? null : hl.type)}
                >
                  <Icon className="w-4 h-4 shrink-0" style={{ color: SEVERITY_COLOR[hl.severity] }} />
                  <span className="text-sm flex-1">{hl.label}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{hl.severity}</Badge>
                </button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function MetaRow({ label, value, status }: { label: string; value: string; status: "pass" | "warn" | "fail" }) {
  const Icon = status === "pass" ? CheckCircle2 : status === "warn" ? AlertTriangle : AlertCircle;
  const color = status === "pass" ? "text-emerald-500" : status === "warn" ? "text-amber-500" : "text-red-500";
  return (
    <div className="flex items-start gap-2">
      <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", color)} />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="text-sm truncate" title={value}>{value}</div>
      </div>
    </div>
  );
}

function StatChip({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

// Re-export Globe already imported above
