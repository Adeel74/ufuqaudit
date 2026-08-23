"use client";

import * as React from "react";
import { useAudit, ViewHeader } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Bot, Send, Sparkles, RotateCcw, Loader2, MessageSquare,
  Zap, FileText, Search, Code2,
} from "lucide-react";

// ---------- Types ----------
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

interface PromptGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prompts: string[];
}

// ---------- Constants ----------
const SCROLLBAR_CLS =
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full " +
  "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent pr-1";

const PROMPT_GROUPS: PromptGroup[] = [
  {
    label: "Audit insights",
    icon: Zap,
    prompts: [
      "Why is my AEO score low?",
      "What's the difference between AEO and GEO?",
      "Which issues should I fix first?",
    ],
  },
  {
    label: "Fixes & schema",
    icon: Code2,
    prompts: [
      "What schema should I add?",
      "How do I improve LCP?",
      "Explain the AI crawler block",
    ],
  },
  {
    label: "Content & meta",
    icon: FileText,
    prompts: [
      "Generate a meta description for my homepage",
      "How long should my title tag be?",
      "What is E-E-A-T and why does it matter?",
    ],
  },
  {
    label: "Discovery",
    icon: Search,
    prompts: [
      "How do I get cited by AI assistants?",
      "What's the ideal word count for an FAQ page?",
    ],
  },
];

const WELCOME_EXAMPLES = [
  "Why is my AEO score low?",
  "What schema should I add to my articles?",
  "How do I improve my Largest Contentful Paint?",
];

const SYSTEM_GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm UfuqAudit's AI assistant. Ask me anything about SEO, AEO, GEO, performance, or how to fix what your audit found. If you've run an audit, my answers will be grounded in your actual scores and issues.",
};

// ---------- Component ----------
export function AiChatView() {
  const audit = useAudit();
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    SYSTEM_GREETING,
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom whenever messages / loading change.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  async function send(contentRaw: string) {
    const content = contentRaw.trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = { role: "user", content };
    const nextMessages: ChatMessage[] = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    // Reset textarea height after send.
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((m) => !m.error)
            .map((m) => ({ role: m.role, content: m.content })),
          auditId: audit?.id,
          url: audit?.url,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg =
          (data?.error as string | undefined) || "AI request failed";
        throw new Error(errMsg);
      }
      const reply = (data?.reply as string | undefined) || "";
      if (!reply) throw new Error("Empty AI response");
      setMessages((cur) => [...cur, { role: "assistant", content: reply }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "AI failed";
      setMessages((cur) => [
        ...cur,
        {
          role: "assistant",
          content: `Sorry — I couldn't respond. ${msg}`,
          error: true,
        },
      ]);
      toast.error("AI chat failed");
    } finally {
      setLoading(false);
    }
  }

  function retryLast() {
    // Remove the last error assistant message + re-send the last user message.
    setMessages((cur) => {
      if (!Array.isArray(cur) || cur.length === 0) return cur;
      const last = cur[cur.length - 1];
      if (last?.error) {
        const trimmed = cur.slice(0, -1);
        // Re-send the user message before the failed assistant reply.
        const lastUser = [...trimmed].reverse().find((m) => m.role === "user");
        if (lastUser) {
          void send(lastUser.content);
        }
        return trimmed;
      }
      return cur;
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  // Auto-grow textarea up to ~4 rows.
  function onInputScrollHeight() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 160; // ~4 rows
    el.style.height = Math.min(el.scrollHeight, max) + "px";
  }

  const safeMessages: ChatMessage[] = Array.isArray(messages) ? messages : [];
  const hasRealConversation =
    safeMessages.filter((m) => m !== SYSTEM_GREETING).length > 0;

  return (
    <div className="space-y-6">
      <ViewHeader
        title="AI Assistant"
        subtitle="Ask anything about your audit, SEO, AEO, GEO or fixes"
        icon={Bot}
      />

      {/* Audit context banner */}
      <div
        className={cn(
          "rounded-lg border p-3 flex items-center gap-3 text-sm",
          audit
            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
            : "bg-muted/40 border-border text-muted-foreground",
        )}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            audit
              ? "bg-emerald-500/15 text-emerald-600"
              : "bg-muted-foreground/15 text-muted-foreground",
          )}
        >
          <Sparkles className="w-4 h-4" />
        </div>
        {audit ? (
          <div className="min-w-0">
            <span className="font-medium">
              Grounded in your audit of {audit.url}
            </span>
            <span className="mx-1.5 text-muted-foreground/60">—</span>
            <span className="font-semibold tabular-nums">
              Score {audit.overallScore}/100
            </span>
          </div>
        ) : (
          <span>
            General SEO mode — run an audit for grounded answers
          </span>
        )}
      </div>

      {/* Main layout */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Chat thread */}
        <Card className="p-0 overflow-hidden flex flex-col">
          {/* Messages */}
          <div
            ref={scrollRef}
            className={cn(
              "max-h-[60vh] min-h-[360px] overflow-y-auto p-4 space-y-4 bg-muted/10",
              SCROLLBAR_CLS,
            )}
          >
            {/* Welcome card if no real conversation yet */}
            {!hasRealConversation && (
              <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-background p-5 m-1">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      Hey there — I&apos;m ready when you are.
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Try one of these to get started, or type your own
                      question below.
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      {WELCOME_EXAMPLES.map((q) => (
                        <button
                          key={q}
                          onClick={() => void send(q)}
                          className="text-left text-xs font-medium px-3 py-2 rounded-lg border border-emerald-500/20 bg-card hover:bg-emerald-500/5 transition-colors flex items-center gap-2"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {safeMessages.map((m, i) => (
              <MessageBubble
                key={i}
                message={m}
                onRetry={retryLast}
              />
            ))}

            {loading && <TypingIndicator />}
          </div>

          {/* Input bar */}
          <div className="border-t bg-card p-3 sticky bottom-0">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  onInputScrollHeight();
                }}
                onKeyDown={onKeyDown}
                placeholder="Ask about your audit, SEO, AEO, GEO… (Enter to send, Shift+Enter for newline)"
                rows={1}
                className="min-h-[44px] max-h-40 resize-none field-sizing-none"
                disabled={loading}
              />
              <Button
                size="icon"
                onClick={() => void send(input)}
                disabled={loading || !input.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 h-11 w-11"
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
              {audit
                ? "Answers are grounded in your audit context."
                : "Tip: run an audit first so I can give specific, grounded advice."}
            </p>
          </div>
        </Card>

        {/* Suggested prompts sidebar (desktop) */}
        <div className="hidden lg:block">
          <Card className="p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Suggested prompts
            </h3>
            <div className="space-y-4">
              {PROMPT_GROUPS.map((group) => {
                const Icon = group.icon;
                return (
                  <div key={group.label}>
                    <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <Icon className="w-3.5 h-3.5" />
                      {group.label}
                    </div>
                    <div className="space-y-1.5">
                      {group.prompts.map((p) => (
                        <button
                          key={p}
                          onClick={() => void send(p)}
                          disabled={loading}
                          className="w-full text-left text-xs px-2.5 py-2 rounded-lg border border-border bg-card hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile suggested prompts (horizontal scroll) */}
      <div className="lg:hidden">
        <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Suggested prompts
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {PROMPT_GROUPS.flatMap((g) => g.prompts).map((p) => (
            <button
              key={p}
              onClick={() => void send(p)}
              disabled={loading}
              className="text-xs px-3 py-2 rounded-lg border border-border bg-card hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Subcomponents ----------
function MessageBubble({
  message,
  onRetry,
}: {
  message: ChatMessage;
  onRetry: () => void;
}) {
  const isUser = message.role === "user";
  const isError = !!message.error;

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-600 text-white px-3.5 py-2.5 text-sm shadow-sm">
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-4 h-4" />
      </div>
      <div className="max-w-[85%]">
        <div
          className={cn(
            "rounded-2xl rounded-bl-sm border px-3.5 py-2.5 text-sm shadow-sm",
            isError
              ? "bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300"
              : "bg-card border-border",
          )}
        >
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
          {isError && (
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="h-7 text-xs"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-4 h-4" />
      </div>
      <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 animate-bounce"></span>
        </div>
      </div>
    </div>
  );
}
