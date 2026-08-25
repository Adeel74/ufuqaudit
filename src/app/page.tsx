"use client";

import * as React from "react";
import { useAppStore, ADMIN_VIEWS, type ViewKey } from "@/lib/store";
import { LandingView } from "@/components/landing/landing-view";
import { AuthView } from "@/components/auth/auth-view";
import { PublicResultView } from "@/components/landing/public-result-view";
import { AuditProgressView } from "@/components/landing/audit-progress";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { IssuesView } from "@/components/issues/issues-view";
import { PagesView } from "@/components/dashboard/pages-view";
import { AuditHistoryView } from "@/components/dashboard/audit-history-view";
import { CompetitorsView } from "@/components/dashboard/competitors-view";
import { AeoView } from "@/components/aeo-geo/aeo-view";
import { GeoView } from "@/components/aeo-geo/geo-view";
import { PerformanceView } from "@/components/performance/performance-view";
import { SecurityView } from "@/components/security/security-view";
import { AiRecommendationsView } from "@/components/dashboard/ai-recommendations-view";
import { AiChatView } from "@/components/dashboard/ai-chat-view";
import { SeoToolsView } from "@/components/dashboard/seo-tools-view";
import { UfuqLinkView } from "@/components/dashboard/ufuqlink-view";
import { VisualPreviewView } from "@/components/dashboard/visual-preview-view";
import { ExtensionView } from "@/components/dashboard/extension-view";
import { SupportView } from "@/components/dashboard/support-view";
import { KeywordsView } from "@/components/dashboard/keywords-view";
import { BacklinksView } from "@/components/dashboard/backlinks-view";
import { ContentView } from "@/components/dashboard/content-view";
import { LinkGraphView } from "@/components/dashboard/link-graph-view";
import { ScheduledAuditsView } from "@/components/dashboard/scheduled-view";
import { SearchConsoleView } from "@/components/dashboard/search-console-view";
import { EmailReportsView } from "@/components/dashboard/email-reports-view";
import { ActivityFeedView } from "@/components/dashboard/activity-feed-view";
import { ApiDocsView } from "@/components/dashboard/api-docs-view";
import { PageEditorView } from "@/components/dashboard/page-editor-view";
import { CrawlSettingsView } from "@/components/dashboard/crawl-settings-view";
import { ClientPortalView } from "@/components/dashboard/client-portal-view";
import { ReportsView } from "@/components/reports/reports-view";
import { AdminView } from "@/components/admin/admin-view";
import { SettingsView } from "@/components/settings/settings-view";
import { BillingView } from "@/components/settings/billing-view";
import { IntegrationsView } from "@/components/settings/integrations-view";
import { PricingView } from "@/components/landing/pricing-view";
import { DocsView } from "@/components/docs/docs-view";
import { FeaturesPage, AboutPage, BlogPublicPage } from "@/components/docs/public-pages";
import { PublicNav } from "@/components/layout/public-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { Footer } from "@/components/layout/footer";
import { PrintReportPortal } from "@/components/reports/print-portal";
import { CommandPalette } from "@/components/layout/command-palette";
import { FloatingChat } from "@/components/layout/floating-chat";
import {
  LayoutDashboard, ListChecks, FileText, MessageSquare, Brain, Gauge,
  Shield, Sparkles, FileBarChart, Plug, CreditCard, Settings as SettingsIcon,
  ShieldCheck, Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ICONS: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  LayoutDashboard, ListChecks, FileText, MessageSquare, Brain, Gauge,
  Shield, Sparkles, FileBarChart, Plug, CreditCard, Settings: SettingsIcon,
  ShieldCheck,
};

export default function Home() {
  const { view, setView, currentAudit, user } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Auto-redirect: if user is logged in and on landing, go to dashboard
  React.useEffect(() => {
    if (view === "landing" && user && user.email !== "demo@ufuqaudit.app") {
      // Don't auto-redirect for demo user (they might want to see landing)
      // Only auto-redirect for real logged-in users
    }
  }, [view, user]);

  // Auth views
  if (view === "login" || view === "register") {
    // If already logged in, redirect to dashboard
    if (user && user.email !== "demo@ufuqaudit.app") {
      return <AppShell />;
    }
    return <AuthView mode={view === "register" ? "register" : "login"} />;
  }

  // Public audit result (for guests — NO footer, NO public nav)
  if (view === "public-result") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PublicResultView />
        <FloatingChat />
      </div>
    );
  }

  // Landing — only show footer + nav if NOT logged in
  if (view === "landing") {
    const showPublicChrome = !user || user.email === "demo@ufuqaudit.app";
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {showPublicChrome && <PublicNav />}
        <LandingView />
        {showPublicChrome && <Footer />}
        <CommandPalette />
        <FloatingChat />
      </div>
    );
  }
  // Audit progress — NO footer (user is in the flow)
  if (view === "audit-progress") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AuditProgressView />
        <CommandPalette />
        <FloatingChat />
      </div>
    );
  }
  // Pricing — only footer if not logged in
  if (view === "pricing") {
    const showFooter = !user || user.email === "demo@ufuqaudit.app";
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PublicNav />
        <PricingView />
        {showFooter && <Footer />}
        <CommandPalette />
        <FloatingChat />
      </div>
    );
  }
  // Docs / features / about / blog — public pages
  if (view === "docs" || view === "features" || view === "about" || view === "blog-public") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PublicNav />
        {view === "docs" && <DocsView />}
        {view === "features" && <FeaturesPage />}
        {view === "about" && <AboutPage />}
        {view === "blog-public" && <BlogPublicPage />}
        <Footer />
        <CommandPalette />
        <FloatingChat />
      </div>
    );
  }

  // App shell with sidebar
  const renderView = () => {
    switch (view) {
      case "dashboard": return <DashboardView />;
      case "issues": return <IssuesView />;
      case "pages": return <PagesView />;
      case "history": return <AuditHistoryView />;
      case "competitors": return <CompetitorsView />;
      case "aeo": return <AeoView />;
      case "geo": return <GeoView />;
      case "performance": return <PerformanceView />;
      case "security": return <SecurityView />;
      case "ai-recommendations": return <AiRecommendationsView />;
      case "ai-chat": return <AiChatView />;
      case "tools": return <SeoToolsView />;
      case "ufuqlink": return <UfuqLinkView />;
      case "visual-preview": return <VisualPreviewView />;
      case "extension": return <ExtensionView />;
      case "support": return <SupportView />;
      case "keywords": return <KeywordsView />;
      case "backlinks": return <BacklinksView />;
      case "content": return <ContentView />;
      case "link-graph": return <LinkGraphView />;
      case "scheduled": return <ScheduledAuditsView />;
      case "search-console": return <SearchConsoleView />;
      case "portal": return <ClientPortalView />;
      case "email": return <EmailReportsView />;
      case "activity": return <ActivityFeedView />;
      case "api-docs": return <ApiDocsView />;
      case "page-editor": return <PageEditorView />;
      case "crawl-settings": return <CrawlSettingsView />;
      case "reports": return <ReportsView />;
      case "admin": return <AdminView />;
      case "settings": return <SettingsView />;
      case "billing": return <BillingView />;
      case "integrations": return <IntegrationsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Top bar */}
      <TopBar onMenu={() => setSidebarOpen(true)} />
      <div className="flex flex-1 w-full">
        {/* Sidebar — desktop */}
        <Sidebar />
        {/* Sidebar — mobile (drawer) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar border-r overflow-y-auto">
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}
        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {currentAudit || view === "admin" || view === "settings" || view === "billing" || view === "integrations" || view === "reports" || view === "history" || view === "competitors" || view === "ai-chat" || view === "tools" || view === "ufuqlink" || view === "visual-preview" || view === "extension" || view === "support" || view === "keywords" || view === "backlinks" || view === "content" || view === "link-graph" || view === "scheduled" || view === "portal" || view === "search-console" || view === "email" || view === "activity" || view === "api-docs" || view === "page-editor" || view === "crawl-settings" ? (
              renderView()
            ) : (
              <EmptyState onRun={() => setView("landing")} />
            )}
          </div>
        </main>
      </div>
      <PrintReportPortal />
      <CommandPalette />
        <FloatingChat />
    </div>
  );
}

// Reusable app shell for logged-in users (no footer)
function AppShell() {
  const { view, setView, currentAudit } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const renderView = () => {
    switch (view) {
      case "dashboard": return <DashboardView />;
      case "issues": return <IssuesView />;
      case "pages": return <PagesView />;
      case "history": return <AuditHistoryView />;
      case "competitors": return <CompetitorsView />;
      case "aeo": return <AeoView />;
      case "geo": return <GeoView />;
      case "performance": return <PerformanceView />;
      case "security": return <SecurityView />;
      case "ai-recommendations": return <AiRecommendationsView />;
      case "ai-chat": return <AiChatView />;
      case "tools": return <SeoToolsView />;
      case "ufuqlink": return <UfuqLinkView />;
      case "visual-preview": return <VisualPreviewView />;
      case "extension": return <ExtensionView />;
      case "support": return <SupportView />;
      case "keywords": return <KeywordsView />;
      case "backlinks": return <BacklinksView />;
      case "content": return <ContentView />;
      case "link-graph": return <LinkGraphView />;
      case "scheduled": return <ScheduledAuditsView />;
      case "search-console": return <SearchConsoleView />;
      case "portal": return <ClientPortalView />;
      case "email": return <EmailReportsView />;
      case "activity": return <ActivityFeedView />;
      case "api-docs": return <ApiDocsView />;
      case "page-editor": return <PageEditorView />;
      case "crawl-settings": return <CrawlSettingsView />;
      case "reports": return <ReportsView />;
      case "admin": return <AdminView />;
      case "settings": return <SettingsView />;
      case "billing": return <BillingView />;
      case "integrations": return <IntegrationsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <TopBar onMenu={() => setSidebarOpen(true)} />
      <div className="flex flex-1 w-full">
        <Sidebar />
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar border-r overflow-y-auto">
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {currentAudit || view === "admin" || view === "settings" || view === "billing" || view === "integrations" || view === "reports" || view === "history" || view === "competitors" || view === "ai-chat" || view === "tools" || view === "ufuqlink" || view === "visual-preview" || view === "extension" || view === "support" || view === "keywords" || view === "backlinks" || view === "content" || view === "link-graph" || view === "scheduled" || view === "portal" || view === "search-console" || view === "email" || view === "activity" || view === "api-docs" || view === "page-editor" || view === "crawl-settings" ? (
              renderView()
            ) : (
              <EmptyState onRun={() => setView("landing")} />
            )}
          </div>
        </main>
      </div>
      <PrintReportPortal />
      <CommandPalette />
      <FloatingChat />
    </div>
  );
}

function EmptyState({ onRun }: { onRun: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Brain className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">No audit yet</h2>
        <p className="text-muted-foreground mt-1 max-w-md">Run your first website audit to see scores, issues, and AI-powered fixes across SEO, AEO, GEO & Performance.</p>
      </div>
      <Button size="lg" onClick={onRun}>Run Free Audit</Button>
    </div>
  );
}
