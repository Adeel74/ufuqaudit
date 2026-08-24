"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import { ViewHeader, useAudit } from "@/components/dashboard/shared";
import { PagePreview } from "@/components/dashboard/page-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Eye } from "lucide-react";

export function VisualPreviewView() {
  const audit = useAudit();
  const [selectedUrl, setSelectedUrl] = React.useState<string>("");

  React.useEffect(() => {
    if (audit?.pages?.[0]) setSelectedUrl(audit.pages[0].url);
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

  return (
    <div className="space-y-6">
      <ViewHeader title="Visual Preview" subtitle="Page screenshots with SEO issue overlays" icon={Eye} />

      {/* Page selector */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={selectedUrl}
              onChange={(e) => setSelectedUrl(e.target.value)}
              className="w-full pl-9 h-10 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {audit.pages.map((p) => (
                <option key={p.url} value={p.url}>{p.url.replace(/^https?:\/\//, "")}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Page preview with highlights */}
      {selectedUrl && <PagePreview url={selectedUrl} />}
    </div>
  );
}
