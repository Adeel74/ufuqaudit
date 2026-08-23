// Shared types for UfuqAudit

export type Severity = "critical" | "error" | "warning" | "opportunity";
export type Category =
  | "technical"
  | "content"
  | "performance"
  | "aeo"
  | "geo"
  | "security"
  | "on_page"
  | "internal_links"
  | "schema";

export type IssueStatus = "open" | "fixed" | "ignored";

export interface IssueData {
  id?: string;
  category: Category;
  severity: Severity;
  issueType: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  recommendation?: string;
  pageUrl?: string;
  status?: IssueStatus;
}

export interface PageData {
  url: string;
  statusCode?: number;
  title?: string;
  metaDescription?: string;
  h1?: string;
  h2Count?: number;
  wordCount?: number;
  loadTimeMs?: number;
  pageSizeKb?: number;
  indexable?: boolean;
  issuesCount?: number;
  hasSchema?: boolean;
  hasFAQ?: boolean;
  hasOg?: boolean;
  hasTwitter?: boolean;
  https?: boolean;
  hasViewport?: boolean;
  hasLang?: boolean;
  hasCanonical?: boolean;
  imagesTotal?: number;
  imagesWithoutAlt?: number;
  internalLinks?: number;
  externalLinks?: number;
  brokenLinks?: number;
  loadTime?: number;
}

export interface CategoryScore {
  technical: number;
  content: number;
  performance: number;
  aeo: number;
  geo: number;
  security: number;
}

export interface AuditResult {
  id: string;
  url: string;
  status: "pending" | "running" | "done" | "failed";
  overallScore: number;
  scores: CategoryScore;
  pages: PageData[];
  issues: IssueData[];
  pagesCrawled: number;
  counts: {
    critical: number;
    error: number;
    warning: number;
    opportunity: number;
  };
  aiActionPlan: string[];
  summary?: string;
  createdAt: string;
  history?: { date: string; score: number }[];
  geoBreakdown?: { chatgpt: number; claude: number; perplexity: number; google: number };
  aeoBreakdown?: { answerReadiness: number; questionCoverage: number; entityClarity: number; citationReadiness: number; schema: number };
}

export const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; bg: string; dot: string; icon: string }
> = {
  critical: { label: "Critical", color: "text-red-600", bg: "bg-red-50 border-red-200", dot: "bg-red-500", icon: "AlertOctagon" },
  error: { label: "Error", color: "text-orange-600", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-500", icon: "AlertTriangle" },
  warning: { label: "Warning", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500", icon: "AlertCircle" },
  opportunity: { label: "Opportunity", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", icon: "Lightbulb" },
};

export const CATEGORY_META: Record<
  Category,
  { label: string; weight: number; icon: string; color: string }
> = {
  technical: { label: "Technical SEO", weight: 25, icon: "Cog", color: "#6366f1" },
  content: { label: "Content SEO", weight: 20, icon: "FileText", color: "#10b981" },
  performance: { label: "Performance", weight: 15, icon: "Gauge", color: "#f59e0b" },
  aeo: { label: "AEO", weight: 15, icon: "MessageSquare", color: "#8b5cf6" },
  geo: { label: "GEO / AI Visibility", weight: 15, icon: "Brain", color: "#ec4899" },
  security: { label: "Security", weight: 10, icon: "Shield", color: "#06b6d4" },
  on_page: { label: "On-Page", weight: 0, icon: "FileText", color: "#6366f1" },
  internal_links: { label: "Internal Links", weight: 0, icon: "Link", color: "#10b981" },
  schema: { label: "Schema", weight: 0, icon: "Code", color: "#8b5cf6" },
};

export interface PlanTier {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  urlLimit: number;
  projectLimit: number;
  features: string[];
  popular?: boolean;
  cta: string;
}

export const PLAN_TIERS: PlanTier[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    urlLimit: 50,
    projectLimit: 1,
    features: ["1 project", "50 URLs / audit", "1 audit / month", "Basic Technical SEO", "Score 0–100", "Basic AI crawler check"],
    cta: "Start Free",
  },
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 19,
    priceYearly: 190,
    urlLimit: 1000,
    projectLimit: 5,
    features: ["5 projects", "1,000 URLs / project", "Unlimited audits", "AEO + GEO audit", "AI recommendations", "PDF report", "Audit history"],
    cta: "Choose Starter",
    popular: true,
  },
  {
    id: "pro",
    name: "Professional",
    priceMonthly: 49,
    priceYearly: 490,
    urlLimit: 10000,
    projectLimit: 20,
    features: ["20 projects", "10,000 URLs", "GSC integration", "Scheduled crawling", "White-label reports", "Competitor comparison", "AI visibility tracking"],
    cta: "Choose Pro",
  },
  {
    id: "agency",
    name: "Agency",
    priceMonthly: 99,
    priceYearly: 990,
    urlLimit: 50000,
    projectLimit: 50,
    features: ["50 projects", "50,000 URLs", "Client management", "White-label dashboard", "Team members", "API access", "Automated reports"],
    cta: "Choose Agency",
  },
];
