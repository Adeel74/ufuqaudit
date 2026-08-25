"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Bot, Send, X, Sparkles, ChevronDown, AlertCircle, Lightbulb,
  TrendingUp, Shield, Gauge, Brain,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "What does my Ufuq Score mean?",
  "How do I fix broken links?",
  "What is AEO and why does it matter?",
  "How can I improve my Core Web Vitals?",
  "Explain the AI visibility score",
];

const CONTEXTUAL_PROMPTS: Record<string, string[]> = {
  dashboard: ["Why is my score low?", "What should I fix first?", "How do I improve my overall score?"],
  issues: ["What are the most critical issues?", "How do I fix missing meta descriptions?", "Why are broken links bad?"],
  aeo: ["What is AEO?", "How do I get cited by ChatGPT?", "What makes content citable?"],
  geo: ["What is GEO?", "How do I improve AI visibility?", "What are AI crawler blocks?"],
  performance: ["How do I improve LCP?", "What is INP?", "How do I reduce page weight?"],
  security: ["What security headers do I need?", "How do I enable HSTS?", "What is mixed content?"],
};

export function FloatingChat() {
  const { view, currentAudit, user } = useAppStore();
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [hasGreeting, setHasGreeting] = React.useState(false);

  const auditContext = React.useMemo(() => {
    if (!currentAudit) return null;
    return `CURRENT AUDIT: URL=${currentAudit.url}, Score=${currentAudit.overallScore}/100, Technical=${currentAudit.scores.technical}, Content=${currentAudit.scores.content}, Performance=${currentAudit.scores.performance}, AEO=${currentAudit.scores.aeo}, GEO=${currentAudit.scores.geo}, Security=${currentAudit.scores.security}. Issues: ${currentAudit.counts.critical} critical, ${currentAudit.counts.error} errors, ${currentAudit.counts.warning} warnings, ${currentAudit.counts.opportunity} opportunities. Top issues: ${currentAudit.issues.slice(0, 5).map(i => i.title).join("; ")}`;
  }, [currentAudit]);

  const contextualPrompts = React.useMemo(() => {
    const base = CONTEXTUAL_PROMPTS[view] || [];
    if (currentAudit && base.length === 0) {
      return ["What should I fix first?", "Explain my score", "How do I improve?"];
    }
    return base;
  }, [view, currentAudit]);

  React.useEffect(() => {
    if (open && !hasGreeting) {
      setHasGreeting(true);
      const greeting = currentAudit
        ? `Hi! I'm your UfuqAudit AI assistant. I can see you're viewing ${currentAudit.url} with a score of ${currentAudit.overallScore}/100. Ask me anything about your audit results or how to fix issues!`
        : `Hi! I'm your UfuqAudit AI assistant. I can help you understand SEO, AEO, GEO, and fix audit issues. Ask me anything!`;
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [open, hasGreeting, currentAudit]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user" as const, content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          auditId: currentAudit?.id,
          url: currentAudit?.url,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      } else {
        throw new Error(data?.error || "No response");
      }
    } catch {
      setMessages([...newMessages, {
        role: "assistant",
        content: "I'm having trouble responding right now. Please try again in a moment.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Don't show on auth pages
  if (view === "login" || view === "register") return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
          aria-label="Open AI assistant"
        >
          <Bot className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-background">1</span>
          <span className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap bg-card text-foreground text-xs font-medium px-3 py-1.5 rounded-lg border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Ask AI Assistant
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[400px] h-[calc(100vh-3rem)] sm:h-[560px] flex flex-col rounded-2xl border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">AI Assistant</div>
                <div className="text-[10px] opacity-80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" /> Online
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {/* Contextual suggested prompts */}
            {messages.length <= 1 && !loading && (
              <div className="space-y-1.5 pt-2">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider px-1">Suggested questions</p>
                {(currentAudit ? contextualPrompts : SUGGESTED_PROMPTS).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg border bg-card hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t shrink-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about your audit or SEO..."
                className="flex-1 h-10 px-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                disabled={loading}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
