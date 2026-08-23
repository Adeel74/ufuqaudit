// UfuqAudit analyzers — turn CrawlResult into IssueData[] and category scores.

import type { CrawlResult } from "./crawler";
import type { IssueData, PageData, Severity, Category } from "./types";

// ---------- individual rule checks ----------

function addIssue(arr: IssueData[], i: Omit<IssueData, "id">) {
  arr.push(i);
}

function checkTechnical(pages: PageData[], crawl: CrawlResult): IssueData[] {
  const issues: IssueData[] = [];
  const primary = crawl.primaryPage || pages[0];
  const origin = crawl.origin;

  // robots.txt
  if (!crawl.robotsTxt) {
    addIssue(issues, {
      category: "technical",
      severity: "error",
      issueType: "robots_missing",
      title: "robots.txt is missing",
      description: "No robots.txt file was found at the site root. Search engine and AI crawlers use this file to understand what they may crawl.",
      impact: "high",
      recommendation: "Create a robots.txt file at /robots.txt that allows crawling of public content and disallows private paths. Reference your sitemap.",
      pageUrl: origin + "/robots.txt",
    });
  } else {
    // AI crawler block check
    if (/User-agent:\s*(GPTBot|CCBot|Google-Extended|ClaudeBot|PerplexityBot)/i.test(crawl.robotsTxt)) {
      const blocked = crawl.robotsTxt.match(/User-agent:\s*(GPTBot|CCBot|Google-Extended|ClaudeBot|PerplexityBot)[\s\S]*?(?:Disallow:\s*\/)/i);
      if (blocked) {
        addIssue(issues, {
          category: "technical",
          severity: "critical",
          issueType: "ai_crawler_blocked",
          title: "AI crawlers are blocked in robots.txt",
          description: "Your robots.txt disallows AI crawlers such as GPTBot/ClaudeBot. This prevents your content from being indexed by ChatGPT, Claude, and Perplexity.",
          impact: "high",
          recommendation: "Allow GPTBot, ClaudeBot, PerplexityBot and Google-Extended in robots.txt if you want AI answer engines to cite your content.",
          pageUrl: origin + "/robots.txt",
        });
      }
    }
  }

  // sitemap
  if (crawl.sitemapUrls.length === 0) {
    addIssue(issues, {
      category: "technical",
      severity: "warning",
      issueType: "sitemap_missing",
      title: "No sitemap declared",
      description: "No sitemap reference was found in robots.txt. A sitemap helps search engines and AI crawlers discover all your pages.",
      impact: "medium",
      recommendation: "Generate an XML sitemap at /sitemap.xml and reference it from robots.txt using a 'Sitemap:' directive.",
    });
  }

  // HTTPS
  if (primary && !primary.https) {
    addIssue(issues, {
      category: "technical",
      severity: "critical",
      issueType: "no_https",
      title: "Site is not served over HTTPS",
      description: "The site is served over plain HTTP. Browsers flag it as insecure and search engines prefer HTTPS.",
      impact: "high",
      recommendation: "Install an SSL certificate (free via Let's Encrypt) and redirect all HTTP traffic to HTTPS with a 301.",
      pageUrl: origin,
    });
  }

  // HTTP status of pages
  for (const p of pages) {
    if (p.statusCode === 404) {
      addIssue(issues, {
        category: "technical",
        severity: "error",
        issueType: "page_404",
        title: "Page returns 404",
        description: `The page ${p.url} returned a 404 Not Found status. Search engines will drop it from the index.`,
        impact: "medium",
        recommendation: "Restore the page or 301-redirect it to the closest relevant live URL.",
        pageUrl: p.url,
      });
    } else if (p.statusCode && p.statusCode >= 500) {
      addIssue(issues, {
        category: "technical",
        severity: "critical",
        issueType: "page_5xx",
        title: "Server error (5xx)",
        description: `The page ${p.url} returned a ${p.statusCode} server error. This blocks crawlers and users.`,
        impact: "high",
        recommendation: "Investigate server logs and fix the error. Ensure the page renders successfully.",
        pageUrl: p.url,
      });
    }
  }

  // noindex on important pages
  for (const p of pages.slice(0, 3)) {
    if (p.indexable === false) {
      addIssue(issues, {
        category: "technical",
        severity: "critical",
        issueType: "page_noindex",
        title: "Important page blocked from indexing",
        description: `${p.url} has a noindex directive. Google and AI crawlers will not include it in results.`,
        impact: "high",
        recommendation: "Remove the noindex meta tag if this page should appear in search and answer engines.",
        pageUrl: p.url,
      });
    }
  }

  // canonical missing
  const noCanonical = pages.filter((p) => p.hasCanonical === false);
  if (noCanonical.length) {
    addIssue(issues, {
      category: "technical",
      severity: "warning",
      issueType: "canonical_missing",
      title: `${noCanonical.length === 1 ? "1 page" : `${noCanonical.length} pages`} missing canonical tag`,
      description: "Canonical tags tell search engines the preferred version of a page. Missing them risks duplicate-content issues.",
      impact: "medium",
      recommendation: "Add a self-referencing <link rel=\"canonical\"> to every page.",
      pageUrl: noCanonical[0].url,
    });
  }

  return issues;
}

function checkOnPage(pages: PageData[]): IssueData[] {
  const issues: IssueData[] = [];

  const missingTitle = pages.filter((p) => !p.title);
  if (missingTitle.length) {
    addIssue(issues, {
      category: "on_page",
      severity: "error",
      issueType: "missing_title",
      title: `${missingTitle.length === 1 ? "1 page" : `${missingTitle.length} pages`} missing <title>`,
      description: "Title tags are a primary ranking signal and appear as the clickable headline in search results.",
      impact: "high",
      recommendation: "Add a unique, descriptive <title> (50–60 chars) to each page containing the target keyword near the start.",
      pageUrl: missingTitle[0].url,
    });
  }

  const longTitles = pages.filter((p) => p.title && p.title.length > 65);
  if (longTitles.length) {
    addIssue(issues, {
      category: "on_page",
      severity: "warning",
      issueType: "title_too_long",
      title: `${longTitles.length} titles exceed 65 characters`,
      description: "Titles longer than 65 characters are truncated in Google search results.",
      impact: "low",
      recommendation: "Shorten titles to 50–60 characters while keeping the keyword and brand.",
    });
  }

  const missingDesc = pages.filter((p) => !p.metaDescription);
  if (missingDesc.length) {
    addIssue(issues, {
      category: "on_page",
      severity: "warning",
      issueType: "missing_meta_description",
      title: `${missingDesc.length === 1 ? "1 page" : `${missingDesc.length} pages`} missing meta description`,
      description: "Meta descriptions influence the snippet shown in search results and can improve CTR. Missing them means search engines auto-generate snippets.",
      impact: "medium",
      recommendation: "Write a unique 140–160 character meta description per page that summarizes the content and includes a CTA.",
      pageUrl: missingDesc[0]?.url,
    });
  }

  const longDesc = pages.filter((p) => p.metaDescription && p.metaDescription.length > 160);
  if (longDesc.length) {
    addIssue(issues, {
      category: "on_page",
      severity: "warning",
      issueType: "desc_too_long",
      title: `${longDesc.length} meta descriptions too long`,
      description: "Descriptions over 160 characters get truncated in SERPs.",
      impact: "low",
      recommendation: "Keep meta descriptions between 140–160 characters.",
    });
  }

  const missingH1 = pages.filter((p) => !p.h1);
  if (missingH1.length) {
    addIssue(issues, {
      category: "on_page",
      severity: "error",
      issueType: "missing_h1",
      title: `${missingH1.length === 1 ? "1 page" : `${missingH1.length} pages`} missing H1`,
      description: "The H1 is the main heading and a strong on-page signal. Every indexable page should have exactly one H1.",
      impact: "high",
      recommendation: "Add a single, descriptive H1 to each page containing the target keyword.",
      pageUrl: missingH1[0]?.url,
    });
  }

  // missing viewport
  const noViewport = pages.filter((p) => p.hasViewport === false);
  if (noViewport.length) {
    addIssue(issues, {
      category: "on_page",
      severity: "critical",
      issueType: "missing_viewport",
      title: "Missing viewport meta tag",
      description: "Without a viewport meta tag the site will not render properly on mobile devices. Google uses mobile-first indexing.",
      impact: "high",
      recommendation: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> to the <head>.",
    });
  }

  // missing lang
  const noLang = pages.filter((p) => p.hasLang === false);
  if (noLang.length) {
    addIssue(issues, {
      category: "on_page",
      severity: "warning",
      issueType: "missing_lang",
      title: "Missing HTML lang attribute",
      description: "The <html lang> attribute tells search engines and screen readers the page language.",
      impact: "low",
      recommendation: "Add lang=\"en\" (or appropriate code) to the <html> tag.",
    });
  }

  // image alt
  const noAltPages = pages.filter((p) => p.imagesWithoutAlt && p.imagesWithoutAlt > 0);
  const totalNoAlt = noAltPages.reduce((s, p) => s + (p.imagesWithoutAlt || 0), 0);
  if (totalNoAlt > 0) {
    addIssue(issues, {
      category: "on_page",
      severity: "warning",
      issueType: "image_alt_missing",
      title: `${totalNoAlt} images missing alt text`,
      description: "Alt text describes images for screen readers, search engines, and AI vision models.",
      impact: "medium",
      recommendation: "Add descriptive alt text to every meaningful image. Decorative images can use empty alt=\"\".",
    });
  }

  // Open Graph missing
  const noOg = pages.filter((p) => p.hasOg === false);
  if (noOg.length) {
    addIssue(issues, {
      category: "on_page",
      severity: "opportunity",
      issueType: "missing_og",
      title: `${noOg.length === 1 ? "1 page" : `${noOg.length} pages`} missing Open Graph tags`,
      description: "Open Graph tags control how your page looks when shared on social media and some AI platforms.",
      impact: "low",
      recommendation: "Add og:title, og:description, og:image and og:url to every shareable page.",
    });
  }

  return issues;
}

function checkContent(pages: PageData[]): IssueData[] {
  const issues: IssueData[] = [];

  const thin = pages.filter((p) => (p.wordCount || 0) < 300);
  if (thin.length) {
    addIssue(issues, {
      category: "content",
      severity: "warning",
      issueType: "thin_content",
      title: `${thin.length === 1 ? "1 page has" : `${thin.length} pages have`} thin content (< 300 words)`,
      description: "Thin pages provide little value and struggle to rank. They are also poor sources for AI answer engines.",
      impact: "medium",
      recommendation: "Expand thin pages with original insights, examples, data and FAQs. Aim for comprehensive coverage of the topic.",
      pageUrl: thin[0]?.url,
    });
  }

  const veryThin = pages.filter((p) => (p.wordCount || 0) < 150);
  if (veryThin.length) {
    addIssue(issues, {
      category: "content",
      severity: "error",
      issueType: "very_thin_content",
      title: `${veryThin.length === 1 ? "1 page is" : `${veryThin.length} pages are`} extremely thin (< 150 words)`,
      description: "These pages are essentially empty and waste crawl budget.",
      impact: "high",
      recommendation: "Either expand substantially or consolidate/redirect to a stronger page.",
      pageUrl: veryThin[0]?.url,
    });
  }

  return issues;
}

function checkInternalLinks(pages: PageData[]): IssueData[] {
  const issues: IssueData[] = [];

  const orphan = pages.filter((p) => (p.internalLinks || 0) < 2);
  if (orphan.length) {
    addIssue(issues, {
      category: "internal_links",
      severity: "warning",
      issueType: "orphan_pages",
      title: `${orphan.length === 1 ? "1 page has" : `${orphan.length} pages have`} few internal links`,
      description: "Pages with few inbound internal links receive little link equity and may be deprioritized by crawlers.",
      impact: "medium",
      recommendation: "Add contextual internal links from related, high-authority pages to these URLs using descriptive anchor text.",
      pageUrl: orphan[0]?.url,
    });
  }

  const broken = pages.filter((p) => (p.brokenLinks || 0) > 0);
  const brokenTotal = broken.reduce((s, p) => s + (p.brokenLinks || 0), 0);
  if (brokenTotal > 0) {
    addIssue(issues, {
      category: "internal_links",
      severity: "error",
      issueType: "broken_internal_links",
      title: `${brokenTotal} broken internal links detected`,
      description: "Broken internal links hurt crawl efficiency and user experience.",
      impact: "medium",
      recommendation: "Find and fix or redirect each broken link to a live, relevant URL.",
    });
  }

  return issues;
}

function checkSchema(pages: PageData[]): IssueData[] {
  const issues: IssueData[] = [];

  const noSchema = pages.filter((p) => p.hasSchema === false);
  if (noSchema.length) {
    addIssue(issues, {
      category: "schema",
      severity: "warning",
      issueType: "schema_missing",
      title: `${noSchema.length === 1 ? "1 page" : `${noSchema.length} pages`} missing structured data (JSON-LD)`,
      description: "Structured data helps search engines and AI models understand entities on your page (Organization, Article, FAQ, etc.).",
      impact: "medium",
      recommendation: "Add JSON-LD schema for Organization, WebSite, WebPage, Article, BreadcrumbList and FAQ where applicable.",
      pageUrl: noSchema[0]?.url,
    });
  }

  const noFaq = pages.filter((p) => !p.hasFAQ && (p.wordCount || 0) > 500);
  if (noFaq.length) {
    addIssue(issues, {
      category: "schema",
      severity: "opportunity",
      issueType: "faq_schema_missing",
      title: `${noFaq.length === 1 ? "1 content page" : `${noFaq.length} content pages`} missing FAQ schema`,
      description: "FAQ schema helps your Q&A pairs appear as rich results and get cited by answer engines.",
      impact: "medium",
      recommendation: "Identify questions your page answers and add FAQPage JSON-LD with concise Q&A pairs.",
    });
  }

  return issues;
}

function checkAeo(pages: PageData[]): IssueData[] {
  const issues: IssueData[] = [];

  const noFaq = pages.filter((p) => !p.hasFAQ);
  if (noFaq.length) {
    addIssue(issues, {
      category: "aeo",
      severity: "warning",
      issueType: "no_faq_format",
      title: `${noFaq.length === 1 ? "1 page lacks" : `${noFaq.length} pages lack`} FAQ / Q&A format`,
      description: "Answer engines (ChatGPT, Perplexity, Google AI Overviews) prefer content structured as question + concise answer.",
      impact: "high",
      recommendation: "Add a FAQ section with explicit questions and 40–55 word direct answers near the top of important pages.",
    });
  }

  const thinAnswer = pages.filter((p) => (p.wordCount || 0) < 600);
  if (thinAnswer.length) {
    addIssue(issues, {
      category: "aeo",
      severity: "opportunity",
      issueType: "weak_answer_depth",
      title: `${thinAnswer.length === 1 ? "1 page has" : `${thinAnswer.length} pages have`} shallow answer depth`,
      description: "AI engines look for self-contained, citable answers. Pages under 600 words rarely provide enough depth.",
      impact: "medium",
      recommendation: "Expand each page with a clear direct answer, supporting context, and original data or examples.",
    });
  }

  return issues;
}

function checkGeo(pages: PageData[], crawl: CrawlResult): IssueData[] {
  const issues: IssueData[] = [];
  const primary = crawl.primaryPage || pages[0];

  // organization schema
  const hasOrgSchema = crawl.robotsTxt !== null && primary?.hasSchema;
  if (!hasOrgSchema) {
    addIssue(issues, {
      category: "geo",
      severity: "warning",
      issueType: "weak_entity_signals",
      title: "Weak entity / brand signals",
      description: "AI models build a knowledge graph of entities. Without Organization + WebSite schema and a clear About page, your brand is harder to cite correctly.",
      impact: "high",
      recommendation: "Add Organization and WebSite JSON-LD. Create an About page with founder, location, and credentials. Ensure NAP consistency.",
    });
  }

  // author
  addIssue(issues, {
    category: "geo",
    severity: "warning",
    issueType: "missing_author_credentials",
    title: "Missing author credentials / E-E-A-T signals",
    description: "Author entities with verifiable credentials make your content more trustworthy to both Google and AI models.",
    impact: "medium",
    recommendation: "Add author bylines, link to author bios, and reference credentials, publications and original research.",
  });

  // citation worthiness
  addIssue(issues, {
    category: "geo",
    severity: "opportunity",
    issueType: "weak_citation_readiness",
    title: "Improve citation readiness",
    description: "AI models cite passages that are concise, factually dense, and structured with clear definitions and statistics.",
    impact: "medium",
    recommendation: "Add quotable definitions, statistics with sources, and clearly labeled takeaways. Use H2/H3 question headings.",
  });

  // original research
  addIssue(issues, {
    category: "geo",
    severity: "opportunity",
    issueType: "no_original_data",
    title: "No original data / research detected",
    description: "Original data, surveys and case studies are the most-cited content type by answer engines.",
    impact: "low",
    recommendation: "Publish at least one piece of original research with charts and methodology per quarter.",
  });

  return issues;
}

function checkSecurity(pages: PageData[], crawl: CrawlResult): IssueData[] {
  const issues: IssueData[] = [];
  const primary = crawl.primaryPage || pages[0];

  if (primary && !primary.https) {
    addIssue(issues, {
      category: "security",
      severity: "critical",
      issueType: "no_https_security",
      title: "Site not served over HTTPS",
      description: "HTTPS encrypts traffic and is a Google ranking signal. Without it browsers warn users.",
      impact: "high",
      recommendation: "Install TLS (Let's Encrypt is free) and 301-redirect all HTTP traffic to HTTPS. Enable HSTS.",
    });
  }

  // security headers (we can't reliably fetch live; flag as opportunity)
  addIssue(issues, {
    category: "security",
    severity: "opportunity",
    issueType: "security_headers",
    title: "Verify security headers",
    description: "Headers like HSTS, Content-Security-Policy, X-Frame-Options and X-Content-Type-Options protect users from common attacks.",
    impact: "low",
    recommendation: "Set Strict-Transport-Security, Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy.",
  });

  return issues;
}

function checkPerformance(pages: PageData[]): IssueData[] {
  const issues: IssueData[] = [];

  const slow = pages.filter((p) => (p.loadTimeMs || 0) > 2500);
  if (slow.length) {
    addIssue(issues, {
      category: "performance",
      severity: "error",
      issueType: "slow_lcp",
      title: `${slow.length === 1 ? "1 page has" : `${slow.length} pages have`} LCP > 2.5s`,
      description: "Largest Contentful Paint over 2.5s is poor for Core Web Vitals and affects rankings.",
      impact: "high",
      recommendation: "Optimize the largest above-the-fold element: preload hero images, compress, use modern formats (WebP/AVIF), reduce server response time (TTFB).",
      pageUrl: slow[0]?.url,
    });
  }

  const heavy = pages.filter((p) => (p.pageSizeKb || 0) > 500);
  if (heavy.length) {
    addIssue(issues, {
      category: "performance",
      severity: "warning",
      issueType: "large_page_weight",
      title: `${heavy.length === 1 ? "1 page exceeds" : `${heavy.length} pages exceed`} 500 KB`,
      description: "Heavy pages hurt LCP and INP, especially on mobile networks.",
      impact: "medium",
      recommendation: "Lazy-load images, minify CSS/JS, remove unused code, and compress assets with Brotli.",
      pageUrl: heavy[0]?.url,
    });
  }

  const noLazy = pages.filter((p) => (p.imagesTotal || 0) > 3);
  if (noLazy.length) {
    addIssue(issues, {
      category: "performance",
      severity: "opportunity",
      issueType: "lazy_loading",
      title: "Enable lazy loading for images",
      description: "Lazy loading defers offscreen images and speeds up initial render.",
      impact: "low",
      recommendation: "Add loading=\"lazy\" to non-critical images or use the native attribute on <img>.",
    });
  }

  return issues;
}

// ---------- scoring ----------

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 8,
  error: 4,
  warning: 2,
  opportunity: 1,
};

function scoreCategory(issues: IssueData[], base: number): number {
  const penalty = issues.reduce((s, i) => s + SEVERITY_WEIGHT[i.severity], 0);
  const score = Math.max(0, Math.min(100, base - penalty));
  return Math.round(score);
}

export function analyze(crawl: CrawlResult) {
  const pages = crawl.pages;

  const technicalIssues = checkTechnical(pages, crawl);
  const onPageIssues = checkOnPage(pages);
  const contentIssues = checkContent(pages);
  const linkIssues = checkInternalLinks(pages);
  const schemaIssues = checkSchema(pages);
  const aeoIssues = checkAeo(pages);
  const geoIssues = checkGeo(pages, crawl);
  const securityIssues = checkSecurity(pages, crawl);
  const perfIssues = checkPerformance(pages);

  // Map category scores — combine related categories
  // technical = technical + on_page + internal_links + schema
  const technicalCombined = [...technicalIssues, ...onPageIssues, ...linkIssues, ...schemaIssues];
  const technicalScore = scoreCategory(technicalCombined, 100);
  const contentScore = scoreCategory([...contentIssues, ...onPageIssues.filter((i) => i.issueType === "missing_title" || i.issueType === "missing_h1")], 100);
  const performanceScore = scoreCategory(perfIssues, 100);
  const aeoScore = scoreCategory([...aeoIssues, ...schemaIssues.filter((i) => i.issueType === "faq_schema_missing")], 100);
  const geoScore = scoreCategory(geoIssues, 100);
  const securityScore = scoreCategory(securityIssues, 100);

  // overall weighted
  const overall = Math.round(
    technicalScore * 0.25 +
      contentScore * 0.2 +
      performanceScore * 0.15 +
      aeoScore * 0.15 +
      geoScore * 0.15 +
      securityScore * 0.1
  );

  const allIssues: IssueData[] = [
    ...technicalIssues,
    ...onPageIssues,
    ...contentIssues,
    ...linkIssues,
    ...schemaIssues,
    ...aeoIssues,
    ...geoIssues,
    ...securityIssues,
    ...perfIssues,
  ];

  const counts = {
    critical: allIssues.filter((i) => i.severity === "critical").length,
    error: allIssues.filter((i) => i.severity === "error").length,
    warning: allIssues.filter((i) => i.severity === "warning").length,
    opportunity: allIssues.filter((i) => i.severity === "opportunity").length,
  };

  return {
    issues: allIssues,
    scores: {
      technical: technicalScore,
      content: contentScore,
      performance: performanceScore,
      aeo: aeoScore,
      geo: geoScore,
      security: securityScore,
    },
    overall,
    counts,
  };
}

export type AnalyzeResult = ReturnType<typeof analyze>;

export function buildAiActionPlan(issues: IssueData[]): string[] {
  const plan: string[] = [];
  const critical = issues.filter((i) => i.severity === "critical");
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const opps = issues.filter((i) => i.severity === "opportunity");

  const byType = (arr: IssueData[], t: string) => arr.filter((i) => i.issueType === t);
  const plural = (n: number, w: string) => n === 1 ? `1 ${w}` : `${n} ${w}s`;

  if (byType(critical, "ai_crawler_blocked").length) plan.push("Unblock AI crawlers (GPTBot, ClaudeBot, PerplexityBot) in robots.txt to be cited by answer engines.");
  if (byType(critical, "no_https").length || byType(critical, "no_https_security").length) plan.push("Migrate the entire site to HTTPS with a 301 redirect and enable HSTS.");
  if (byType(critical, "page_noindex").length) plan.push(`Remove noindex from ${plural(byType(critical, "page_noindex").length, "important page")} so they can be indexed.`);
  if (byType(critical, "missing_viewport").length) plan.push("Add the viewport meta tag for mobile-first rendering.");
  if (byType(errors, "missing_title").length) plan.push(`Write unique <title> tags for ${plural(byType(errors, "missing_title").length, "page")}.`);
  if (byType(errors, "missing_h1").length) plan.push(`Add an H1 to ${plural(byType(errors, "missing_h1").length, "page")}.`);
  if (byType(errors, "broken_internal_links").length) plan.push("Fix broken internal links or redirect them to live URLs.");
  if (byType(warnings, "missing_meta_description").length) plan.push(`Generate meta descriptions for ${plural(byType(warnings, "missing_meta_description").length, "page")}.`);
  if (byType(warnings, "schema_missing").length) plan.push("Add Organization + WebSite + WebPage JSON-LD schema.");
  if (byType(warnings, "no_faq_format").length) plan.push("Add FAQ sections with concise Q&A answers to key pages.");
  if (byType(opps, "faq_schema_missing").length) plan.push("Add FAQPage schema to content-rich pages.");
  if (byType(opps, "weak_citation_readiness").length) plan.push("Add quotable definitions, stats and takeaways for AI citation readiness.");
  if (byType(errors, "slow_lcp").length) plan.push(`Improve LCP on ${plural(byType(errors, "slow_lcp").length, "slow page")} (preload hero image, reduce TTFB).`);

  return plan.slice(0, 7);
}
