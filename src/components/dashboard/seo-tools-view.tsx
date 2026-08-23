"use client";

import * as React from "react";
import { ViewHeader } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Tag, Bot, Code2, Map, Link as LinkIcon, Eye, Copy, Check, Loader2,
  Plus, Trash2, CheckCircle2, XCircle, AlertCircle, Wrench, RefreshCw,
} from "lucide-react";

// ---------- Shared bits ----------
const SCROLLBAR_CLS =
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full " +
  "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 " +
  "[&::-webkit-scrollbar-track]:bg-transparent";

const PRE_CLS =
  "bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed " +
  SCROLLBAR_CLS;

interface ToolDef {
  id: string;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOOLS: ToolDef[] = [
  { id: "meta", name: "Meta Tag Generator", desc: "Title, description, OG & Twitter tags", icon: Tag },
  { id: "robots", name: "robots.txt Generator", desc: "Crawl rules + AI bot blocks", icon: Bot },
  { id: "schema", name: "JSON-LD Schema Generator", desc: "Structured data for 7 types", icon: Code2 },
  { id: "sitemap", name: "Sitemap XML Generator", desc: "URL list → sitemap.xml", icon: Map },
  { id: "canonical", name: "Canonical Tag Checker", desc: "Verify rel=canonical on a page", icon: LinkIcon },
  { id: "og", name: "Open Graph Preview", desc: "Visual social card preview", icon: Eye },
];

function useCopy() {
  const [copied, setCopied] = React.useState(false);
  const copy = React.useCallback(async (text: string, label = "Copied to clipboard") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(label);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  }, []);
  return { copied, copy };
}

function CodeBlock({ code, onCopy, copied }: {
  code: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="relative group">
      <pre className={PRE_CLS}>{code || "// output will appear here"}</pre>
      <Button
        size="sm"
        variant="outline"
        onClick={onCopy}
        className="absolute top-2 right-2 h-7 text-xs opacity-90 group-hover:opacity-100"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function FieldRow({ label, children, hint }: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ---------- Main component ----------
export function SeoToolsView() {
  const [activeTool, setActiveTool] = React.useState<string>("meta");
  const active = TOOLS.find((t) => t.id === activeTool) ?? TOOLS[0];

  return (
    <div className="space-y-6">
      <ViewHeader
        title="SEO Tools"
        subtitle="Generators & checkers to fix what your audit found"
        icon={Wrench}
      />

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Tool selector (desktop vertical) */}
        <div className="hidden lg:block">
          <Card className="p-2">
            <div className="space-y-1">
              {TOOLS.map((t) => {
                const Icon = t.icon;
                const isActive = t.id === activeTool;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTool(t.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                      isActive
                        ? "bg-emerald-500/10 border border-emerald-500/30"
                        : "border border-transparent hover:bg-muted/50",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        isActive
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-muted-foreground/10 text-muted-foreground",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className={cn(
                        "text-sm font-medium leading-tight",
                        isActive && "text-emerald-700 dark:text-emerald-300",
                      )}>
                        {t.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                        {t.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Mobile dropdown */}
        <div className="lg:hidden">
          <Select value={activeTool} onValueChange={setActiveTool}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOOLS.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active tool panel */}
        <div>
          {active.id === "meta" && <MetaTool />}
          {active.id === "robots" && <RobotsTool />}
          {active.id === "schema" && <SchemaTool />}
          {active.id === "sitemap" && <SitemapTool />}
          {active.id === "canonical" && <CanonicalTool />}
          {active.id === "og" && <OpenGraphTool />}
        </div>
      </div>
    </div>
  );
}

// ---------- Tool 1: Meta Tag Generator ----------
function MetaTool() {
  const { copied, copy } = useCopy();
  const [title, setTitle] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [site, setSite] = React.useState("");
  const [image, setImage] = React.useState("");

  const titleLen = title.length;
  const descLen = desc.length;
  const titleColor =
    titleLen === 0 ? "text-muted-foreground" :
    titleLen >= 50 && titleLen <= 60 ? "text-emerald-600" :
    titleLen < 30 ? "text-amber-600" : "text-orange-600";
  const descColor =
    descLen === 0 ? "text-muted-foreground" :
    descLen >= 140 && descLen <= 160 ? "text-emerald-600" :
    descLen < 120 ? "text-amber-600" : "text-orange-600";

  const safeUrl = url || "https://example.com/";
  const safeImg = image || "https://example.com/og.png";
  const safeSite = site || "Example";

  const output = [
    `<title>${title || "Your Page Title Here"}</title>`,
    `<meta name="description" content="${desc || "Your page description (140-160 chars)."}" />`,
    ``,
    `<!-- Open Graph -->`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${title || "Your Page Title"}" />`,
    `<meta property="og:description" content="${desc || "Your page description."}" />`,
    `<meta property="og:url" content="${safeUrl}" />`,
    `<meta property="og:site_name" content="${safeSite}" />`,
    `<meta property="og:image" content="${safeImg}" />`,
    ``,
    `<!-- Twitter Card -->`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title || "Your Page Title"}" />`,
    `<meta name="twitter:description" content="${desc || "Your page description."}" />`,
    `<meta name="twitter:image" content="${safeImg}" />`,
  ].join("\n");

  return (
    <Card className="p-5 space-y-5">
      <ToolHeader
        icon={Tag}
        title="Meta Tag Generator"
        desc="Generate title, description, Open Graph & Twitter card meta tags."
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <FieldRow label="Page title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Best AI-Powered SEO Audit Tool — UfuqAudit"
          />
          <p className={cn("text-[10px] mt-1", titleColor)}>
            {titleLen} / 60 chars {titleLen >= 50 && titleLen <= 60 ? "(ideal ✓)" : "(aim 50-60)"}
          </p>
        </FieldRow>
        <FieldRow label="Page URL">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/page"
          />
        </FieldRow>
        <div className="sm:col-span-2">
          <FieldRow label="Meta description">
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Concise summary that appears in search results and social cards."
              rows={2}
              className="resize-none"
            />
            <p className={cn("text-[10px] mt-1", descColor)}>
              {descLen} / 160 chars {descLen >= 140 && descLen <= 160 ? "(ideal ✓)" : "(aim 140-160)"}
            </p>
          </FieldRow>
        </div>
        <FieldRow label="Site name">
          <Input
            value={site}
            onChange={(e) => setSite(e.target.value)}
            placeholder="UfuqAudit"
          />
        </FieldRow>
        <FieldRow label="Image URL (optional)">
          <Input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://example.com/og-image.png"
          />
        </FieldRow>
      </div>
      <CodeBlock
        code={output}
        onCopy={() => copy(output)}
        copied={copied}
      />
    </Card>
  );
}

// ---------- Tool 2: robots.txt Generator ----------
function RobotsTool() {
  const { copied, copy } = useCopy();
  const [allowAll, setAllowAll] = React.useState(true);
  const [disallow, setDisallow] = React.useState("");
  const [sitemap, setSitemap] = React.useState("");
  const [blockAi, setBlockAi] = React.useState(false);

  const aiBots = ["GPTBot", "ClaudeBot", "PerplexityBot", "CCBot", "Google-Extended"];
  const disallowPaths = disallow
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const lines: string[] = [];
  lines.push("# robots.txt — generated by UfuqAudit SEO Tools");
  lines.push("");
  if (allowAll) {
    lines.push("User-agent: *");
    if (disallowPaths.length > 0) {
      for (const p of disallowPaths) lines.push(`Disallow: ${p}`);
    } else {
      lines.push("Disallow:");
    }
    lines.push("");
  } else {
    lines.push("User-agent: *");
    lines.push("Disallow: /");
    lines.push("");
  }

  if (blockAi) {
    for (const b of aiBots) {
      lines.push(`User-agent: ${b}`);
      lines.push("Disallow: /");
      lines.push("");
    }
  }

  if (sitemap.trim()) {
    lines.push(`Sitemap: ${sitemap.trim()}`);
  }

  const output = lines.join("\n");

  return (
    <Card className="p-5 space-y-5">
      <ToolHeader
        icon={Bot}
        title="robots.txt Generator"
        desc="Define crawler rules and optionally block AI training bots."
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card">
          <div>
            <div className="text-sm font-medium">Allow all crawlers</div>
            <p className="text-[11px] text-muted-foreground">
              When off, blocks all paths site-wide.
            </p>
          </div>
          <Switch checked={allowAll} onCheckedChange={setAllowAll} />
        </div>
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card">
          <div>
            <div className="text-sm font-medium">Block AI training bots</div>
            <p className="text-[11px] text-muted-foreground">
              Adds GPTBot, ClaudeBot, PerplexityBot, etc.
            </p>
          </div>
          <Switch checked={blockAi} onCheckedChange={setBlockAi} />
        </div>
        <FieldRow label="Disallow paths (one per line)">
          <Textarea
            value={disallow}
            onChange={(e) => setDisallow(e.target.value)}
            placeholder={"/admin\n/private/\n/tmp"}
            rows={4}
            className="resize-none font-mono text-xs"
          />
        </FieldRow>
        <FieldRow label="Sitemap URL">
          <Input
            value={sitemap}
            onChange={(e) => setSitemap(e.target.value)}
            placeholder="https://example.com/sitemap.xml"
          />
        </FieldRow>
      </div>
      <CodeBlock
        code={output}
        onCopy={() => copy(output)}
        copied={copied}
      />
    </Card>
  );
}

// ---------- Tool 3: JSON-LD Schema Generator ----------
type SchemaType = "Organization" | "WebSite" | "WebPage" | "Article" | "FAQPage" | "BreadcrumbList" | "LocalBusiness";
const SCHEMA_TYPES: SchemaType[] = ["Organization", "WebSite", "WebPage", "Article", "FAQPage", "BreadcrumbList", "LocalBusiness"];

interface FaqPair { q: string; a: string; }
interface Crumb { name: string; url: string; }

function SchemaTool() {
  const { copied, copy } = useCopy();
  const [type, setType] = React.useState<SchemaType>("Organization");

  // Shared fields
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [logo, setLogo] = React.useState("");
  const [sameAs, setSameAs] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Article
  const [headline, setHeadline] = React.useState("");
  const [author, setAuthor] = React.useState("");
  const [datePublished, setDatePublished] = React.useState("");
  const [image, setImage] = React.useState("");

  // FAQ
  const [faqs, setFaqs] = React.useState<FaqPair[]>([{ q: "", a: "" }]);

  // Breadcrumb
  const [crumbs, setCrumbs] = React.useState<Crumb[]>([{ name: "Home", url: "/" }]);

  // LocalBusiness
  const [telephone, setTelephone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [openingHours, setOpeningHours] = React.useState("");

  const schema = React.useMemo(() => {
    const base: Record<string, unknown> = { "@context": "https://schema.org" };
    const sameAsArr = sameAs.split("\n").map((s) => s.trim()).filter(Boolean);

    switch (type) {
      case "Organization":
        base["@type"] = "Organization";
        base.name = name || "Example Inc";
        if (url) base.url = url;
        if (logo) base.logo = logo;
        if (sameAsArr.length) base.sameAs = sameAsArr;
        break;
      case "WebSite":
        base["@type"] = "WebSite";
        base.name = name || "Example";
        if (url) base.url = url;
        if (description) base.description = description;
        break;
      case "WebPage":
        base["@type"] = "WebPage";
        if (name) base.name = name;
        if (url) base.url = url;
        if (description) base.description = description;
        if (image) base.image = image;
        break;
      case "Article":
        base["@type"] = "Article";
        base.headline = headline || "Article headline";
        if (author) base.author = { "@type": "Person", name: author };
        if (datePublished) base.datePublished = datePublished;
        if (image) base.image = image;
        if (url) base.url = url;
        break;
      case "FAQPage": {
        base["@type"] = "FAQPage";
        const valid = faqs.filter((f) => f.q.trim() && f.a.trim());
        base.mainEntity = valid.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        }));
        break;
      }
      case "BreadcrumbList": {
        base["@type"] = "BreadcrumbList";
        base.itemListElement = crumbs.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.name || `Item ${i + 1}`,
          item: c.url,
        }));
        break;
      }
      case "LocalBusiness":
        base["@type"] = "LocalBusiness";
        base.name = name || "Example Business";
        if (url) base.url = url;
        if (telephone) base.telephone = telephone;
        if (address) base.address = { "@type": "PostalAddress", streetAddress: address };
        if (openingHours) base.openingHours = openingHours;
        if (sameAsArr.length) base.sameAs = sameAsArr;
        break;
    }
    return base;
  }, [type, name, url, logo, sameAs, description, headline, author, datePublished, image, faqs, crumbs, telephone, address, openingHours]);

  let jsonStr = "";
  let parseError: string | null = null;
  try {
    jsonStr = JSON.stringify(schema, null, 2);
    JSON.parse(jsonStr); // sanity-check
  } catch (e) {
    parseError = e instanceof Error ? e.message : "Invalid JSON";
  }

  const output = `<script type="application/ld+json">\n${jsonStr}\n</script>`;

  return (
    <Card className="p-5 space-y-5">
      <ToolHeader
        icon={Code2}
        title="JSON-LD Schema Generator"
        desc="Pick a schema type, fill the fields, get a valid script tag."
      />
      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-xs font-medium">Schema type</Label>
        <Select value={type} onValueChange={(v) => setType(v as SchemaType)}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCHEMA_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge
          variant="outline"
          className={cn(
            "ml-auto",
            parseError ? "border-red-300 text-red-600" : "border-emerald-300 text-emerald-600",
          )}
        >
          {parseError ? (
            <><XCircle className="w-3 h-3 mr-1" /> Invalid JSON</>
          ) : (
            <><CheckCircle2 className="w-3 h-3 mr-1" /> Valid JSON</>
          )}
        </Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {(type === "Organization" || type === "WebSite" || type === "WebPage" || type === "LocalBusiness") && (
          <FieldRow label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="UfuqAudit" />
          </FieldRow>
        )}
        {type !== "Article" && type !== "FAQPage" && type !== "BreadcrumbList" && (
          <FieldRow label="URL">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
          </FieldRow>
        )}
        {type === "Organization" && (
          <FieldRow label="Logo URL">
            <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://example.com/logo.png" />
          </FieldRow>
        )}
        {type === "Organization" && (
          <div className="sm:col-span-2">
            <FieldRow label="sameAs (one URL per line)" hint="Social profiles / Wikipedia / etc.">
              <Textarea
                value={sameAs}
                onChange={(e) => setSameAs(e.target.value)}
                placeholder={"https://twitter.com/example\nhttps://linkedin.com/company/example"}
                rows={3}
                className="resize-none font-mono text-xs"
              />
            </FieldRow>
          </div>
        )}
        {(type === "WebSite" || type === "WebPage") && (
          <div className="sm:col-span-2">
            <FieldRow label="Description">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="resize-none"
                placeholder="A short description of the page/site."
              />
            </FieldRow>
          </div>
        )}
        {(type === "WebPage" || type === "Article") && (
          <FieldRow label="Image URL">
            <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://example.com/image.jpg" />
          </FieldRow>
        )}
        {type === "Article" && (
          <>
            <div className="sm:col-span-2">
              <FieldRow label="Headline">
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="How to audit your site for AEO" />
              </FieldRow>
            </div>
            <FieldRow label="Author">
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Jane Doe" />
            </FieldRow>
            <FieldRow label="Date published">
              <Input value={datePublished} onChange={(e) => setDatePublished(e.target.value)} placeholder="2024-12-01" />
            </FieldRow>
          </>
        )}
        {type === "LocalBusiness" && (
          <>
            <FieldRow label="Telephone">
              <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+1-555-0100" />
            </FieldRow>
            <FieldRow label="Street address">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />
            </FieldRow>
            <FieldRow label="Opening hours">
              <Input value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} placeholder="Mo-Fr 09:00-17:00" />
            </FieldRow>
            <div className="sm:col-span-2">
              <FieldRow label="sameAs (one URL per line)">
                <Textarea
                  value={sameAs}
                  onChange={(e) => setSameAs(e.target.value)}
                  rows={2}
                  className="resize-none font-mono text-xs"
                />
              </FieldRow>
            </div>
          </>
        )}
        {type === "FAQPage" && (
          <div className="sm:col-span-2 space-y-2">
            <Label className="text-xs font-medium">Q&A pairs</Label>
            {faqs.map((f, i) => (
              <div key={i} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-start">
                <Input
                  value={f.q}
                  onChange={(e) => setFaqs((arr) => arr.map((x, j) => j === i ? { ...x, q: e.target.value } : x))}
                  placeholder={`Question ${i + 1}`}
                  className="text-xs"
                />
                <Textarea
                  value={f.a}
                  onChange={(e) => setFaqs((arr) => arr.map((x, j) => j === i ? { ...x, a: e.target.value } : x))}
                  placeholder="Answer"
                  rows={1}
                  className="text-xs resize-none"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setFaqs((arr) => arr.filter((_, j) => j !== i))}
                  disabled={faqs.length === 1}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFaqs((arr) => [...arr, { q: "", a: "" }])}
            >
              <Plus className="w-3.5 h-3.5" /> Add question
            </Button>
          </div>
        )}
        {type === "BreadcrumbList" && (
          <div className="sm:col-span-2 space-y-2">
            <Label className="text-xs font-medium">Breadcrumb items</Label>
            {crumbs.map((c, i) => (
              <div key={i} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-start">
                <Input
                  value={c.name}
                  onChange={(e) => setCrumbs((arr) => arr.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                  placeholder={`Item ${i + 1} name`}
                  className="text-xs"
                />
                <Input
                  value={c.url}
                  onChange={(e) => setCrumbs((arr) => arr.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
                  placeholder="/path"
                  className="text-xs"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setCrumbs((arr) => arr.filter((_, j) => j !== i))}
                  disabled={crumbs.length === 1}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCrumbs((arr) => [...arr, { name: "", url: "" }])}
            >
              <Plus className="w-3.5 h-3.5" /> Add breadcrumb
            </Button>
          </div>
        )}
      </div>

      <CodeBlock
        code={output}
        onCopy={() => copy(output)}
        copied={copied}
      />
    </Card>
  );
}

// ---------- Tool 4: Sitemap XML Generator ----------
function SitemapTool() {
  const { copied, copy } = useCopy();
  const [urlsText, setUrlsText] = React.useState("");
  const [changefreq, setChangefreq] = React.useState("weekly");
  const [priority, setPriority] = React.useState("0.8");

  const urls = urlsText.split("\n").map((s) => s.trim()).filter(Boolean);
  const validUrls = urls.filter((u) => /^https?:\/\//.test(u));

  const xml = urls.length === 0
    ? '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <!-- add one URL per line above -->\n</urlset>'
    : `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${validUrls
        .map(
          (u) =>
            `  <url>\n    <loc>${escapeXml(u)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
        )
        .join("\n")}\n</urlset>`;

  return (
    <Card className="p-5 space-y-5">
      <ToolHeader
        icon={Map}
        title="Sitemap XML Generator"
        desc="Turn a list of URLs into a valid sitemap.xml."
      />
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <Badge variant="outline" className="border-emerald-300 text-emerald-600">
          {validUrls.length} valid URL{validUrls.length === 1 ? "" : "s"}
        </Badge>
        {urls.length !== validUrls.length && (
          <Badge variant="outline" className="border-amber-300 text-amber-600">
            {urls.length - validUrls.length} skipped (need http(s)://)
          </Badge>
        )}
      </div>
      <FieldRow label="URLs (one per line)">
        <Textarea
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
          placeholder={"https://example.com/\nhttps://example.com/about\nhttps://example.com/blog/post-1"}
          rows={6}
          className="resize-none font-mono text-xs"
        />
      </FieldRow>
      <div className="grid sm:grid-cols-2 gap-4">
        <FieldRow label="Change frequency">
          <Select value={changefreq} onValueChange={setChangefreq}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"].map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Priority">
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["1.0", "0.9", "0.8", "0.7", "0.6", "0.5", "0.4", "0.3", "0.2", "0.1"].map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
      </div>
      <CodeBlock code={xml} onCopy={() => copy(xml)} copied={copied} />
    </Card>
  );
}

// ---------- Tool 5: Canonical Tag Checker ----------
interface CanonicalResult {
  canonical: string | null;
  selfReferencing: boolean | null;
  matchesInput: boolean | null;
  fetched: boolean;
  error?: string;
}

function parseCanonicalFromHtml(html: string): string | null {
  const match =
    html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i) ||
    html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  if (!match) return null;
  const tag = match[0];
  const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
  return hrefMatch ? hrefMatch[1] : null;
}

function CanonicalTool() {
  const { copied, copy } = useCopy();
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<CanonicalResult | null>(null);
  const [pastedHtml, setPastedHtml] = React.useState("");
  const [pasteResult, setPasteResult] = React.useState<CanonicalResult | null>(null);

  async function checkUrl() {
    if (!url.trim()) {
      toast.error("Enter a URL to check");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(url, { redirect: "follow" });
      const html = await res.text();
      const canonical = parseCanonicalFromHtml(html);
      const finalUrl = res.url || url;
      setResult({
        canonical,
        selfReferencing: canonical ? canonical === finalUrl : null,
        matchesInput: canonical ? canonical === url : null,
        fetched: true,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "fetch failed";
      setResult({
        canonical: null,
        selfReferencing: null,
        matchesInput: null,
        fetched: false,
        error: `Could not fetch (${msg}). This is usually a CORS block. Try pasting the page HTML below instead.`,
      });
    } finally {
      setLoading(false);
    }
  }

  function checkPasted() {
    if (!pastedHtml.trim()) {
      toast.error("Paste some HTML first");
      return;
    }
    const canonical = parseCanonicalFromHtml(pastedHtml);
    setPasteResult({
      canonical,
      selfReferencing: canonical ? canonical === url : null,
      matchesInput: canonical ? canonical === url : null,
      fetched: true,
    });
  }

  return (
    <Card className="p-5 space-y-5">
      <ToolHeader
        icon={LinkIcon}
        title="Canonical Tag Checker"
        desc="Verify a page's rel=canonical — and whether it points to itself."
      />
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/page"
          onKeyDown={(e) => { if (e.key === "Enter") void checkUrl(); }}
        />
        <Button
          onClick={checkUrl}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Check
        </Button>
      </div>

      {result && (
        <CanonicalResultCard result={result} />
      )}

      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <p className="text-xs text-muted-foreground">
            Browser CORS often blocks direct fetches. If the check fails, paste the page&apos;s HTML source below:
          </p>
        </div>
        <Textarea
          value={pastedHtml}
          onChange={(e) => setPastedHtml(e.target.value)}
          placeholder="<html>...<head>...<link rel='canonical' href='...' />...</head>..."
          rows={5}
          className="resize-none font-mono text-xs"
        />
        <div className="mt-2 flex gap-2">
          <Button variant="outline" size="sm" onClick={checkPasted}>
            Parse pasted HTML
          </Button>
          {pasteResult && pasteResult.canonical && (
            <Button variant="ghost" size="sm" onClick={() => copy(pasteResult.canonical!, "Canonical URL copied")}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              Copy canonical
            </Button>
          )}
        </div>
        {pasteResult && (
          <CanonicalResultCard result={pasteResult} />
        )}
      </div>
    </Card>
  );
}

function CanonicalResultCard({ result }: { result: CanonicalResult }) {
  const checks: { label: string; ok: boolean | null; value: string }[] = [
    {
      label: "Fetch succeeded",
      ok: result.fetched,
      value: result.fetched ? "Yes" : (result.error ? "No" : "No"),
    },
    {
      label: "Canonical tag present",
      ok: result.canonical ? true : false,
      value: result.canonical ? "Found" : "Not found",
    },
    {
      label: "Self-referencing",
      ok: result.selfReferencing,
      value: result.selfReferencing === null ? "—" : result.selfReferencing ? "Yes" : "No",
    },
    {
      label: "Matches input URL",
      ok: result.matchesInput,
      value: result.matchesInput === null ? "—" : result.matchesInput ? "Yes" : "No",
    },
  ];

  return (
    <div className="rounded-lg border p-4 bg-card space-y-3">
      <div className="space-y-2">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-sm">
            {c.ok === true ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : c.ok === false ? (
              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0" />
            )}
            <span className="text-muted-foreground">{c.label}:</span>
            <span className="font-medium ml-auto">{c.value}</span>
          </div>
        ))}
      </div>
      {result.canonical && (
        <div className="text-xs font-mono break-all bg-muted/50 rounded p-2 border">
          {result.canonical}
        </div>
      )}
      {result.error && (
        <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded p-2">
          {result.error}
        </div>
      )}
    </div>
  );
}

// ---------- Tool 6: Open Graph Preview ----------
function OpenGraphTool() {
  const { copied, copy } = useCopy();
  const [title, setTitle] = React.useState("Best AI-Powered SEO Audit Tool — UfuqAudit");
  const [desc, setDesc] = React.useState("Audit your site for SEO, AEO, GEO & Performance with one click. Get AI-powered fixes for every issue.");
  const [image, setImage] = React.useState("https://images.unsplash.com/photo-1551434678-e076c223f1a5?w=1200&h=630&fit=crop");
  const [url, setUrl] = React.useState("https://ufuqaudit.app");

  const host = (() => {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url || "example.com"; }
  })();

  const ogTags = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${desc}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join("\n");

  return (
    <Card className="p-5 space-y-5">
      <ToolHeader
        icon={Eye}
        title="Open Graph Preview"
        desc="See how your link card will look on social media + grab the tags."
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <FieldRow label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </FieldRow>
        <FieldRow label="URL">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
        </FieldRow>
        <div className="sm:col-span-2">
          <FieldRow label="Description">
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </FieldRow>
        </div>
        <div className="sm:col-span-2">
          <FieldRow label="Image URL" hint="Recommended 1200×630">
            <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://example.com/og.png" />
          </FieldRow>
        </div>
      </div>

      {/* Visual preview */}
      <div>
        <Label className="text-xs font-medium mb-2 block">Social preview (Facebook / LinkedIn style)</Label>
        <div className="rounded-lg border overflow-hidden bg-background max-w-md">
          <div className="aspect-[1.91/1] bg-muted overflow-hidden">
            {image ? (
              <img
                src={image}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
            )}
          </div>
          <div className="p-3 bg-card">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">{host}</div>
            <div className="text-sm font-semibold leading-snug mt-0.5 line-clamp-2">{title || "Untitled page"}</div>
            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{desc || ""}</div>
          </div>
        </div>
      </div>

      <CodeBlock code={ogTags} onCopy={() => copy(ogTags)} copied={copied} />
    </Card>
  );
}

// ---------- Helpers ----------
function ToolHeader({ icon: Icon, title, desc }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-3 border-b">
      <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <h2 className="font-semibold text-base">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
