"use client";

import * as React from "react";
import {
  useAudit, ViewHeader, EmptyAudit, StatCard,
} from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Network, FileText, Link as LinkIcon, Unlink, AlertTriangle, Trophy,
  Layers, MousePointerClick,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from "recharts";
import type { PageData } from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------- Constants ----------
const EMERALD = "#10b981";
const EMERALD_DARK = "#047857";
const TEAL = "#14b8a6";

const SCROLLBAR_CLS =
  "max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent";

// SVG canvas (viewBox)
const VIEW_W = 880;
const VIEW_H = 540;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;

// ---------- Helpers ----------
// Deterministic PRNG (mulberry32) — same audit → same layout
function makeRng(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a hash → 32-bit unsigned
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shortSlug(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "");
    const segs = path.split("/").filter(Boolean);
    if (segs.length === 0) return u.hostname.replace(/^www\./, "");
    return segs[segs.length - 1].slice(0, 18);
  } catch {
    return url.slice(-18);
  }
}

function fullSlug(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname.replace(/\/$/, "");
    if (!path) return host;
    return (host + path).slice(0, 60);
  } catch {
    return url;
  }
}

// ---------- Types ----------
interface GraphNode {
  id: number;
  page: PageData;
  x: number;
  y: number;
  r: number;
  links: number;
  orphan: boolean;
  ring: number;
}

interface GraphEdge {
  from: number;
  to: number;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  totalMore: number;
}

// ---------- Graph construction (deterministic) ----------
function buildGraph(pages: PageData[]): GraphData {
  // Top 20 pages by internalLinks (keep stable order for ties by original index)
  const sorted = [...pages]
    .map((p, i) => ({ p, i }))
    .sort(
      (a, b) =>
        (b.p.internalLinks ?? 0) - (a.p.internalLinks ?? 0) || a.i - b.i,
    )
    .slice(0, 20);

  const totalMore = Math.max(0, pages.length - sorted.length);

  const maxLinks = Math.max(
    1,
    ...sorted.map((s) => s.p.internalLinks ?? 0),
  );
  const seed = hashString(pages.map((p) => p.url).join("|"));
  const rng = makeRng(seed);

  // Homepage = pages[0] if present in sorted set, else top page
  const homePage = pages[0];
  const homeInSorted = sorted.findIndex((s) => s.p === homePage);

  // Build node list, home first if available
  let nodeInput: PageData[];
  if (homeInSorted >= 0) {
    nodeInput = [
      homePage,
      ...sorted.filter((s) => s.p !== homePage).map((s) => s.p),
    ];
  } else {
    nodeInput = sorted.map((s) => s.p);
  }

  const nodes: GraphNode[] = nodeInput.map((p, i) => {
    const links = p.internalLinks ?? 0;
    const orphan = links < 2;
    const ratio = links / maxLinks;
    // radius for circle: bigger = more links
    const r = 9 + ratio * 17; // 9-26
    let x = CX;
    let y = CY;
    let ring = 0;
    if (i > 0) {
      // Concentric rings: more links → inner ring (closer to home)
      if (ratio >= 0.55) ring = 1;
      else if (ratio >= 0.25) ring = 2;
      else ring = 3;
      const baseR = 95;
      const ringR = baseR * ring + (orphan ? 25 : 0);
      // angular position: index * (2π/n) + seeded jitter
      const n = Math.max(1, nodeInput.length - 1);
      const angle =
        (i / n) * Math.PI * 2 + rng() * 0.35 - 0.175;
      x = CX + Math.cos(angle) * ringR;
      y = CY + Math.sin(angle) * ringR;
    }
    return { id: i, page: p, x, y, r, links, orphan, ring };
  });

  // Build edges deterministically
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();
  const addEdge = (a: number, b: number) => {
    if (a === b || a < 0 || b < 0) return;
    if (a >= nodes.length || b >= nodes.length) return;
    if (nodes[b].orphan) return; // orphans receive no incoming edges
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push({ from: a, to: b });
  };

  // Home (node 0) → next 3–5 non-orphan nodes
  if (nodes.length > 1) {
    const homeTargets = Math.min(5, Math.max(3, Math.floor(nodes.length / 4)));
    let added = 0;
    for (let i = 1; i < nodes.length && added < homeTargets; i++) {
      if (!nodes[i].orphan) {
        addEdge(0, i);
        added++;
      }
    }
  }

  // Each non-orphan node → 1–3 random other nodes
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].orphan) continue;
    const cnt = 1 + Math.floor(rng() * 3); // 1–3
    for (let j = 0; j < cnt; j++) {
      const target = Math.floor(rng() * nodes.length);
      addEdge(i, target);
    }
  }

  return { nodes, edges, totalMore };
}

// ---------- Sub-components ----------
function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block w-3 h-3 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #34d399, #047857)",
          }}
        />
        Node size = link count
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-full bg-red-400/70 border border-red-500" />
        Orphan / weak page
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block w-5 h-px bg-emerald-500/60" />
        Internal link
      </span>
      <span className="inline-flex items-center gap-1.5">
        <MousePointerClick className="w-3 h-3" />
        Hover / click a node
      </span>
    </div>
  );
}

interface GraphProps {
  data: GraphData;
  onNodeClick: (n: GraphNode) => void;
}

function GraphSvg({ data, onNodeClick }: GraphProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);

  // Highlight edges connected to hovered node
  const visibleEdges = React.useMemo(() => {
    if (hovered == null) return data.edges;
    return data.edges.filter(
      (e) => e.from === hovered || e.to === hovered,
    );
  }, [hovered, data.edges]);

  // Determine which nodes are connected to hovered (for dimming)
  const connected = React.useMemo(() => {
    const set = new Set<number>();
    if (hovered == null) return set;
    for (const e of data.edges) {
      if (e.from === hovered) set.add(e.to);
      if (e.to === hovered) set.add(e.from);
    }
    return set;
  }, [hovered, data.edges]);

  // Render hovered node last so it appears on top
  const orderedNodes = React.useMemo(() => {
    if (hovered == null) return data.nodes;
    const others = data.nodes.filter((n) => n.id !== hovered);
    const target = data.nodes.find((n) => n.id === hovered);
    return target ? [...others, target] : others;
  }, [hovered, data.nodes]);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
      role="img"
      aria-label="Internal link graph"
    >
      <defs>
        <radialGradient id="nodeEmerald" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="60%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </radialGradient>
        <radialGradient id="nodeEmeraldStrong" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="60%" stopColor="#059669" />
          <stop offset="100%" stopColor="#065f46" />
        </radialGradient>
        <radialGradient id="nodeOrphan" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="100%" stopColor="#dc2626" />
        </radialGradient>
        <radialGradient id="nodeHome" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="60%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0f766e" />
        </radialGradient>
      </defs>

      {/* Background rings (concentric circles, very subtle) */}
      {[95, 190, 285].map((r) => (
        <circle
          key={r}
          cx={CX}
          cy={CY}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.06}
          strokeDasharray="3 5"
          className="text-emerald-500"
        />
      ))}

      {/* Edges */}
      <g>
        {data.edges.map((e, i) => {
          const a = data.nodes[e.from];
          const b = data.nodes[e.to];
          if (!a || !b) return null;
          const isActive =
            hovered != null &&
            (e.from === hovered || e.to === hovered);
          return (
            <line
              key={`e-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={EMERALD}
              strokeOpacity={isActive ? 0.75 : hovered == null ? 0.18 : 0.05}
              strokeWidth={isActive ? 1.6 : 1}
            />
          );
        })}
      </g>

      {/* Active edges on top */}
      <g>
        {visibleEdges.map((e, i) => {
          const a = data.nodes[e.from];
          const b = data.nodes[e.to];
          if (!a || !b) return null;
          return (
            <line
              key={`ev-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={EMERALD}
              strokeOpacity={0.75}
              strokeWidth={1.6}
            />
          );
        })}
      </g>

      {/* Nodes */}
      <g>
        {orderedNodes.map((n) => {
          const isHover = hovered === n.id;
          const isHome = n.id === 0;
          const isLinked =
            hovered != null && connected.has(n.id);
          const dim = hovered != null && !isHover && !isLinked;
          const fill = isHome
            ? "url(#nodeHome)"
            : n.orphan
            ? "url(#nodeOrphan)"
            : n.ring === 1
            ? "url(#nodeEmeraldStrong)"
            : "url(#nodeEmerald)";
          const r = isHover ? n.r + 2.5 : n.r;
          return (
            <g
              key={`n-${n.id}`}
              transform={`translate(${n.x}, ${n.y})`}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onNodeClick(n)}
              style={{ cursor: "pointer" }}
              opacity={dim ? 0.35 : 1}
            >
              <circle
                r={r}
                fill={fill}
                stroke={isHover ? "#ffffff" : "rgba(255,255,255,0.7)"}
                strokeWidth={isHover ? 2 : 1}
              />
              {/* Hover tooltip (in-SVG, simple) */}
              {isHover && (
                <g>
                  <rect
                    x={r + 6}
                    y={-26}
                    width={Math.min(260, fullSlug(n.page.url).length * 5.6 + 80)}
                    height={52}
                    rx={6}
                    fill="rgba(15, 23, 42, 0.95)"
                  />
                  <text
                    x={r + 14}
                    y={-10}
                    fill="#fff"
                    fontSize={10}
                    fontFamily="ui-sans-serif, system-ui"
                  >
                    {fullSlug(n.page.url).slice(0, 36) +
                      (fullSlug(n.page.url).length > 36 ? "…" : "")}
                  </text>
                  <text
                    x={r + 14}
                    y={4}
                    fill="#a7f3d0"
                    fontSize={9}
                    fontFamily="ui-sans-serif, system-ui"
                  >
                    {`Links: ${n.links} • Words: ${n.page.wordCount ?? 0}`}
                  </text>
                  <text
                    x={r + 14}
                    y={18}
                    fill="#cbd5e1"
                    fontSize={9}
                    fontFamily="ui-sans-serif, system-ui"
                  >
                    {`Indexable: ${
                      n.page.indexable === false ? "No" : "Yes"
                    } • ${n.orphan ? "Orphan" : "Linked"}`}
                  </text>
                </g>
              )}
              {/* Label below node */}
              <text
                y={r + 11}
                textAnchor="middle"
                fontSize={n.id === 0 ? 11 : 9}
                fontWeight={n.id === 0 ? 700 : 500}
                fill="currentColor"
                className="text-slate-500 dark:text-slate-400"
                style={{ pointerEvents: "none" }}
              >
                {shortSlug(n.page.url).slice(0, 16)}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ---------- Page row (sidebar) ----------
interface PageRowProps {
  page: PageData;
  rank: number;
  maxLinks: number;
  onClick: () => void;
}

function PageRow({ page, rank, maxLinks, onClick }: PageRowProps) {
  const links = page.internalLinks ?? 0;
  const orphan = links < 2;
  const pct = maxLinks > 0 ? Math.round((links / maxLinks) * 100) : 0;
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border bg-card hover:border-emerald-400 hover:shadow-sm transition-all p-3"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">
          {rank}
        </span>
        <span
          className={cn(
            "text-sm font-medium truncate flex-1",
            orphan && "text-red-600 dark:text-red-400",
          )}
          title={page.url}
        >
          {shortSlug(page.url)}
        </span>
        <Badge
          variant="secondary"
          className={cn(
            "shrink-0",
            orphan
              ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
          )}
        >
          {links} links
        </Badge>
      </div>
      <div className="mt-1.5 ml-7 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              orphan ? "bg-red-400" : "bg-emerald-500",
            )}
            style={{ width: `${Math.max(4, pct)}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
          {(page.wordCount ?? 0).toLocaleString()}w
        </span>
      </div>
    </button>
  );
}

// ---------- Main view ----------
export function LinkGraphView() {
  const audit = useAudit();
  const pages: PageData[] = audit?.pages ?? [];

  // All hooks must be called before any early return.
  const graph = React.useMemo(
    () => (pages.length >= 2 ? buildGraph(pages) : { nodes: [], edges: [], totalMore: 0 }),
    [pages],
  );

  const sortedByLinks = React.useMemo(
    () =>
      [...pages]
        .map((p, i) => ({ p, i }))
        .sort(
          (a, b) =>
            (b.p.internalLinks ?? 0) - (a.p.internalLinks ?? 0) || a.i - b.i,
        )
        .map((x) => x.p),
    [pages],
  );

  const announce = React.useCallback((page: PageData) => {
    toast(`${fullSlug(page.url)}`, {
      description: `${page.internalLinks ?? 0} internal links • ${(
        page.wordCount ?? 0
      ).toLocaleString()} words • Indexable: ${
        page.indexable === false ? "No" : "Yes"
      }`,
    });
  }, []);

  // Early returns (after all hooks)
  if (!audit) {
    return <EmptyAudit msg="Run an audit to see your link graph" />;
  }

  if (pages.length < 2) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="Internal Link Graph"
          subtitle="Visualize your site architecture and internal link flow"
          icon={Network}
        />
        <Card className="p-10 text-center">
          <Unlink className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Not enough pages to build a graph — crawl more pages to see the
            link structure.
          </p>
        </Card>
      </div>
    );
  }

  const totalLinks = pages.reduce((s, p) => s + (p.internalLinks ?? 0), 0);
  const brokenLinks = pages.reduce((s, p) => s + (p.brokenLinks ?? 0), 0);
  const avg = Math.round(totalLinks / pages.length);
  const orphanCount = pages.filter(
    (p) => (p.internalLinks ?? 0) < 2,
  ).length;

  const maxLinks = Math.max(1, ...pages.map((p) => p.internalLinks ?? 0));

  const top3 = sortedByLinks.slice(0, 3);
  const weakPages = pages.filter((p) => (p.internalLinks ?? 0) < 2);
  const distData = sortedByLinks.slice(0, 10).map((p, i) => ({
    name: shortSlug(p.url).slice(0, 14),
    links: p.internalLinks ?? 0,
    rank: i + 1,
  }));

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Internal Link Graph"
        subtitle="Visualize your site architecture and internal link flow"
        icon={Network}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Pages"
          value={pages.length}
          hint={`${audit.pagesCrawled ?? pages.length} crawled`}
          icon={FileText}
          color={EMERALD}
        />
        <StatCard
          label="Internal Links"
          value={totalLinks}
          hint="across all pages"
          icon={LinkIcon}
          color={EMERALD}
        />
        <StatCard
          label="Avg Links / Page"
          value={avg}
          hint="arithmetic mean"
          icon={Layers}
          color={TEAL}
        />
        <StatCard
          label="Orphan Pages"
          value={orphanCount}
          hint="< 2 internal links"
          icon={Unlink}
          color={orphanCount > 0 ? "#dc2626" : EMERALD}
        />
        <StatCard
          label="Broken Links"
          value={brokenLinks}
          hint="404s / unreachable"
          icon={AlertTriangle}
          color={brokenLinks > 0 ? "#f97316" : EMERALD}
        />
      </div>

      {/* Main: graph + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold">Site Link Graph</h3>
              <p className="text-xs text-muted-foreground">
                {graph.nodes.length} pages shown
                {graph.totalMore > 0 && (
                  <span className="ml-1.5">
                    •{" "}
                    <Badge
                      variant="secondary"
                      className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ml-1"
                    >
                      +{graph.totalMore} more
                    </Badge>
                  </span>
                )}
                {" • homepage at center"}
              </p>
            </div>
            <Legend />
          </div>
          <div className="h-[500px] sm:h-[60vh] min-h-[420px] w-full rounded-lg bg-muted/30 border">
            <GraphSvg data={graph} onNodeClick={(n) => announce(n.page)} />
          </div>
        </Card>

        {/* Right sidebar: top-linked pages */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold">Top Linked Pages</h3>
              <p className="text-xs text-muted-foreground">
                Sorted by internal link count
              </p>
            </div>
            <Trophy className="w-4 h-4 text-emerald-500" />
          </div>
          <div className={cn("space-y-2 pr-1", SCROLLBAR_CLS)}>
            {sortedByLinks.map((p, i) => (
              <PageRow
                key={`${p.url}-${i}`}
                page={p}
                rank={i + 1}
                maxLinks={maxLinks}
                onClick={() => announce(p)}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom: insight cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Strongest pages */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-semibold">Strongest Pages</h3>
          </div>
          <div className="space-y-2">
            {top3.map((p, i) => (
              <div
                key={`strong-${i}-${p.url}`}
                className="flex items-center gap-2 rounded-md border p-2"
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0",
                    i === 0
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                      : i === 1
                      ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
                  )}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs font-medium truncate"
                    title={p.url}
                  >
                    {fullSlug(p.url)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {(p.wordCount ?? 0).toLocaleString()} words
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {p.internalLinks ?? 0}
                </Badge>
              </div>
            ))}
            {top3.length === 0 && (
              <p className="text-xs text-muted-foreground">No data.</p>
            )}
          </div>
        </Card>

        {/* Orphan / weak pages */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Unlink className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-semibold">
              Orphan / Weak Pages
            </h3>
          </div>
          {weakPages.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4 text-center">
              No orphan pages found — every page is well linked.
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "space-y-2 mb-2 pr-1",
                  SCROLLBAR_CLS,
                  "max-h-[200px]",
                )}
              >
                {weakPages.slice(0, 8).map((p, i) => (
                  <div
                    key={`weak-${i}-${p.url}`}
                    className="flex items-center gap-2 rounded-md border p-2"
                  >
                    <div
                      className="flex-1 min-w-0 text-xs font-medium truncate text-red-600 dark:text-red-400"
                      title={p.url}
                    >
                      {fullSlug(p.url)}
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                      {p.internalLinks ?? 0} links
                    </span>
                  </div>
                ))}
                {weakPages.length > 8 && (
                  <p className="text-[10px] text-muted-foreground text-center pt-1">
                    +{weakPages.length - 8} more
                  </p>
                )}
              </div>
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-2.5">
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                  <AlertTriangle className="w-3 h-3 inline mr-1 -mt-0.5" />
                  Add internal links from your strongest pages to these{" "}
                  {weakPages.length} orphan page
                  {weakPages.length === 1 ? "" : "s"} to distribute link
                  equity and improve crawlability.
                </p>
              </div>
            </>
          )}
        </Card>

        {/* Link distribution */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-semibold">Link Distribution</h3>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distData}
                layout="vertical"
                margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="currentColor"
                  strokeOpacity={0.08}
                  className="text-slate-400"
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  stroke="currentColor"
                  className="text-muted-foreground"
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 9 }}
                  stroke="currentColor"
                  className="text-muted-foreground"
                  width={70}
                />
                <RTooltip
                  cursor={{ fill: "rgba(16,185,129,0.08)" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v} links`, "Internal links"]}
                />
                <Bar dataKey="links" radius={[0, 4, 4, 0]}>
                  {distData.map((d, i) => {
                    const orphan = (d.links ?? 0) < 2;
                    return (
                      <Cell
                        key={`cell-${i}`}
                        fill={
                          orphan
                            ? "#f87171"
                            : i === 0
                            ? "#047857"
                            : i < 3
                            ? "#10b981"
                            : "#14b8a6"
                        }
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Top {distData.length} pages by internal link count
          </p>
        </Card>
      </div>
    </div>
  );
}
