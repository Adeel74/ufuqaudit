"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import { ViewHeader, StatCard, scoreColor } from "@/components/dashboard/shared";
import { ScoreRing } from "@/components/dashboard/score-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Search, Link2, ExternalLink, AlertCircle, AlertTriangle, CheckCircle2,
  ArrowRight, ArrowLeft, Download, RefreshCw, Bot, Shield, FileText,
  ChevronRight, Loader2, Sparkles, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkResult {
  url: string;
  status: number;
  statusText: string;
  type: string;
  anchor: string;
  rel: string[];
  isNofollow: boolean;
  isSponsored: boolean;
  isUGC: boolean;
  isDoFollow: boolean;
  isHttps: boolean;
  isBroken: boolean;
  isRedirect: boolean;
  redirectChain?: string[];
  issue?: string;
  anchorQuality: string;
}

interface ScanResult {
  url: string;
  domain: string;
  links: LinkResult[];
  stats: {
    total: number;
    broken: number;
    redirects: number;
    genericAnchors: number;
    emptyAnchors: number;
    insecure: number;
    issues: number;
    seoScore: number;
  };
  timestamp: string;
}

const STATUS_META: Record<string, { color: string; bg: string; icon: any }> = {
  ok: { color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: CheckCircle2 },
  redirect: { color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", icon: ArrowRight },
  broken: { color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", icon: AlertCircle },
  error: { color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30", icon: AlertTriangle },
};

function getStatusMeta(status: number) {
  if (status === 0) return { color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-950/30", icon: Link2, label: "Special" };
  if (status >= 200 && status < 300) return { ...STATUS_META.ok, label: `${status} OK` };
  if (status >= 300 && status < 400) return { ...STATUS_META.redirect, label: `${status} Redirect` };
  if (status === 404 || status === 410) return { ...STATUS_META.broken, label: `${status} Not Found` };
  if (status >= 400 && status < 500) return { ...STATUS_META.error, label: `${status} Client Error` };
  if (status >= 500) return { ...STATUS_META.broken, label: `${status} Server Error` };
  return { color: "text-slate-600", bg: "bg-slate-50", icon: Link2, label: `${status}` };
}

export function UfuqLinkView() {
  const { setView, currentAudit } = useAppStore();
  const [url, setUrl] = React.useState(currentAudit?.url || "");
  const [scanning, setScanning] = React.useState(false);
  const [result, setResult] = React.useState<ScanResult | null>(null);
  const [filter, setFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  const scan = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!url.trim()) { toast.error("Enter a URL to scan"); return; }
    setScanning(true);
    setResult(null);
    try {
      const res = await fetch("/api/scan-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Scan failed");
      setResult(data);
      toast.success(`Scan complete — ${data.stats.total} links found, SEO score ${data.stats.seoScore}/100`);
    } catch (err: any) {
      toast.error(err?.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const filteredLinks = React.useMemo(() => {
    if (!result) return [];
    let links = result.links;
    if (filter === "broken") links = links.filter((l) => l.isBroken);
    else if (filter === "redirects") links = links.filter((l) => l.isRedirect);
    else if (filter === "internal") links = links.filter((l) => l.type === "internal");
    else if (filter === "external") links = links.filter((l) => l.type === "external");
    else if (filter === "nofollow") links = links.filter((l) => l.isNofollow);
    else if (filter === "issues") links = links.filter((l) => l.issue);
    if (search.trim()) {
      const q = search.toLowerCase();
      links = links.filter((l) => l.url.toLowerCase().includes(q) || l.anchor.toLowerCase().includes(q));
    }
    return links;
  }, [result, filter, search]);

  const exportCsv = () => {
    if (!result) return;
    const rows = [["URL", "Status", "Type", "Anchor", "Rel", "Issue"]];
    result.links.forEach((l) => {
      rows.push([l.url, String(l.status), l.type, l.anchor, l.rel.join(" "), l.issue || ""]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ufuqlink-${result.domain}-${Date.now()}.csv`;
    a.click();
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="UfuqLink — Link Scanner"
        subtitle="Instant link checker & SEO analysis for any page"
        icon={Link2}
        actions={
          <Button variant="outline" size="sm" onClick={() => setView("landing")}>
            <Zap className="w-3.5 h-3.5 mr-1" /> Full Website Audit
          </Button>
        }
      />

      {/* Scan input */}
      <Card className="p-5">
        <form onSubmit={scan} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/blog/seo-guide"
              className="pl-9 h-11"
              disabled={scanning}
            />
          </div>
          <Button type="submit" size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={scanning}>
            {scanning ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Scanning...</> : <><Link2 className="w-4 h-4 mr-1" /> Scan Page</>}
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {["https://example.com", "https://stripe.com", "https://shopify.com", "https://vercel.com"].map((ex) => (
            <button key={ex} onClick={() => setUrl(ex)} className="text-xs px-2.5 py-1 rounded-full border bg-card hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-colors">
              {ex.replace("https://", "")}
            </button>
          ))}
        </div>
      </Card>

      {/* Loading state */}
      {scanning && (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-3 text-emerald-600 animate-spin" />
          <p className="text-sm font-medium">Scanning {url}...</p>
          <p className="text-xs text-muted-foreground mt-1">Extracting links, checking HTTP status, analyzing SEO attributes</p>
        </Card>
      )}

      {/* Results */}
      {result && !scanning && (
        <>
          {/* Overview row */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Score + summary */}
            <Card className="p-5 flex flex-col items-center justify-center text-center">
              <ScoreRing value={result.stats.seoScore} size={120} label="SEO Score" color={scoreColor(result.stats.seoScore)} />
              <p className="mt-2 text-xs text-muted-foreground">{result.domain}</p>
            </Card>

            {/* Stat cards */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard label="Total Links" value={result.stats.total} icon={Link2} color="#6366f1" />
              <StatCard label="Working" value={result.stats.total - result.stats.broken - result.stats.redirects} icon={CheckCircle2} color="#10b981" />
              <StatCard label="Broken" value={result.stats.broken} icon={AlertCircle} color="#ef4444" />
              <StatCard label="Redirects" value={result.stats.redirects} icon={ArrowRight} color="#f59e0b" />
              <StatCard label="Internal" value={result.links.filter((l) => l.type === "internal").length} icon={FileText} color="#10b981" />
              <StatCard label="External" value={result.links.filter((l) => l.type === "external").length} icon={ExternalLink} color="#8b5cf6" />
            </div>
          </div>

          {/* Issues summary */}
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Issues Found
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border bg-red-50 dark:bg-red-950/30 p-3 text-center">
                <div className="text-xl font-bold text-red-600">{result.stats.broken}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Broken Links</div>
              </div>
              <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/30 p-3 text-center">
                <div className="text-xl font-bold text-amber-600">{result.stats.redirects}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Redirects</div>
              </div>
              <div className="rounded-lg border bg-orange-50 dark:bg-orange-950/30 p-3 text-center">
                <div className="text-xl font-bold text-orange-600">{result.stats.genericAnchors + result.stats.emptyAnchors}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Anchor Issues</div>
              </div>
              <div className="rounded-lg border bg-slate-50 dark:bg-slate-950/30 p-3 text-center">
                <div className="text-xl font-bold text-slate-600">{result.stats.insecure}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Insecure HTTP</div>
              </div>
            </div>
          </Card>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search URL or anchor..."
                className="pl-9 h-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { v: "all", l: "All" },
                { v: "broken", l: "Broken" },
                { v: "redirects", l: "Redirects" },
                { v: "internal", l: "Internal" },
                { v: "external", l: "External" },
                { v: "nofollow", l: "Nofollow" },
                { v: "issues", l: "Issues" },
              ].map((f) => (
                <button
                  key={f.v}
                  onClick={() => setFilter(f.v)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                    filter === f.v ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  {f.l}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="w-3.5 h-3.5 mr-1" /> CSV
            </Button>
          </div>

          {/* Links table */}
          <Card className="p-0 overflow-hidden">
            <div className="max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="min-w-[60px]">Status</TableHead>
                    <TableHead className="min-w-[200px]">URL</TableHead>
                    <TableHead className="min-w-[80px]">Type</TableHead>
                    <TableHead className="min-w-[150px]">Anchor</TableHead>
                    <TableHead className="min-w-[100px]">Rel</TableHead>
                    <TableHead className="min-w-[150px]">Issue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="zebra">
                  {filteredLinks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No links match your filter</TableCell>
                    </TableRow>
                  ) : (
                    filteredLinks.map((link, i) => {
                      const sm = getStatusMeta(link.status);
                      const Icon = sm.icon;
                      return (
                        <TableRow key={i} className="hover:bg-accent/40">
                          <TableCell>
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-medium", sm.bg, sm.color)}>
                              <Icon className="w-3 h-3" /> {sm.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-mono truncate max-w-[200px]" title={link.url}>
                            {link.url}
                            {link.redirectChain && link.redirectChain.length > 1 && (
                              <div className="mt-1 text-[10px] text-amber-600 flex items-center gap-0.5">
                                {link.redirectChain.length} hops: {link.redirectChain[0].replace(/^https?:\/\//, "")} → ... → {link.redirectChain[link.redirectChain.length - 1].replace(/^https?:\/\//, "")}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] capitalize">{link.type}</Badge>
                          </TableCell>
                          <TableCell className="text-xs truncate max-w-[150px]" title={link.anchor}>
                            {link.anchor}
                            {link.anchorQuality === "generic" && <span className="ml-1 text-amber-500">⚠</span>}
                            {link.anchorQuality === "empty" && <span className="ml-1 text-red-500">✕</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {link.rel.length === 0 && link.isDoFollow && link.type !== "mailto" && link.type !== "tel" && link.type !== "fragment" && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 font-medium">follow</span>
                              )}
                              {link.rel.map((r) => (
                                <span key={r} className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
                                  r === "nofollow" ? "bg-slate-50 dark:bg-slate-950/30 text-slate-600" :
                                  r === "sponsored" ? "bg-violet-50 dark:bg-violet-950/30 text-violet-600" :
                                  r === "ugc" ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600" :
                                  "bg-sky-50 dark:bg-sky-950/30 text-sky-600"
                                )}>{r}</span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {link.issue ? (
                              <span className="text-amber-600 dark:text-amber-400">{link.issue}</span>
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Smart recommendations */}
          <Card className="p-5 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/10 border-emerald-200/50">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-600" /> Smart Recommendations
            </h3>
            <ol className="space-y-2.5">
              {result.stats.broken > 0 && (
                <li className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <span><strong>Fix {result.stats.broken} broken links.</strong> Broken links create poor UX and weaken internal linking. Replace or 301-redirect them to live URLs.</span>
                </li>
              )}
              {result.stats.redirects > 0 && (
                <li className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <span><strong>Resolve {result.stats.redirects} redirects.</strong> Replace redirecting URLs with their final destinations to reduce redirect chains and improve page speed.</span>
                </li>
              )}
              {(result.stats.genericAnchors > 0 || result.stats.emptyAnchors > 0) && (
                <li className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <span><strong>Improve {result.stats.genericAnchors + result.stats.emptyAnchors} anchor texts.</strong> Replace generic anchors ("Click here", "Read more") with descriptive, keyword-rich text.</span>
                </li>
              )}
              {result.stats.insecure > 0 && (
                <li className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-950/40 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">4</span>
                  <span><strong>Fix {result.stats.insecure} insecure HTTP links.</strong> Update HTTP links to HTTPS to avoid mixed-content warnings and security risks.</span>
                </li>
              )}
            </ol>
          </Card>

          {/* UfuqAudit CTA */}
          <Card className="p-5 bg-gradient-to-br from-violet-50/50 to-emerald-50/50 dark:from-violet-950/10 dark:to-emerald-950/10 border-violet-200/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Want a full website audit?</h3>
                <p className="text-sm text-muted-foreground mt-1">UfuqLink scanned one page. UfuqAudit can crawl your entire website and find 200+ SEO, AEO & GEO issues across all pages.</p>
                <Button size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setView("landing")}>
                  Run Full Website Audit <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Empty state */}
      {!result && !scanning && (
        <Card className="p-10 text-center border-dashed">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
            <Link2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-lg">Scan any web page for links & SEO issues</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Enter a URL above to instantly detect broken links, redirects, anchor text issues, rel attributes, and more — then export to CSV or escalate to a full UfuqAudit.</p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
            {[
              { icon: AlertCircle, label: "Broken Links", color: "#ef4444" },
              { icon: ArrowRight, label: "Redirect Chains", color: "#f59e0b" },
              { icon: FileText, label: "Anchor Analysis", color: "#10b981" },
              { icon: Shield, label: "SEO Checks", color: "#06b6d4" },
            ].map((f) => (
              <div key={f.label} className="rounded-lg border p-3 text-center">
                <f.icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: f.color }} />
                <div className="text-xs font-medium">{f.label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
