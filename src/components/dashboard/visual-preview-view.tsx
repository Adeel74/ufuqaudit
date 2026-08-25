"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import { ViewHeader, useAudit, StatCard, scoreColor } from "@/components/dashboard/shared";
import { ScoreRing } from "@/components/dashboard/score-ui";
import { PagePreview } from "@/components/dashboard/page-preview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, AlertCircle, CheckCircle2, AlertTriangle, Lightbulb, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageSnapshotData {
  url: string;
  svg: string;
  meta: any;
  highlights: { x: number; y: number; w: number; h: number; type: string; label: string; severity: string }[];
  width: number;
  height: number;
}

export function VisualPreviewView() {
  const audit = useAudit();
  const [snapshots, setSnapshots] = React.useState<Record<string, PageSnapshotData>>({});
  const [selectedUrl, setSelectedUrl] = React.useState<string | null>(null);
  const [loadingUrls, setLoadingUrls] = React.useState<Set<string>>(new Set());

  // Fetch all page snapshots when audit is available
  React.useEffect(() => {
    if (!audit?.pages?.length) return;
    const urls = audit.pages.map((p) => p.url);
    const loaded = new Set(Object.keys(snapshots));
    const toLoad = urls.filter((u) => !loaded.has(u));
    if (toLoad.length === 0) return;

    toLoad.forEach((url) => {
      setLoadingUrls((prev) => new Set(prev).add(url));
      fetch(`/api/page-snapshot?url=${encodeURIComponent(url)}`)
        .then((r) => r.json())
        .then((d) => {
          setSnapshots((prev) => ({ ...prev, [url]: d }));
        })
        .catch(() => {})
        .finally(() => {
          setLoadingUrls((prev) => {
            const next = new Set(prev);
            next.delete(url);
            return next;
          });
        });
    });
  }, [audit]);

  if (!audit) {
    return (
      <div className="space-y-6">
        <ViewHeader title="Visual Preview" subtitle="See page screenshots with SEO issue highlights" icon={Eye} />
        <Card className="p-10 text-center">
          <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Run an audit to see visual page previews with issue highlights.</p>
          <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => useAppStore.getState().setView("landing")}>Run Audit</Button>
        </Card>
      </div>
    );
  }

  // If a page is selected, show the detailed view
  if (selectedUrl && snapshots[selectedUrl]) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="Visual Preview"
          subtitle="Page screenshot with SEO issue overlays"
          icon={Eye}
          actions={
            <Button variant="outline" size="sm" onClick={() => setSelectedUrl(null)}>
              ← Back to Overview
            </Button>
          }
        />
        <PagePreview url={selectedUrl} />
      </div>
    );
  }

  // Overview: show all page thumbnails with overall stats
  const pages = audit.pages;
  const allIssues = pages.reduce((sum, p) => sum + (snapshots[p.url]?.highlights?.length || 0), 0);
  const pagesWithIssues = pages.filter((p) => (snapshots[p.url]?.highlights?.length || 0) > 0).length;
  const pagesClean = pages.length - pagesWithIssues;

  return (
    <div className="space-y-6">
      <ViewHeader title="Visual Preview" subtitle="All page screenshots with SEO issue overlays" icon={Eye} />

      {/* Overall results */}
      <Card className="p-5">
        <div className="grid lg:grid-cols-3 gap-6 items-center">
          <div className="flex flex-col items-center text-center">
            <ScoreRing value={audit.overallScore} size={120} label="Ufuq Score" color={scoreColor(audit.overallScore)} />
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Pages" value={pages.length} icon={Eye} color="#6366f1" />
            <StatCard label="Pages with Issues" value={pagesWithIssues} icon={AlertCircle} color="#f59e0b" />
            <StatCard label="Clean Pages" value={pagesClean} icon={CheckCircle2} color="#10b981" />
            <StatCard label="Total Issues" value={allIssues} icon={AlertTriangle} color="#ef4444" />
          </div>
        </div>
      </Card>

      {/* Page thumbnails grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => {
          const snap = snapshots[page.url];
          const isLoading = loadingUrls.has(page.url);
          const issues = snap?.highlights?.length || 0;
          const score = snap?.meta ? (snap.meta.https ? 80 : 60) - issues * 5 : 0;

          return (
            <button
              key={page.url}
              onClick={() => setSelectedUrl(page.url)}
              className="text-left rounded-xl border bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-muted/30 overflow-hidden border-b">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : snap ? (
                  <>
                    <div
                      dangerouslySetInnerHTML={{ __html: snap.svg }}
                      className="absolute inset-0 w-full h-full"
                      style={{ transform: "scale(0.3)", transformOrigin: "top left", width: snap.width, height: snap.height }}
                    />
                    {/* Issue count overlay */}
                    {issues > 0 ? (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-red-500/90 text-white text-[10px] font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {issues}
                      </div>
                    ) : (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> OK
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                    <Eye className="w-5 h-5 mr-1" /> No preview
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="text-xs font-mono truncate" title={page.url}>
                  {page.url.replace(/^https?:\/\//, "")}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1.5">
                    {snap?.meta?.https ? (
                      <Badge variant="outline" className="text-[9px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600">HTTPS</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] bg-red-50 dark:bg-red-950/30 text-red-600">HTTP</Badge>
                    )}
                    {snap?.meta?.hasSchema && (
                      <Badge variant="outline" className="text-[9px] bg-violet-50 dark:bg-violet-950/30 text-violet-600">Schema</Badge>
                    )}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Issues summary across all pages */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-amber-500" /> Issues Across All Pages
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Missing HTTPS", count: Object.values(snapshots).filter((s) => !s.meta?.https).length, color: "#ef4444", icon: AlertCircle },
            { label: "Missing Viewport", count: Object.values(snapshots).filter((s) => !s.meta?.hasViewport).length, color: "#f59e0b", icon: AlertTriangle },
            { label: "Missing Schema", count: Object.values(snapshots).filter((s) => !s.meta?.hasSchema).length, color: "#8b5cf6", icon: Lightbulb },
            { label: "Images No Alt", count: Object.values(snapshots).reduce((sum, s) => sum + (s.meta?.imagesNoAlt || 0), 0), color: "#ec4899", icon: AlertCircle },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border p-3 text-center">
              <item.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: item.color }} />
              <div className="text-xl font-bold" style={{ color: item.color }}>{item.count}</div>
              <div className="text-[10px] text-muted-foreground uppercase">{item.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
