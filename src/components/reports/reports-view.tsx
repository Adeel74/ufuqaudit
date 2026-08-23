"use client";

import * as React from "react";
import { useAudit, ViewHeader } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  FileBarChart, FileText, Gauge, Brain, Sparkles, Palette, Building2,
  Mail, Image as ImageIcon, Download, Eye, RefreshCw, Check, Loader2,
  Clock, FileCheck, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: "generate" | "preview";
  accent: string;
}

const TEMPLATES: ReportTemplate[] = [
  {
    id: "exec-summary",
    name: "Executive Summary",
    description:
      "1-page PDF with Ufuq Score, top wins, biggest risks, and a 30-day roadmap. Perfect for stakeholder review.",
    icon: FileBarChart,
    action: "generate",
    accent: "#10b981",
  },
  {
    id: "technical",
    name: "Technical SEO Report",
    description:
      "Detailed crawl, indexability, schema, internal-link and Core Web Vitals report with issue-by-issue fixes.",
    icon: Gauge,
    action: "generate",
    accent: "#14b8a6",
  },
  {
    id: "aeo-geo",
    name: "AEO / GEO Report",
    description:
      "AI visibility score, citation-readiness, FAQ/schema coverage, and recommendations to win AI answer engines.",
    icon: Brain,
    action: "generate",
    accent: "#0d9488",
  },
  {
    id: "full-audit",
    name: "Full Audit PDF",
    description:
      "The complete 30+ page audit — scores, all 50+ checks, every issue, every AI recommendation. The deep-dive.",
    icon: FileText,
    action: "generate",
    accent: "#059669",
  },
  {
    id: "whitelabel",
    name: "White-label Custom",
    description:
      "Full audit branded with your agency logo, colors, and contact. Looks like you built it. (Requires Pro plan.)",
    icon: Palette,
    action: "preview",
    accent: "#0f766e",
  },
];

interface RecentReport {
  id: string;
  date: string;
  name: string;
  format: string;
  status: "ready" | "generating" | "failed";
}

const RECENT: RecentReport[] = [
  { id: "r1", date: "2025-04-12", name: "Q1 Executive Summary — Acme Co.", format: "PDF", status: "ready" },
  { id: "r2", date: "2025-04-08", name: "Technical SEO Report — Globex", format: "PDF", status: "ready" },
  { id: "r3", date: "2025-04-03", name: "AEO / GEO Audit — Initech", format: "PDF", status: "generating" },
  { id: "r4", date: "2025-03-28", name: "Full Audit — Soylent", format: "PDF", status: "failed" },
];

const BRAND_SWATCHES = [
  { name: "Emerald", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Forest", value: "#059669" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#e11d48" },
  { name: "Violet", value: "#7c3aed" },
];

export function ReportsView() {
  const audit = useAudit();
  const [agencyName, setAgencyName] = React.useState("Northwind Digital");
  const [contactEmail, setContactEmail] = React.useState("hello@northwind.agency");
  const [brandColor, setBrandColor] = React.useState("#10b981");
  const [generatingId, setGeneratingId] = React.useState<string | null>(null);

  const clientName = audit?.url
    ? (() => {
        try {
          const u = new URL(audit.url);
          return u.hostname.replace(/^www\./, "");
        } catch {
          return audit.url;
        }
      })()
    : "your client";

  function handleTemplate(t: ReportTemplate) {
    if (!audit) {
      toast.error("Run an audit first to generate a report");
      return;
    }
    if (t.action === "preview") {
      toast.info(`Opening preview: ${t.name}…`);
      setTimeout(() => toast.success("Preview ready"), 900);
      return;
    }
    setGeneratingId(t.id);
    toast.info(`Generating ${t.name}…`);
    setTimeout(() => {
      setGeneratingId(null);
      // Trigger real PDF export via print
      const clientNameVal = clientName;
      try {
        (window as any).ufuqPrint?.({
          audit,
          agencyName,
          clientName: clientNameVal,
          brandColor,
          templateId: t.id,
        });
        toast.success(`${t.name} ready — use your browser's "Save as PDF"`, {
          description: `For ${clientNameVal}`,
        });
      } catch (e) {
        toast.success(`${t.name} ready`, { description: `For ${clientNameVal}` });
      }
    }, 800);
  }

  function saveWhitelabel() {
    if (!agencyName.trim()) {
      toast.error("Agency name is required");
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes("@")) {
      toast.error("Enter a valid contact email");
      return;
    }
    toast.success("White-label settings saved", {
      description: `Agency: ${agencyName} · Brand color ${brandColor}`,
    });
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Reports"
        subtitle="White-label audit reports for clients"
        icon={FileBarChart}
        actions={
          <Button variant="outline" size="sm" onClick={() => toast.info("Refreshing reports…")}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        }
      />

      {/* Templates grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          const isBusy = generatingId === t.id;
          return (
            <Card key={t.id} className="p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${t.accent}15`,
                    color: t.accent,
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm leading-tight">
                    {t.name}
                  </h3>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t.action === "preview" ? "Preview template" : "PDF · 1–30 pages"}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                {t.description}
              </p>
              <Button
                size="sm"
                variant={t.action === "preview" ? "outline" : "default"}
                onClick={() => handleTemplate(t)}
                disabled={isBusy}
                className="w-full"
              >
                {isBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : t.action === "preview" ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isBusy
                  ? "Generating…"
                  : t.action === "preview"
                    ? "Preview"
                    : "Generate"}
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent reports table */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Recent Reports
            </h3>
            <span className="text-xs text-muted-foreground">
              Last 30 days
            </span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="min-w-[220px]">Report</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RECENT.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {r.date}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {r.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {r.format}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "ready" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toast.info(`Downloading ${r.name}…`)
                          }
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </Button>
                      ) : r.status === "generating" ? (
                        <span className="text-xs text-amber-600 inline-flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Working…
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toast.error("Generation failed — retry")
                          }
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Retry
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* White-label settings */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-sm">White-label Settings</h3>
          </div>

          {/* Logo placeholder */}
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Agency Logo
            </Label>
            <div
              className="rounded-lg border-2 border-dashed flex flex-col items-center justify-center h-24 text-center gap-1"
              style={{
                borderColor: `${brandColor}50`,
                backgroundColor: `${brandColor}08`,
              }}
            >
              <ImageIcon
                className="w-6 h-6"
                style={{ color: brandColor }}
              />
              <span className="text-[10px] text-muted-foreground">
                Drop logo here (PNG, SVG)
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px]"
                onClick={() => toast.info("Logo upload coming soon")}
              >
                Upload
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label
                htmlFor="agency-name"
                className="text-xs text-muted-foreground mb-1.5 block"
              >
                Agency Name
              </Label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="agency-name"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="pl-9"
                  placeholder="Your agency name"
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="contact-email"
                className="text-xs text-muted-foreground mb-1.5 block"
              >
                Contact Email
              </Label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="pl-9"
                  placeholder="hello@your-agency.com"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Brand Color
              </Label>
              <div className="flex flex-wrap gap-2">
                {BRAND_SWATCHES.map((s) => {
                  const active = brandColor === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setBrandColor(s.value)}
                      title={s.name}
                      className={cn(
                        "w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all",
                        active
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-105",
                      )}
                      style={{ backgroundColor: s.value }}
                    >
                      {active && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1.5">
                Selected: <span className="font-mono">{brandColor}</span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <Button
            onClick={saveWhitelabel}
            size="sm"
            className="w-full"
            style={{ backgroundColor: brandColor, borderColor: brandColor }}
          >
            <Check className="w-3.5 h-3.5" /> Save Settings
          </Button>

          <div className="mt-3 flex items-start gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
            <span>
              White-label reports available on <strong>Pro</strong> &amp;{" "}
              <strong>Agency</strong> plans. Saved settings apply to all
              future reports.
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: RecentReport["status"] }) {
  if (status === "ready") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-transparent">
        <FileCheck className="w-3 h-3 mr-0.5" /> Ready
      </Badge>
    );
  }
  if (status === "generating") {
    return (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-transparent">
        <Loader2 className="w-3 h-3 mr-0.5 animate-spin" /> Generating
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-transparent">
      Failed
    </Badge>
  );
}
