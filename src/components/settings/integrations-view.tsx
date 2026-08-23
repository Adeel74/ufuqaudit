"use client";

import * as React from "react";
import { ViewHeader } from "@/components/dashboard/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plug,
  Search,
  BarChart3,
  Gauge,
  Slack,
  Webhook,
  Zap,
  Copy,
  Check,
  Loader2,
  Unplug,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

const EMERALD_BTN = "bg-emerald-600 hover:bg-emerald-700 text-white";

type ProviderId =
  | "gsc"
  | "ga4"
  | "psi"
  | "slack"
  | "webhook"
  | "zapier";

interface IntegrationDef {
  id: ProviderId;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  docsHref: string;
}

const INTEGRATIONS: IntegrationDef[] = [
  {
    id: "gsc",
    name: "Google Search Console",
    description: "Sync search keywords, impressions & CTR into your audit reports.",
    icon: Search,
    accent: "bg-blue-50 text-blue-700",
    docsHref: "#",
  },
  {
    id: "ga4",
    name: "Google Analytics 4",
    description: "Pull traffic & engagement metrics alongside SEO scores.",
    icon: BarChart3,
    accent: "bg-amber-50 text-amber-700",
    docsHref: "#",
  },
  {
    id: "psi",
    name: "PageSpeed Insights",
    description: "Real-user Core Web Vitals for every audited page.",
    icon: Gauge,
    accent: "bg-emerald-50 text-emerald-700",
    docsHref: "#",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send audit complete & critical issue alerts to your channel.",
    icon: Slack,
    accent: "bg-violet-50 text-violet-700",
    docsHref: "#",
  },
  {
    id: "webhook",
    name: "Webhook",
    description: "Pipe audit results to your own endpoint in real time.",
    icon: Webhook,
    accent: "bg-rose-50 text-rose-700",
    docsHref: "#",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect UfuqAudit to 5,000+ apps without writing any code.",
    icon: Zap,
    accent: "bg-orange-50 text-orange-700",
    docsHref: "#",
  },
];

const INITIAL_CONNECTED: ProviderId[] = ["psi", "slack"];

export function IntegrationsView() {
  const [connected, setConnected] = React.useState<Set<ProviderId>>(new Set(INITIAL_CONNECTED));
  const [connecting, setConnecting] = React.useState<ProviderId | null>(null);
  const [pendingDisconnect, setPendingDisconnect] = React.useState<IntegrationDef | null>(null);

  const [webhookUrl, setWebhookUrl] = React.useState("https://api.ufuqaudit.app/hooks/ufo_8s2k3");
  const [webhookCopied, setWebhookCopied] = React.useState(false);
  const [testingWebhook, setTestingWebhook] = React.useState(false);

  function connect(def: IntegrationDef) {
    setConnecting(def.id);
    setTimeout(() => {
      setConnected((prev) => new Set(prev).add(def.id));
      setConnecting(null);
      toast.success(`${def.name} connected`);
    }, 1500);
  }

  function disconnect(def: IntegrationDef) {
    setConnected((prev) => {
      const next = new Set(prev);
      next.delete(def.id);
      return next;
    });
    setPendingDisconnect(null);
    toast.success(`${def.name} disconnected`);
  }

  async function copyWebhook() {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setWebhookCopied(true);
      toast.success("Webhook URL copied");
      setTimeout(() => setWebhookCopied(false), 1500);
    } catch {
      toast.error("Clipboard unavailable — copy manually");
    }
  }

  function testWebhook() {
    setTestingWebhook(true);
    setTimeout(() => {
      setTestingWebhook(false);
      toast.success("Webhook test sent — 200 OK received");
    }, 1200);
  }

  const connectedCount = connected.size;

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Integrations"
        subtitle="Connect Google Search Console, GA4 & more"
        icon={Plug}
      />

      {/* Integration grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INTEGRATIONS.map((def) => {
          const isConnected = connected.has(def.id);
          const isConnecting = connecting === def.id;
          return (
            <Card key={def.id} className="p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${def.accent}`}>
                  <def.icon className="w-5 h-5" />
                </div>
                {isConnected ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted/40 text-muted-foreground">
                    <Unplug className="w-3 h-3 mr-1" /> Not connected
                  </Badge>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{def.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {def.description}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2">
                {isConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setPendingDisconnect(def)}
                  >
                    <Unplug className="w-3.5 h-3.5 mr-1" /> Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className={EMERALD_BTN}
                    disabled={isConnecting}
                    onClick={() => connect(def)}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        Connecting…
                      </>
                    ) : (
                      <>
                        <Plug className="w-3.5 h-3.5 mr-1" /> Connect
                      </>
                    )}
                  </Button>
                )}
                <a
                  href={def.docsHref}
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info(`Opening ${def.name} docs`);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 ml-auto"
                >
                  Docs <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Connected accounts summary */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Connected accounts
        </h3>
        {connectedCount === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No integrations connected yet. Connect one above to get started.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {INTEGRATIONS.filter((d) => connected.has(d.id)).map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${d.accent}`}>
                  <d.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{d.name}</div>
                  <div className="text-xs text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Webhook card */}
      <Card className="p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-1">
          <Webhook className="w-4 h-4 text-emerald-600" /> Webhook endpoint
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Send audit events to this URL as JSON POST requests. Rotate the key anytime from the API Keys tab.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="font-mono text-xs flex-1"
            placeholder="https://your-endpoint.example/hooks/…"
          />
          <Button variant="outline" onClick={copyWebhook} className="shrink-0">
            {webhookCopied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy
              </>
            )}
          </Button>
          <Button
            className={`${EMERALD_BTN} shrink-0`}
            disabled={testingWebhook}
            onClick={testWebhook}
          >
            {testingWebhook ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Testing…
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 mr-1" /> Test webhook
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Disconnect confirm */}
      <AlertDialog
        open={!!pendingDisconnect}
        onOpenChange={(o) => {
          if (!o) setPendingDisconnect(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {pendingDisconnect?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke access and stop any data sync. You can reconnect anytime. Audits already
              saved will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (pendingDisconnect) disconnect(pendingDisconnect);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
