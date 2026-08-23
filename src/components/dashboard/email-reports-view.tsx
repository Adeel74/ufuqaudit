"use client";

import * as React from "react";
import { ViewHeader } from "@/components/dashboard/shared";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Mail, Send, Loader2, FileText, Sparkles, CheckCircle2,
  Eye, Lightbulb, Clock, AtSign, ArrowRight, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------- Types ----------
interface SentEmail {
  id: string;
  to: string;
  subject: string;
  timestamp: string;
  status: "sent" | "queued" | "failed";
  includeReport: boolean;
  includeAiPlan: boolean;
}

interface SendResponse {
  ok: boolean;
  sent: boolean;
  messageId: string;
  to: string;
  subject: string;
  timestamp: string;
  includeReport: boolean;
}

interface SendErrorBody {
  error?: string;
}

// ---------- Constants ----------
const EMERALD_BTN = "bg-emerald-600 hover:bg-emerald-700 text-white";

const SCROLLBAR_CLS =
  "max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent";

const BRAND_SWATCHES: { name: string; value: string; ring: string }[] = [
  { name: "Emerald", value: "#10b981", ring: "ring-emerald-500" },
  { name: "Teal", value: "#14b8a6", ring: "ring-teal-500" },
  { name: "Amber", value: "#f59e0b", ring: "ring-amber-500" },
  { name: "Rose", value: "#f43f5e", ring: "ring-rose-500" },
  { name: "Violet", value: "#8b5cf6", ring: "ring-violet-500" },
];

const TIPS: { title: string; body: string }[] = [
  {
    title: "Keep subject under 60 chars",
    body: "Subjects under 60 characters avoid being truncated in most email clients and improve open rates.",
  },
  {
    title: "Personalize the greeting",
    body: "Use the client's name or company in the opening line to build rapport and signal that the report is tailored.",
  },
  {
    title: "Include a clear CTA",
    body: "End with a specific next step — e.g. schedule a 15-min review call — so the recipient knows exactly what to do.",
  },
];

// ---------- Initial mock history ----------
const INITIAL_HISTORY: SentEmail[] = [
  {
    id: "msg_seed_1",
    to: "alex@northwind-co.com",
    subject: "Website Audit Report — northwind-co.com",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "sent",
    includeReport: true,
    includeAiPlan: true,
  },
  {
    id: "msg_seed_2",
    to: "maria@brightlabs.io",
    subject: "Website Audit Report — brightlabs.io",
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    status: "sent",
    includeReport: true,
    includeAiPlan: false,
  },
  {
    id: "msg_seed_3",
    to: "it@harborlogistics.de",
    subject: "Q3 SEO Audit — harbor-logistics.de",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "sent",
    includeReport: false,
    includeAiPlan: true,
  },
  {
    id: "msg_seed_4",
    to: "sarah.k@maple-studio.ca",
    subject: "Website Audit Report — maplestudio.ca",
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    status: "sent",
    includeReport: true,
    includeAiPlan: true,
  },
  {
    id: "msg_seed_5",
    to: "ops@globex-example.com",
    subject: "Audit follow-up — Globex",
    timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: "sent",
    includeReport: false,
    includeAiPlan: false,
  },
];

// ---------- Helpers ----------
function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
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

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

function extractHost(url?: string): string {
  if (!url) return "";
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? "";
  }
}

function buildMessage(url: string | undefined, score: number, userName: string): string {
  const host = extractHost(url) || "your site";
  const greeting = `Hi ${host} team,`;
  const scoreLine = score > 0
    ? `Your overall Ufuq Score is ${score}/100, with detailed breakdowns across SEO, AEO, GEO, performance, and security.`
    : "Your overall Ufuq Score and detailed breakdowns across SEO, AEO, GEO, performance, and security are included in the attached report.";
  return [
    greeting,
    "",
    "Please find your website audit report attached. " + scoreLine,
    "",
    "The report also includes prioritized, AI-generated recommendations to help you improve your search visibility, answer-engine readiness, and user experience.",
    "",
    "If you have any questions or would like to schedule a review call, just reply to this email.",
    "",
    "Best regards,",
    userName,
  ].join("\n");
}

function defaultSubject(url: string | undefined): string {
  const host = extractHost(url);
  return host ? `Website Audit Report — ${host}` : "Website Audit Report — your site";
}

function isValidEmail(s: string): boolean {
  // Simple, sufficient validation — no exotic RFC edge cases.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// =================== Component ===================
export function EmailReportsView() {
  const currentAudit = useAppStore((s) => s.currentAudit);
  const user = useAppStore((s) => s.user);

  const auditUrl = currentAudit?.url;
  const auditScore = currentAudit?.overallScore ?? 0;
  const auditId = currentAudit?.id;
  const userName = user?.name ?? "UfuqAudit";

  // Form state
  const [to, setTo] = React.useState("");
  const [cc, setCc] = React.useState("");
  const [subject, setSubject] = React.useState(() => defaultSubject(auditUrl));
  const [message, setMessage] = React.useState(() => buildMessage(auditUrl, auditScore, userName));
  const [includeReport, setIncludeReport] = React.useState(true);
  const [includeAiPlan, setIncludeAiPlan] = React.useState(true);
  const [brandColor, setBrandColor] = React.useState("#10b981");
  const [sending, setSending] = React.useState(false);

  // History — pre-seeded with mock entries, prepended with new sends.
  const [history, setHistory] = React.useState<SentEmail[]>(INITIAL_HISTORY);

  // Re-prefill subject/message when audit changes (e.g. user switches audits).
  React.useEffect(() => {
    setSubject(defaultSubject(auditUrl));
    setMessage(buildMessage(auditUrl, auditScore, userName));
  }, [auditUrl, auditScore, userName]);

  const resetForm = () => {
    setTo("");
    setCc("");
    setSubject(defaultSubject(auditUrl));
    setMessage(buildMessage(auditUrl, auditScore, userName));
  };

  const onSend = async () => {
    const email = to.trim();
    if (!email) {
      toast.error("Enter a recipient email address");
      return;
    }
    if (!isValidEmail(email)) {
      toast.error("Enter a valid recipient email address");
      return;
    }
    if (cc.trim() && !cc.split(",").every((c) => isValidEmail(c.trim()))) {
      toast.error("One or more Cc addresses are invalid");
      return;
    }
    if (!subject.trim()) {
      toast.error("Enter a subject line");
      return;
    }

    setSending(true);
    try {
      const r = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          cc: cc.trim() || undefined,
          subject: subject.trim(),
          message,
          auditId,
          includeReport,
        }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as SendErrorBody;
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      const j = (await r.json()) as SendResponse;
      setHistory((prev) => [
        {
          id: j.messageId,
          to: j.to,
          subject: j.subject,
          timestamp: j.timestamp,
          status: "sent",
          includeReport: j.includeReport,
          includeAiPlan,
        },
        ...prev,
      ]);
      toast.success(`Email sent to ${j.to}`, {
        description: includeReport ? "PDF report attached" : undefined,
      });
      resetForm();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to send email";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const subjectLen = subject.length;
  const subjectWarn = subjectLen > 60;

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Email Reports"
        subtitle="Send branded audit reports to clients"
        icon={Mail}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ---------- Composer (left, sticky on desktop) ---------- */}
        <div className="lg:col-span-3">
          <Card className="p-5 lg:sticky lg:top-4 space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold">Compose report email</h3>
            </div>
            <Separator />

            {/* To */}
            <div className="space-y-1.5">
              <Label htmlFor="email-to" className="text-xs">
                To <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <AtSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="email-to"
                  type="email"
                  placeholder="client@example.com"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Cc */}
            <div className="space-y-1.5">
              <Label htmlFor="email-cc" className="text-xs">
                Cc <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="email-cc"
                type="text"
                placeholder="team@agency.com, ops@client.com"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
              />
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-subject" className="text-xs">Subject</Label>
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    subjectWarn
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground",
                  )}
                >
                  {subjectLen}/60
                </span>
              </div>
              <Input
                id="email-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              {subjectWarn && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Subject is over 60 chars — may get truncated in some clients
                </p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label htmlFor="email-message" className="text-xs">Message</Label>
              <Textarea
                id="email-message"
                rows={9}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="resize-y text-sm leading-relaxed"
              />
            </div>

            {/* Include PDF report */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 py-1.5">
                <div className="flex items-start gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">Include PDF report</div>
                    {includeReport && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        A branded PDF will be generated and attached
                      </div>
                    )}
                  </div>
                </div>
                <Switch checked={includeReport} onCheckedChange={setIncludeReport} aria-label="Include PDF report" />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-3 py-1.5">
                <div className="flex items-start gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">Include AI action plan</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Personalized fix recommendations
                    </div>
                  </div>
                </div>
                <Switch checked={includeAiPlan} onCheckedChange={setIncludeAiPlan} aria-label="Include AI action plan" />
              </div>
            </div>

            {/* Brand color */}
            <div className="space-y-1.5">
              <Label className="text-xs">Brand color</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {BRAND_SWATCHES.map((sw) => {
                  const selected = brandColor === sw.value;
                  return (
                    <button
                      key={sw.value}
                      type="button"
                      onClick={() => setBrandColor(sw.value)}
                      aria-label={sw.name}
                      aria-pressed={selected}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center",
                        selected
                          ? cn("ring-2 ring-offset-2 ring-offset-background", sw.ring)
                          : "border-transparent hover:scale-110",
                      )}
                      style={{ backgroundColor: sw.value }}
                    >
                      {selected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
                <span className="text-[11px] text-muted-foreground ml-1">
                  Used in the report header &amp; CTA
                </span>
              </div>
            </div>

            <Separator />

            {/* Send */}
            <Button
              className={cn(EMERALD_BTN, "w-full")}
              disabled={sending}
              onClick={onSend}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send email
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* ---------- Sent history (right) ---------- */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Sent history</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {history.length} email{history.length === 1 ? "" : "s"} sent
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-[11px]">
                {history.length}
              </Badge>
            </div>
            <div className={cn(SCROLLBAR_CLS, "space-y-2")}>
              {history.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground">
                  <Mail className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  No emails sent yet
                </div>
              ) : (
                history.map((e) => (
                  <div
                    key={e.id}
                    className="rounded-lg border p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <AtSign className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium truncate">{e.to}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {e.subject}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {relTime(e.timestamp)}
                          </span>
                          {e.includeReport && (
                            <Badge
                              variant="outline"
                              className="text-[10px] h-4 px-1.5 font-normal gap-0.5"
                            >
                              <FileText className="w-2.5 h-2.5" />
                              PDF
                            </Badge>
                          )}
                          {e.includeAiPlan && (
                            <Badge
                              variant="outline"
                              className="text-[10px] h-4 px-1.5 font-normal gap-0.5"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              AI plan
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge
                        className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 shrink-0"
                        variant="outline"
                      >
                        Sent
                      </Badge>
                    </div>
                    <div className="mt-2 pt-2 border-t flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={() =>
                          toast.info("Preview not available", {
                            description: `Opening preview of "${truncate(e.subject, 50)}"`,
                          })
                        }
                      >
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ---------- Tips card ---------- */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold">Email best practices</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TIPS.map((t, i) => (
            <div
              key={i}
              className="rounded-lg border bg-muted/20 p-4 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-sm font-medium">{t.title}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-muted-foreground">
            Tip: pair these practices with a consistent brand color and short subject lines for the best open rates.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900"
            onClick={() => toast.success("Best practices guide", { description: "Opening the email marketing playbook…" })}
          >
            Read full guide <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
