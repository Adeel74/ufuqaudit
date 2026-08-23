"use client";

import * as React from "react";
import { ViewHeader } from "@/components/dashboard/shared";
import { useAppStore } from "@/lib/store";
import { PLAN_TIERS } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";
import {
  CreditCard,
  Check,
  Star,
  Download,
  Zap,
  FileText,
  FolderTree,
  Sparkles,
  ArrowDown,
} from "lucide-react";

const EMERALD_BTN = "bg-emerald-600 hover:bg-emerald-700 text-white";
const EMERALD_PROGRESS = "[&>[data-slot=progress-indicator]]:bg-emerald-500 bg-emerald-500/10";

interface UsageItem {
  label: string;
  used: number;
  limit: number;
  icon: React.ComponentType<{ className?: string }>;
}

const MOCK_INVOICES = [
  { id: "INV-2025-0008", date: "2025-08-01", plan: "Pro", amount: "$49.00", status: "Paid" as const },
  { id: "INV-2025-0007", date: "2025-07-01", plan: "Pro", amount: "$49.00", status: "Paid" as const },
  { id: "INV-2025-0006", date: "2025-06-01", plan: "Pro", amount: "$49.00", status: "Paid" as const },
  { id: "INV-2025-0005", date: "2025-05-01", plan: "Starter", amount: "$19.00", status: "Paid" as const },
  { id: "INV-2025-0009", date: "2025-09-01", plan: "Pro", amount: "$49.00", status: "Pending" as const },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function BillingView() {
  const user = useAppStore((s) => s.user);
  const currentPlanId = (user?.plan ?? "pro").toLowerCase();
  const currentPlan = PLAN_TIERS.find((p) => p.id === currentPlanId) ?? PLAN_TIERS[2];

  const planGridRef = React.useRef<HTMLDivElement | null>(null);
  const [cancelOpen, setCancelOpen] = React.useState(false);

  const usage: UsageItem[] = [
    { label: "URLs this month", used: 4820, limit: currentPlan.urlLimit, icon: FileText },
    { label: "Projects", used: 14, limit: currentPlan.projectLimit, icon: FolderTree },
    { label: "AI recommendations", used: 312, limit: 1000, icon: Sparkles },
  ];

  function scrollToPlans() {
    planGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Billing"
        subtitle="Plan, usage & invoices"
        icon={CreditCard}
        actions={
          <Button variant="outline" size="sm" onClick={scrollToPlans}>
            <Zap className="w-3.5 h-3.5 mr-1" /> Change plan
          </Button>
        }
      />

      {/* Current plan + usage */}
      <Card className="p-5 sm:p-6 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-600 text-white border-transparent">
                {currentPlan.name.toUpperCase()}
              </Badge>
              <span className="text-xs text-muted-foreground">Current plan</span>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-bold">${currentPlan.priceMonthly}</span>
              <span className="text-sm text-muted-foreground">/month</span>
              <span className="text-xs text-muted-foreground ml-2">
                · {currentPlan.urlLimit.toLocaleString()} URLs · {currentPlan.projectLimit} projects
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Next bill on{" "}
              <span className="font-medium text-foreground">
                {new Date(Date.now() + 1000 * 60 * 60 * 24 * 9).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </p>
          </div>
          <Button className={EMERALD_BTN} onClick={scrollToPlans}>
            <Zap className="w-3.5 h-3.5 mr-1" /> Change plan
          </Button>
        </div>

        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          {usage.map((u) => {
            const pct = Math.min(100, Math.round((u.used / u.limit) * 100));
            return (
              <div key={u.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    <u.icon className="w-3.5 h-3.5 text-emerald-600" />
                    {u.label}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {u.used.toLocaleString()} / {u.limit.toLocaleString()}
                  </span>
                </div>
                <Progress value={pct} className={EMERALD_PROGRESS} />
                <div className="text-[10px] text-muted-foreground mt-1">{pct}% used</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Plan comparison grid */}
      <div ref={planGridRef} className="scroll-mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Available plans</h2>
          <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">
            Current: {currentPlan.name}
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAN_TIERS.map((t) => {
            const isCurrent = t.id === currentPlanId;
            const isUpgrade = PLAN_TIERS.indexOf(t) > PLAN_TIERS.indexOf(currentPlan);
            return (
              <div
                key={t.id}
                className={`relative rounded-xl border bg-card p-5 flex flex-col ${
                  t.popular
                    ? "border-emerald-500 ring-1 ring-emerald-500/20 shadow-lg"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-muted-foreground">{t.name}</div>
                  {t.popular && !isCurrent && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase">
                      <Star className="w-2.5 h-2.5" /> Popular
                    </span>
                  )}
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">
                      <Check className="w-2.5 h-2.5" /> Current
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${t.priceMonthly}</span>
                  <span className="text-xs text-muted-foreground">/mo</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {t.urlLimit.toLocaleString()} URLs · {t.projectLimit} {t.projectLimit === 1 ? "project" : "projects"}
                </div>

                <Button
                  className={cn(
                    "mt-4 w-full",
                    !isCurrent && t.popular && EMERALD_BTN
                  )}
                  variant={t.popular ? "default" : "outline"}
                  disabled={isCurrent}
                  onClick={() => toast.success(`${isUpgrade ? "Upgrade" : "Switch"} to ${t.name} requested`)}
                >
                  {isCurrent
                    ? "Current plan"
                    : isUpgrade
                      ? "Upgrade"
                      : "Switch plan"}
                  {!isCurrent && isUpgrade && <ArrowDown className="w-3.5 h-3.5 ml-1 rotate-180" />}
                </Button>

                <ul className="mt-4 space-y-2 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment method */}
      <Card className="p-5 sm:p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-emerald-600" /> Payment method
        </h3>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-8 rounded-md bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center text-white text-[10px] font-bold tracking-wider">
              VISA
            </div>
            <div>
              <div className="text-sm font-medium">Visa ending 4242</div>
              <div className="text-xs text-muted-foreground">Expires 12/27 · Default</div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.info("Update payment method (mock)")}>
            Update
          </Button>
        </div>
      </Card>

      {/* Billing history */}
      <Card className="p-5 sm:p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-emerald-600" /> Billing history
        </h3>
        <div className="max-h-[40vh] overflow-y-auto -mx-2 px-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_INVOICES.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium font-mono text-xs">{inv.id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(inv.date)}</TableCell>
                  <TableCell>{inv.plan}</TableCell>
                  <TableCell className="font-medium">{inv.amount}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        inv.status === "Paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }
                    >
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.success(`Downloading ${inv.id}.pdf`)}
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Cancel subscription */}
      <div className="flex justify-end">
        <button
          onClick={() => setCancelOpen(true)}
          className="text-xs text-red-600 hover:text-red-700 hover:underline"
        >
          Cancel subscription
        </button>
      </div>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your plan will remain active until the end of the current billing period. After that,
              your account will downgrade to the Free plan and you will lose access to paid features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep plan</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                setCancelOpen(false);
                toast.success("Subscription cancelled — access remains until the end of the period");
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Cancel subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
