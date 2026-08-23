"use client";

import * as React from "react";
import { ViewHeader } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ShieldCheck, RefreshCw, LayoutDashboard, Users, Building2,
  Layers, CreditCard, DollarSign, KeyRound, FileSearch, Settings as SettingsIcon,
} from "lucide-react";
import { AdminDashboardSection } from "./sections/admin-dashboard-section";
import { AdminUsersSection } from "./sections/admin-users-section";
import { AdminOrganizationsSection } from "./sections/admin-organizations-section";
import { AdminPlansSection } from "./sections/admin-plans-section";
import { AdminSubscriptionsSection } from "./sections/admin-subscriptions-section";
import { AdminBillingSection } from "./sections/admin-billing-section";
import { AdminApiKeysSection } from "./sections/admin-api-keys-section";
import { AdminAuditsSection } from "./sections/admin-audits-section";
import { AdminSystemSection } from "./sections/admin-system-section";

const TABS = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "users", label: "Users", icon: Users },
  { value: "organizations", label: "Organizations", icon: Building2 },
  { value: "plans", label: "Plans", icon: Layers },
  { value: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { value: "billing", label: "Billing", icon: DollarSign },
  { value: "api-keys", label: "API Keys", icon: KeyRound },
  { value: "audits", label: "Audits", icon: FileSearch },
  { value: "system", label: "System", icon: SettingsIcon },
] as const;

export function AdminView() {
  // Refresh key is bumped when user clicks "Refresh" — propagates to all sections that read it.
  const [refreshKey, setRefreshKey] = React.useState(0);
  // Track which tab is active so we only mount its content when needed (perf)
  const [tab, setTab] = React.useState<string>("dashboard");

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Super Admin Portal"
        subtitle="Full platform control — users, billing, plans, audits & system"
        icon={ShieldCheck}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefreshKey((k) => k + 1);
              toast.success("Data refreshed");
            }}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh all
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
          <TabsList className="inline-flex h-10 w-max">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger key={t.value} value={t.value} className="px-3 py-1.5 gap-1.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="mt-6">
          <AdminDashboardSection refreshKey={refreshKey} />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          {tab === "users" ? <AdminUsersSection refreshKey={refreshKey} /> : null}
        </TabsContent>
        <TabsContent value="organizations" className="mt-6">
          {tab === "organizations" ? <AdminOrganizationsSection refreshKey={refreshKey} /> : null}
        </TabsContent>
        <TabsContent value="plans" className="mt-6">
          {tab === "plans" ? <AdminPlansSection refreshKey={refreshKey} /> : null}
        </TabsContent>
        <TabsContent value="subscriptions" className="mt-6">
          {tab === "subscriptions" ? <AdminSubscriptionsSection refreshKey={refreshKey} /> : null}
        </TabsContent>
        <TabsContent value="billing" className="mt-6">
          {tab === "billing" ? <AdminBillingSection refreshKey={refreshKey} /> : null}
        </TabsContent>
        <TabsContent value="api-keys" className="mt-6">
          {tab === "api-keys" ? <AdminApiKeysSection refreshKey={refreshKey} /> : null}
        </TabsContent>
        <TabsContent value="audits" className="mt-6">
          {tab === "audits" ? <AdminAuditsSection refreshKey={refreshKey} /> : null}
        </TabsContent>
        <TabsContent value="system" className="mt-6">
          {tab === "system" ? <AdminSystemSection refreshKey={refreshKey} /> : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
