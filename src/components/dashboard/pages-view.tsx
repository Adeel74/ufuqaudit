"use client";

import * as React from "react";
import {
  useAudit, ViewHeader, EmptyAudit, StatCard,
} from "@/components/dashboard/shared";
import type { PageData } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Search, ArrowUp, ArrowDown, ArrowUpDown, Globe, Gauge, Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SCROLLBAR_CLS =
  "max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent";

function statusColor(code?: number): string {
  if (!code) return "text-slate-500 bg-slate-100 dark:bg-slate-800/40";
  if (code >= 200 && code < 300) {
    return "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400";
  }
  if (code >= 300 && code < 400) {
    return "text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400";
  }
  return "text-red-700 bg-red-100 dark:bg-red-950/40 dark:text-red-400";
}

type SortKey = "wordCount" | "loadTimeMs" | "pageSizeKb" | null;

export function PagesView() {
  const audit = useAudit();
  const [search, setSearch] = React.useState("");
  const [indexable, setIndexable] = React.useState<"all" | "yes" | "no">(
    "all",
  );
  const [sortKey, setSortKey] = React.useState<SortKey>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  if (!audit) return <EmptyAudit msg="Run an audit to see crawled pages." />;

  const pages: PageData[] = audit.pages ?? [];

  const filtered = pages.filter((p) => {
    if (indexable === "yes" && !p.indexable) return false;
    if (indexable === "no" && p.indexable) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${p.url} ${p.title ?? ""} ${p.h1 ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const av = (a[sortKey] as number | undefined) ?? 0;
    const bv = (b[sortKey] as number | undefined) ?? 0;
    return sortDir === "asc" ? av - bv : bv - av;
  });

  function toggleSort(k: "wordCount" | "loadTimeMs" | "pageSizeKb") {
    if (sortKey === k) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(k);
      setSortDir("desc");
    }
  }

  const indexableCount = pages.filter((p) => p.indexable).length;
  const indexablePct = pages.length
    ? Math.round((indexableCount / pages.length) * 100)
    : 0;
  const avgLoad = pages.length
    ? Math.round(
        pages.reduce((s, p) => s + (p.loadTimeMs ?? 0), 0) / pages.length,
      )
    : 0;
  const avgWords = pages.length
    ? Math.round(
        pages.reduce((s, p) => s + (p.wordCount ?? 0), 0) / pages.length,
      )
    : 0;

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Pages Crawled"
        subtitle={`${audit.pagesCrawled} pages · ${audit.url}`}
        icon={FileText}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pages Crawled"
          value={audit.pagesCrawled}
          icon={Globe}
          hint="Total discovered"
        />
        <StatCard
          label="Indexable"
          value={`${indexablePct}%`}
          icon={FileText}
          hint={`${indexableCount} of ${pages.length} pages`}
          color={indexablePct >= 80 ? "#10b981" : indexablePct >= 50 ? "#f59e0b" : "#ef4444"}
        />
        <StatCard
          label="Avg Load Time"
          value={`${avgLoad}ms`}
          icon={Gauge}
          hint="Across all pages"
          color={avgLoad > 1500 ? "#ef4444" : "#f59e0b"}
        />
        <StatCard
          label="Avg Word Count"
          value={avgWords}
          icon={Type}
          hint="Words per page"
          color={avgWords < 300 ? "#ef4444" : "#10b981"}
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search URL, title or H1…"
              className="pl-9"
            />
          </div>
          <Select
            value={indexable}
            onValueChange={(v) =>
              setIndexable(v as "all" | "yes" | "no")
            }
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All pages</SelectItem>
              <SelectItem value="yes">Indexable only</SelectItem>
              <SelectItem value="no">Non-indexable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className={SCROLLBAR_CLS}>
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead className="min-w-[220px]">URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="min-w-[160px]">Title</TableHead>
                <TableHead className="min-w-[140px]">H1</TableHead>
                <SortableHead
                  label="Words"
                  active={sortKey === "wordCount"}
                  dir={sortDir}
                  onClick={() => toggleSort("wordCount")}
                />
                <SortableHead
                  label="Load (ms)"
                  active={sortKey === "loadTimeMs"}
                  dir={sortDir}
                  onClick={() => toggleSort("loadTimeMs")}
                />
                <SortableHead
                  label="Size (KB)"
                  active={sortKey === "pageSizeKb"}
                  dir={sortDir}
                  onClick={() => toggleSort("pageSizeKb")}
                />
                <TableHead>Indexable</TableHead>
                <TableHead>Schema</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="zebra">
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-sm text-muted-foreground py-12"
                  >
                    No pages match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((p, i) => (
                  <PageRow key={p.url + ":" + i} page={p} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function SortableHead({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <TableHead
      className="cursor-pointer select-none"
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          dir === "asc" ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />
        )}
      </span>
    </TableHead>
  );
}

function PageRow({ page }: { page: PageData }) {
  return (
    <TableRow>
      <TableCell className="max-w-[260px]">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="truncate text-xs font-medium cursor-help">
              {page.url}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[400px]">
            <span className="break-all">{page.url}</span>
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums",
            statusColor(page.statusCode),
          )}
        >
          {page.statusCode ?? "—"}
        </span>
      </TableCell>
      <TableCell className="max-w-[200px]">
        <div className="truncate text-xs">{page.title || "—"}</div>
      </TableCell>
      <TableCell className="max-w-[180px]">
        <div className="truncate text-xs">{page.h1 || "—"}</div>
      </TableCell>
      <TableCell className="text-xs tabular-nums">
        {page.wordCount ?? "—"}
      </TableCell>
      <TableCell className="text-xs tabular-nums">
        {page.loadTimeMs ?? "—"}
      </TableCell>
      <TableCell className="text-xs tabular-nums">
        {page.pageSizeKb ?? "—"}
      </TableCell>
      <TableCell>
        {page.indexable ? (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-transparent">
            Yes
          </Badge>
        ) : (
          <Badge variant="outline">No</Badge>
        )}
      </TableCell>
      <TableCell>
        {page.hasSchema ? (
          <span className="text-emerald-600 font-semibold">✓</span>
        ) : (
          <span className="text-muted-foreground">✗</span>
        )}
      </TableCell>
    </TableRow>
  );
}
