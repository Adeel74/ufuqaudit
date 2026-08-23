// GET/POST /api/admin/blog — blog post management
import { NextRequest, NextResponse } from "next/server";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  author: string;
  category: string;
  tags: string[];
  status: "published" | "draft" | "scheduled" | "pending";
  excerpt: string;
  seoScore: number;
  readabilityScore: number;
  wordCount: number;
  focusKeyword: string;
  featuredImage: string | null;
  publishedAt: string | null;
  createdAt: string;
  views: number;
}

const POSTS: BlogPost[] = [
  { id: "post_1", title: "The Complete Guide to AEO: Answer Engine Optimization in 2024", slug: "complete-aeo-guide-2024", author: "Sarah Chen", category: "AEO", tags: ["aeo", "ai", "optimization"], status: "published", excerpt: "Everything you need to know about optimizing for AI answer engines.", seoScore: 92, readabilityScore: 78, wordCount: 3200, focusKeyword: "aeo optimization", featuredImage: "/blog/aeo-guide.jpg", publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(), createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), views: 8432 },
  { id: "post_2", title: "GEO vs SEO: What's Different and Why It Matters", slug: "geo-vs-seo", author: "Amir Hassan", category: "GEO", tags: ["geo", "ai visibility", "seo"], status: "published", excerpt: "Understand the key differences between traditional SEO and GEO.", seoScore: 88, readabilityScore: 82, wordCount: 2400, focusKeyword: "geo vs seo", featuredImage: "/blog/geo-seo.jpg", publishedAt: new Date(Date.now() - 12 * 86400000).toISOString(), createdAt: new Date(Date.now() - 15 * 86400000).toISOString(), views: 6218 },
  { id: "post_3", title: "10 Technical SEO Checks You Can't Afford to Miss", slug: "technical-seo-checks", author: "Mike Rodriguez", category: "Technical SEO", tags: ["technical", "audit", "checks"], status: "published", excerpt: "Critical technical SEO issues that hurt your rankings.", seoScore: 95, readabilityScore: 75, wordCount: 2800, focusKeyword: "technical seo checks", featuredImage: "/blog/tech-seo.jpg", publishedAt: new Date(Date.now() - 20 * 86400000).toISOString(), createdAt: new Date(Date.now() - 25 * 86400000).toISOString(), views: 12890 },
  { id: "post_4", title: "How to Generate FAQ Schema with AI", slug: "ai-faq-schema-generation", author: "Lena Petrova", category: "Schema", tags: ["schema", "ai", "faq"], status: "draft", excerpt: "Use AI to generate FAQPage JSON-LD schema automatically.", seoScore: 71, readabilityScore: 80, wordCount: 1800, focusKeyword: "faq schema generator", featuredImage: null, publishedAt: null, createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), views: 0 },
  { id: "post_5", title: "Core Web Vitals: A 2024 Survival Guide", slug: "core-web-vitals-2024", author: "Sarah Chen", category: "Performance", tags: ["performance", "cwv", "lighthouse"], status: "scheduled", excerpt: "Master LCP, INP, and CLS with actionable fixes.", seoScore: 89, readabilityScore: 77, wordCount: 3100, focusKeyword: "core web vitals", featuredImage: "/blog/cwv.jpg", publishedAt: new Date(Date.now() + 2 * 86400000).toISOString(), createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), views: 0 },
  { id: "post_6", title: "AI Search Readiness: Is Your Site Ready for ChatGPT?", slug: "ai-search-readiness", author: "Amir Hassan", category: "AEO", tags: ["aeo", "chatgpt", "ai"], status: "pending", excerpt: "Check your site's readiness for AI answer engines.", seoScore: 68, readabilityScore: 85, wordCount: 1500, focusKeyword: "ai search readiness", featuredImage: null, publishedAt: null, createdAt: new Date(Date.now() - 0.5 * 86400000).toISOString(), views: 0 },
  { id: "post_7", title: "Internal Linking Strategy: Build Your SEO Silo", slug: "internal-linking-strategy", author: "Mike Rodriguez", category: "Technical SEO", tags: ["internal links", "silo", "architecture"], status: "published", excerpt: "How to structure internal links for maximum SEO impact.", seoScore: 86, readabilityScore: 73, wordCount: 2600, focusKeyword: "internal linking strategy", featuredImage: "/blog/internal-links.jpg", publishedAt: new Date(Date.now() - 35 * 86400000).toISOString(), createdAt: new Date(Date.now() - 40 * 86400000).toISOString(), views: 4321 },
];

const CATEGORIES = [
  { name: "AEO", postCount: 2, color: "#8b5cf6" },
  { name: "GEO", postCount: 1, color: "#ec4899" },
  { name: "Technical SEO", postCount: 2, color: "#6366f1" },
  { name: "Performance", postCount: 1, color: "#f59e0b" },
  { name: "Schema", postCount: 1, color: "#10b981" },
];

export async function GET() {
  return NextResponse.json({
    posts: POSTS,
    stats: {
      total: POSTS.length,
      published: POSTS.filter((p) => p.status === "published").length,
      drafts: POSTS.filter((p) => p.status === "draft").length,
      scheduled: POSTS.filter((p) => p.status === "scheduled").length,
      pending: POSTS.filter((p) => p.status === "pending").length,
      totalViews: POSTS.reduce((s, p) => s + p.views, 0),
    },
    categories: CATEGORIES,
    authors: [...new Set(POSTS.map((p) => p.author))].map((a) => ({ name: a, postCount: POSTS.filter((p) => p.author === a).length })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { title, author, category, tags, content, excerpt } = body;
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const newPost: BlogPost = {
    id: `post_${Date.now()}`,
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    author: author || "Admin",
    category: category || "Technical SEO",
    tags: tags || [],
    status: "draft",
    excerpt: excerpt || "",
    seoScore: 0,
    readabilityScore: 0,
    wordCount: content ? content.split(/\s+/).length : 0,
    focusKeyword: "",
    featuredImage: null,
    publishedAt: null,
    createdAt: new Date().toISOString(),
    views: 0,
  };
  POSTS.unshift(newPost);
  return NextResponse.json({ post: newPost });
}
