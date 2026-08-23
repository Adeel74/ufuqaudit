"use client";

import * as React from "react";
import { ViewHeader } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Terminal, Copy, Plus, Loader2, KeyRound, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronRight, Send, Zap, Gauge,
  Clock, Ban, Activity as ActivityIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------- Types ----------
type Method = "GET" | "POST" | "DELETE" | "PUT";

interface ParamRow {
  name: string;
  type: "string" | "number" | "boolean" | "object";
  required: boolean;
  description: string;
}

interface Endpoint {
  id: string;
  method: Method;
  path: string;
  description: string;
  params: ParamRow[];
  curl: string;
  response: string; // pretty-printed JSON string
}

interface EndpointGroup {
  category: string;
  endpoints: Endpoint[];
}

interface ApiKey {
  id: string;
  name: string;
  key: string; // masked
  created: string;
  lastUsed: string | null;
  requests: number;
  status: "active" | "revoked";
}

interface KeysResponse {
  keys: ApiKey[];
}

interface CreateKeyResponse {
  key: ApiKey;
  fullKey: string;
}

// ---------- Constants ----------
const EMERALD_BTN = "bg-emerald-600 hover:bg-emerald-700 text-white";

const SCROLLBAR_CLS =
  "max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent";

const BASE_URL = "https://api.ufuqaudit.app/v1";

// Method badge styles (no indigo/blue — emerald/amber/red/slate)
const METHOD_BADGE: Record<Method, string> = {
  GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  POST: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  PUT: "bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
};

// Mock sample response — used by the Try-it panel for any endpoint
const MOCK_SAMPLE_RESPONSE = `{
  "ok": true,
  "auditId": "aud_3f9a2c1",
  "url": "https://example.com",
  "overallScore": 87,
  "categories": {
    "technical": 92,
    "content": 88,
    "aeo": 81,
    "geo": 85,
    "performance": 90,
    "security": 86
  },
  "issues": 24,
  "critical": 2,
  "errors": 6,
  "warnings": 11,
  "opportunities": 5,
  "timestamp": "2025-01-14T09:32:11.000Z"
}`;

// ---------- Endpoint docs (10 endpoints across 5 groups) ----------
const ENDPOINT_GROUPS: EndpointGroup[] = [
  {
    category: "Audits",
    endpoints: [
      {
        id: "audit-run",
        method: "POST",
        path: "/api/audit/run",
        description: "Start a new website audit for the given URL.",
        params: [
          { name: "url", type: "string", required: true, description: "Absolute URL of the site to audit (https://…)." },
          { name: "engines", type: "object", required: false, description: "Array of engine keys to run. Default: all six." },
          { name: "depth", type: "number", required: false, description: "Crawl depth (1–10). Default: 3." },
        ],
        curl: `curl -X POST ${BASE_URL}/api/audit/run \\
  -H "Authorization: Bearer ufa_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com","depth":3}'`,
        response: `{
  "auditId": "aud_3f9a2c1",
  "status": "queued",
  "estimatedSeconds": 18
}`,
      },
      {
        id: "audit-list",
        method: "GET",
        path: "/api/audit/list",
        description: "List past audits for the current workspace, newest first.",
        params: [
          { name: "limit", type: "number", required: false, description: "Max audits to return (1–100). Default: 20." },
          { name: "cursor", type: "string", required: false, description: "Pagination cursor from the previous response." },
        ],
        curl: `curl ${BASE_URL}/api/audit/list?limit=20 \\
  -H "Authorization: Bearer ufa_live_xxxx"`,
        response: `{
  "audits": [
    { "id": "aud_3f9a2c1", "url": "https://example.com", "score": 87, "createdAt": "2025-01-14T09:32:11Z" }
  ],
  "nextCursor": null
}`,
      },
      {
        id: "audit-get",
        method: "GET",
        path: "/api/audit/get",
        description: "Fetch a single audit by ID, including the full issue list and category scores.",
        params: [
          { name: "id", type: "string", required: true, description: "The audit ID (aud_…)." },
          { name: "includeIssues", type: "boolean", required: false, description: "Include the issues array. Default: true." },
        ],
        curl: `curl ${BASE_URL}/api/audit/get?id=aud_3f9a2c1 \\
  -H "Authorization: Bearer ufa_live_xxxx"`,
        response: `{
  "id": "aud_3f9a2c1",
  "url": "https://example.com",
  "overallScore": 87,
  "categories": { "technical": 92, "content": 88, "aeo": 81 },
  "issues": 24
}`,
      },
    ],
  },
  {
    category: "Issues",
    endpoints: [
      {
        id: "issues-list",
        method: "GET",
        path: "/api/issues",
        description: "List issues detected during an audit, filtered by severity and category.",
        params: [
          { name: "auditId", type: "string", required: true, description: "Audit ID to scope issues to." },
          { name: "severity", type: "string", required: false, description: "Filter: critical | error | warning | opportunity." },
          { name: "category", type: "string", required: false, description: "Filter: technical | content | aeo | geo | performance | security." },
        ],
        curl: `curl "${BASE_URL}/api/issues?auditId=aud_3f9a2c1&severity=critical" \\
  -H "Authorization: Bearer ufa_live_xxxx"`,
        response: `{
  "issues": [
    { "id": "iss_1", "title": "Missing meta description", "severity": "error", "category": "technical" }
  ],
  "total": 1
}`,
      },
      {
        id: "issues-fix",
        method: "POST",
        path: "/api/issues/fix",
        description: "Mark an issue as fixed (resolved) on the audit report.",
        params: [
          { name: "issueId", type: "string", required: true, description: "Issue ID to mark fixed." },
          { name: "note", type: "string", required: false, description: "Optional resolution note." },
        ],
        curl: `curl -X POST ${BASE_URL}/api/issues/fix \\
  -H "Authorization: Bearer ufa_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"issueId":"iss_1","note":"Added meta description"}'`,
        response: `{
  "ok": true,
  "issueId": "iss_1",
  "status": "fixed"
}`,
      },
    ],
  },
  {
    category: "Keywords",
    endpoints: [
      {
        id: "keywords-list",
        method: "GET",
        path: "/api/keywords",
        description: "List tracked keywords with current SERP position, volume, and difficulty.",
        params: [
          { name: "limit", type: "number", required: false, description: "Max keywords to return. Default: 50." },
          { name: "sort", type: "string", required: false, description: "Sort key: position | volume | difficulty." },
        ],
        curl: `curl "${BASE_URL}/api/keywords?sort=position&limit=50" \\
  -H "Authorization: Bearer ufa_live_xxxx"`,
        response: `{
  "keywords": [
    { "keyword": "aeo optimization", "position": 3, "volume": 4400, "difficulty": 38 }
  ],
  "total": 1
}`,
      },
    ],
  },
  {
    category: "Backlinks",
    endpoints: [
      {
        id: "backlinks-list",
        method: "GET",
        path: "/api/backlinks",
        description: "List discovered backlinks with source domain authority and anchor text.",
        params: [
          { name: "limit", type: "number", required: false, description: "Max backlinks to return. Default: 50." },
          { name: "type", type: "string", required: false, description: "Filter: dofollow | nofollow." },
        ],
        curl: `curl "${BASE_URL}/api/backlinks?limit=50&type=dofollow" \\
  -H "Authorization: Bearer ufa_live_xxxx"`,
        response: `{
  "backlinks": [
    { "source": "github.com", "target": "/docs", "da": 96, "type": "dofollow", "anchor": "API reference" }
  ],
  "total": 1
}`,
      },
    ],
  },
  {
    category: "Reports",
    endpoints: [
      {
        id: "ai-recommend",
        method: "POST",
        path: "/api/ai/recommend",
        description: "Generate AI-powered fix recommendations for an audit or specific issue set.",
        params: [
          { name: "auditId", type: "string", required: true, description: "Audit ID to generate recommendations for." },
          { name: "issueIds", type: "object", required: false, description: "Restrict to a subset of issue IDs." },
        ],
        curl: `curl -X POST ${BASE_URL}/api/ai/recommend \\
  -H "Authorization: Bearer ufa_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"auditId":"aud_3f9a2c1"}'`,
        response: `{
  "auditId": "aud_3f9a2c1",
  "recommendations": [
    { "issueId": "iss_1", "priority": "high", "title": "Add a meta description", "steps": ["Draft 140–160 chars…"] }
  ]
}`,
      },
      {
        id: "email-send",
        method: "POST",
        path: "/api/email/send",
        description: "Send a branded audit report email to one or more recipients.",
        params: [
          { name: "to", type: "string", required: true, description: "Primary recipient email address." },
          { name: "subject", type: "string", required: true, description: "Email subject line." },
          { name: "auditId", type: "string", required: true, description: "Audit to attach as a PDF report." },
          { name: "includeAiPlan", type: "boolean", required: false, description: "Include the AI action plan. Default: true." },
        ],
        curl: `curl -X POST ${BASE_URL}/api/email/send \\
  -H "Authorization: Bearer ufa_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"to":"client@example.com","subject":"Audit Report","auditId":"aud_3f9a2c1"}'`,
        response: `{
  "ok": true,
  "sent": true,
  "messageId": "msg_01HFXY9…",
  "to": "client@example.com",
  "timestamp": "2025-01-14T09:32:11.000Z",
  "includeReport": true
}`,
      },
    ],
  },
];

// ---------- Helpers ----------
function relTime(iso: string | null): string {
  if (!iso) return "Never";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "Never";
  const diff = Date.now() - t;
  if (diff < 0) return "just now";
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function fmtDate(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtCompact(v: number): string {
  if (!Number.isFinite(v)) return "0";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toLocaleString();
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// =================== Sub-components ===================

// Endpoint row — expandable to reveal params + curl + JSON response.
function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40 transition-colors"
      >
        <span
          className={cn(
            "inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide w-16 shrink-0",
            METHOD_BADGE[ep.method],
          )}
        >
          {ep.method}
        </span>
        <code className="text-xs sm:text-sm font-mono text-foreground truncate">
          {ep.path}
        </code>
        <span className="hidden sm:block text-xs text-muted-foreground ml-auto truncate">
          {ep.description}
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t bg-muted/20 p-4 space-y-4">
          {/* Description (mobile-visible on collapse) */}
          <p className="sm:hidden text-xs text-muted-foreground">{ep.description}</p>

          {/* Parameters table */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Parameters
            </h4>
            <div className="rounded-lg border overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 text-xs">Name</TableHead>
                    <TableHead className="h-8 text-xs w-20">Type</TableHead>
                    <TableHead className="h-8 text-xs w-20">Required</TableHead>
                    <TableHead className="h-8 text-xs">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="zebra">
                  {ep.params.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="py-2 text-xs font-mono font-medium align-top">
                        {p.name}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground align-top">
                        {p.type}
                      </TableCell>
                      <TableCell className="py-2 text-xs align-top">
                        {p.required ? (
                          <span className="text-red-600 dark:text-red-400 font-medium">Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground align-top">
                        {p.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* cURL example */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Example request
              </h4>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs text-emerald-700 dark:text-emerald-400"
                onClick={async () => {
                  const ok = await copyToClipboard(ep.curl);
                  if (ok) toast.success("cURL command copied");
                  else toast.error("Couldn’t copy — clipboard unavailable");
                }}
              >
                <Copy className="w-3 h-3 mr-1" /> Copy
              </Button>
            </div>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono whitespace-pre-wrap break-all">
              {ep.curl}
            </pre>
          </div>

          {/* JSON response */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Example response
            </h4>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
              {ep.response}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// Code-block with copy — for the Try-it panel.
function CodeBlock({
  label,
  children,
  onCopy,
}: {
  label: string;
  children: React.ReactNode;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </h4>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-xs text-emerald-700 dark:text-emerald-400"
          onClick={onCopy}
        >
          <Copy className="w-3 h-3 mr-1" /> Copy
        </Button>
      </div>
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
        {children}
      </pre>
    </div>
  );
}

// =================== Component ===================
export function ApiDocsView() {
  const [keys, setKeys] = React.useState<ApiKey[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Create-key dialog state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [createdKey, setCreatedKey] = React.useState<string | null>(null);

  // Revoke dialog state
  const [revokeTarget, setRevokeTarget] = React.useState<ApiKey | null>(null);
  const [revoking, setRevoking] = React.useState(false);

  // Try-it state
  const [tryMethod, setTryMethod] = React.useState<Method>("GET");
  const [tryPath, setTryPath] = React.useState("/api/audit/get?id=aud_3f9a2c1");
  const [trySending, setTrySending] = React.useState(false);
  const [tryResponse, setTryResponse] = React.useState<string>(MOCK_SAMPLE_RESPONSE);

  const fetchKeys = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/api-keys", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as KeysResponse;
      setKeys(Array.isArray(j.keys) ? j.keys : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load API keys";
      setError(msg);
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  // ---------- Create key ----------
  const openCreate = () => {
    setNewName("");
    setCreatedKey(null);
    setCreateOpen(true);
  };

  const onCreate = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Enter a name for the API key");
      return;
    }
    setCreating(true);
    try {
      const r = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string })?.error || `HTTP ${r.status}`);
      }
      const j = (await r.json()) as CreateKeyResponse;
      setKeys((prev) => [j.key, ...prev]);
      setCreatedKey(j.fullKey);
      toast.success(`API key "${name}" created`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create key";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  // ---------- Revoke key ----------
  const onConfirmRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      const r = await fetch(
        `/api/api-keys?id=${encodeURIComponent(revokeTarget.id)}`,
        { method: "DELETE" },
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setKeys((prev) =>
        prev.map((k) =>
          k.id === revokeTarget.id ? { ...k, status: "revoked" as const } : k,
        ),
      );
      toast.success(`Key "${revokeTarget.name}" revoked`);
      setRevokeTarget(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to revoke key";
      toast.error(msg);
    } finally {
      setRevoking(false);
    }
  };

  // ---------- Try-it ----------
  const onSendTry = async () => {
    const path = tryPath.trim();
    if (!path) {
      toast.error("Enter an endpoint path");
      return;
    }
    setTrySending(true);
    // Simulated call — does NOT actually hit the API per spec.
    await new Promise((res) => setTimeout(res, 600));
    setTryResponse(MOCK_SAMPLE_RESPONSE);
    setTrySending(false);
    toast.success("Sample response generated", {
      description: `${tryMethod} ${path}`,
    });
  };

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="API Documentation"
          subtitle="Build with the UfuqAudit API"
          icon={Terminal}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ---------- Error (only blocks the keys panel; docs always render) ----------
  return (
    <div className="space-y-6">
      <ViewHeader
        title="API Documentation"
        subtitle="Build with the UfuqAudit API"
        icon={Terminal}
      />

      {/* ---------- Base URL + Rate limits ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Base URL */}
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-muted-foreground">Base URL</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm font-mono text-foreground bg-muted px-3 py-1.5 rounded-md">
              {BASE_URL}
            </code>
            <Button
              size="sm"
              variant="outline"
              className="text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900"
              onClick={async () => {
                const ok = await copyToClipboard(BASE_URL);
                if (ok) toast.success("Base URL copied");
                else toast.error("Couldn’t copy — clipboard unavailable");
              }}
            >
              <Copy className="w-3.5 h-3.5 mr-1" /> Copy
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            All endpoints are prefixed with this base URL. Send your API key in the{" "}
            <code className="font-mono text-foreground">Authorization: Bearer</code> header.
          </p>
        </Card>

        {/* Rate limits */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-muted-foreground">Rate limits</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums">350</span>
            <span className="text-xs text-muted-foreground">/ 1,000 per hour</span>
          </div>
          <Progress
            value={35}
            className="mt-2 h-2 [&>div]:bg-emerald-500"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-muted-foreground">Pro plan</span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              35% used · resets in 42m
            </span>
          </div>
        </Card>
      </div>

      {/* ---------- 2-column main layout ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---------- Left: endpoint docs ---------- */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ActivityIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold">Endpoints</h3>
              </div>
              <Badge variant="outline" className="font-mono text-[11px]">
                {ENDPOINT_GROUPS.reduce((n, g) => n + g.endpoints.length, 0)} endpoints
              </Badge>
            </div>

            <div className={cn(SCROLLBAR_CLS, "space-y-5 pr-1")}>
              {ENDPOINT_GROUPS.map((group) => (
                <div key={group.category}>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    {group.category}
                  </h4>
                  <div className="space-y-2">
                    {group.endpoints.map((ep) => (
                      <EndpointCard key={ep.id} ep={ep} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ---------- Right: API keys + try-it (sticky) ---------- */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-4 space-y-4">
            {/* Error banner (only shows if the keys fetch failed) */}
            {error && (
              <Card className="p-4 border-red-200 dark:border-red-900/60">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">
                      Couldn’t load API keys
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={fetchKeys}
                  >
                    <Loader2 className="w-3 h-3 mr-1" /> Retry
                  </Button>
                </div>
              </Card>
            )}

            {/* API Keys */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-semibold">API Keys</h3>
                </div>
                <Button
                  size="sm"
                  className={EMERALD_BTN}
                  onClick={openCreate}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Create key
                </Button>
              </div>

              {keys.length === 0 ? (
                <div className="text-center py-8">
                  <KeyRound className="w-6 h-6 mx-auto text-muted-foreground opacity-40 mb-2" />
                  <p className="text-xs text-muted-foreground">No API keys yet</p>
                </div>
              ) : (
                <div className={cn(SCROLLBAR_CLS, "space-y-2 pr-1")}>
                  {keys.map((k) => (
                    <div
                      key={k.id}
                      className={cn(
                        "rounded-lg border p-3 transition-colors",
                        k.status === "revoked"
                          ? "opacity-60 bg-muted/20"
                          : "hover:bg-muted/40",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{k.name}</span>
                            {k.status === "active" ? (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 h-4 px-1.5 text-[10px] font-normal gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Active
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 h-4 px-1.5 text-[10px] font-normal gap-0.5">
                                <Ban className="w-2.5 h-2.5" /> Revoked
                              </Badge>
                            )}
                          </div>
                          <code className="block text-[11px] font-mono text-muted-foreground mt-1 truncate">
                            {k.key}
                          </code>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> {fmtDate(k.created)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5" /> {fmtCompact(k.requests)} reqs
                            </span>
                            <span className="flex items-center gap-1">
                              <ActivityIcon className="w-2.5 h-2.5" /> {relTime(k.lastUsed)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {k.status === "active" && (
                        <div className="mt-2 pt-2 border-t flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            onClick={() => setRevokeTarget(k)}
                          >
                            <Ban className="w-3 h-3 mr-1" /> Revoke
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Try-it panel */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold">Try it</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="try-method" className="text-xs">Method</Label>
                <Select
                  value={tryMethod}
                  onValueChange={(v) => setTryMethod(v as Method)}
                >
                  <SelectTrigger id="try-method" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 mt-3">
                <Label htmlFor="try-path" className="text-xs">Path</Label>
                <Input
                  id="try-path"
                  type="text"
                  placeholder="/api/audit/get?id=aud_3f9a2c1"
                  value={tryPath}
                  onChange={(e) => setTryPath(e.target.value)}
                  className="font-mono text-xs h-9"
                />
              </div>

              <Button
                className={cn(EMERALD_BTN, "w-full mt-3")}
                disabled={trySending}
                onClick={onSendTry}
              >
                {trySending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Send
                  </>
                )}
              </Button>

              <Separator className="my-4" />

              <CodeBlock
                label="Sample response"
                onCopy={async () => {
                  const ok = await copyToClipboard(tryResponse);
                  if (ok) toast.success("Response copied");
                  else toast.error("Couldn’t copy — clipboard unavailable");
                }}
              >
                {tryResponse}
              </CodeBlock>

              <p className="text-[10px] text-muted-foreground mt-2 flex items-start gap-1">
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-amber-500" />
                The Try-it panel returns a mock sample response — it doesn’t actually
                call the API. Use the cURL examples above to test real requests.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* ---------- Create-key dialog ---------- */}
      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreatedKey(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {createdKey ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Key created
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                      You won’t see this again
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400/90 mt-0.5">
                      Copy your key now and store it securely. We only show the full
                      value once for security.
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">API key</Label>
                  <pre className="bg-muted p-3 rounded-lg text-xs font-mono break-all whitespace-pre-wrap mt-1.5">
                    {createdKey}
                  </pre>
                </div>
                <Button
                  className={cn(EMERALD_BTN, "w-full")}
                  onClick={async () => {
                    const ok = await copyToClipboard(createdKey);
                    if (ok) toast.success("API key copied to clipboard");
                    else toast.error("Couldn’t copy — clipboard unavailable");
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy key
                </Button>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setCreateOpen(false);
                    setCreatedKey(null);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Create API key
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="key-name" className="text-xs">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="key-name"
                    type="text"
                    placeholder="Production API"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !creating) onCreate();
                    }}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Use a name that helps you identify where this key is used.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  className={EMERALD_BTN}
                  disabled={creating || !newName.trim()}
                  onClick={onCreate}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" /> Create key
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- Revoke confirm ---------- */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(o) => {
          if (!o) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Revoke API key?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke{" "}
              <span className="font-semibold text-foreground">
                {revokeTarget?.name}
              </span>
              . Any application using this key will stop working immediately.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirmRevoke();
              }}
              disabled={revoking}
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
            >
              {revoking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Revoking…
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 mr-2" /> Revoke key
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
