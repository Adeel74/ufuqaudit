"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { GaugeCircle, Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

type AuthMode = "login" | "register";

export function AuthView({ mode: initialMode = "login" }: { mode?: AuthMode }) {
  const { login, setView } = useAppStore();
  const [mode, setMode] = React.useState<AuthMode>(initialMode);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required");
      return;
    }
    if (mode === "register" && password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { email: email.trim(), password }
        : { email: email.trim(), password, name: name.trim() };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Authentication failed");
      login(data.user.email, data.user.name, data.user.role, data.user.plan, data.token);
      toast.success(mode === "login" ? `Welcome back, ${data.user.name}!` : `Account created — welcome, ${data.user.name}!`);
      setView("dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/demo-admin", { method: "POST" });
      const data = await res.json();
      if (data?.admin) {
        login(data.admin.email, data.admin.name, data.admin.role, data.admin.plan);
        toast.success(`Signed in as ${data.admin.name}`);
        setView("dashboard");
      }
    } catch { toast.error("Demo login failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/50 via-teal-50/50 to-background dark:from-emerald-950/10 dark:via-teal-950/10 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={() => setView("landing")} className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
              <GaugeCircle className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl">UfuqAudit</span>
          </button>
        </div>
        <Card className="p-6 sm:p-8 shadow-lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
            <p className="text-sm text-muted-foreground mt-1">{mode === "login" ? "Sign in to your UfuqAudit account" : "Start auditing your website in seconds"}</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="pl-9 h-11" disabled={loading} />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="pl-9 h-11" disabled={loading} autoComplete="email" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "register" ? "Min 8 characters" : "••••••••"} className="pl-9 h-11" disabled={loading} autoComplete={mode === "login" ? "current-password" : "new-password"} />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11" disabled={loading}>
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> {mode === "login" ? "Signing in..." : "Creating account..."}</> : <>{mode === "login" ? "Sign In" : "Create Account"} <ArrowRight className="w-4 h-4 ml-1" /></>}
            </Button>
          </form>
          <div className="relative my-5"><div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div><div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div></div>
          <Button variant="outline" size="lg" className="w-full h-11" onClick={demoLogin} disabled={loading}>
            <ShieldCheck className="w-4 h-4 mr-2 text-emerald-600" /> Continue as Demo Admin
          </Button>
          <p className="text-center text-sm text-muted-foreground mt-5">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="font-medium text-emerald-600 hover:text-emerald-700">{mode === "login" ? "Sign up" : "Sign in"}</button>
          </p>
        </Card>
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> 200+ checks</span>
          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure auth</span>
          <span className="flex items-center gap-1"><GaugeCircle className="w-3 h-3" /> 6 engines</span>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          <button onClick={() => setView("landing")} className="hover:text-foreground">← Back to home</button>
        </p>
      </div>
    </div>
  );
}
