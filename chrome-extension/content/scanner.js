// UfuqLink Content Script — extracts all links from the current page
// Runs on every page the user visits (document_idle)

(function () {
  "use strict";

  const GENERIC_ANCHORS = [
    "click here", "read more", "learn more", "here", "more",
    "link", "website", "this", "go", "see more", "view more",
    "continue", "next", "prev", "previous", "back",
  ];

  function getRelAttributes(element) {
    const rel = element.getAttribute("rel");
    if (!rel) return [];
    return rel.toLowerCase().split(/\s+/).filter(Boolean);
  }

  function classifyAnchor(text) {
    const trimmed = text.trim().toLowerCase();
    if (!trimmed) return "empty";
    if (GENERIC_ANCHORS.includes(trimmed)) return "generic";
    return "good";
  }

  function getCurrentDomain() {
    return window.location.hostname.replace(/^www\./, "");
  }

  function isInternal(href, currentDomain) {
    try {
      if (href.startsWith("/") || href.startsWith("#") || href.startsWith("?")) return true;
      const url = new URL(href, window.location.origin);
      return url.hostname.replace(/^www\./, "") === currentDomain;
    } catch {
      return false;
    }
  }

  function extractLinks() {
    const anchors = document.querySelectorAll("a[href]");
    const currentDomain = getCurrentDomain();
    const links = [];

    anchors.forEach((anchor, index) => {
      const href = anchor.getAttribute("href") || "";
      const text = anchor.textContent || "";
      const rels = getRelAttributes(anchor);

      let type = "internal";
      if (href.startsWith("mailto:")) type = "mailto";
      else if (href.startsWith("tel:")) type = "tel";
      else if (href.startsWith("javascript:")) type = "javascript";
      else if (href.startsWith("#")) type = "fragment";
      else if (!isInternal(href, currentDomain)) type = "external";

      const isNofollow = rels.includes("nofollow");
      const isSponsored = rels.includes("sponsored");
      const isUGC = rels.includes("ugc");
      const isDoFollow = !isNofollow && !isSponsored && !isUGC;
      const isHttps = href.startsWith("https://") || (type === "internal" && window.location.protocol === "https:");
      const anchorQuality = classifyAnchor(text);

      let issue = null;
      if (anchorQuality === "empty") issue = "Empty anchor text";
      else if (anchorQuality === "generic") issue = "Generic anchor text";
      if (!isHttps && (type === "internal" || type === "external") && href.startsWith("http://"))
        issue = (issue ? issue + "; " : "") + "Insecure HTTP link";

      // Check for broken fragment
      if (type === "fragment" && href.length > 1) {
        const id = href.slice(1);
        if (!document.getElementById(id)) {
          issue = "Broken page anchor (#" + id + " not found)";
        }
      }

      links.push({
        id: index,
        url: href,
        absoluteUrl: (() => {
          try { return new URL(href, window.location.origin).href; } catch { return href; }
        })(),
        anchor: text.trim() || "(empty)",
        type,
        rel: rels,
        isNofollow,
        isSponsored,
        isUGC,
        isDoFollow,
        isHttps,
        anchorQuality,
        issue,
      });
    });

    // Deduplicate by absoluteUrl
    const seen = new Set();
    const deduped = [];
    const duplicates = [];
    links.forEach((l) => {
      const key = l.absoluteUrl;
      if (seen.has(key)) {
        duplicates.push(key);
      } else {
        seen.add(key);
        deduped.push(l);
      }
    });

    // Page SEO metadata
    const title = document.title || "";
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "";
    const robots = document.querySelector('meta[name="robots"]')?.getAttribute("content") || "";
    const h1s = document.querySelectorAll("h1");
    const h2Count = document.querySelectorAll("h2").length;
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "";
    const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute("content") || "";
    const twitterCard = document.querySelector('meta[name="twitter:card"]')?.getAttribute("content") || "";
    const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute("content") || "";
    const hasLang = document.documentElement.hasAttribute("lang");

    // Images
    const images = document.querySelectorAll("img");
    let imagesTotal = images.length;
    let imagesNoAlt = 0;
    let imagesEmptyAlt = 0;
    let imagesHttp = 0;
    images.forEach((img) => {
      const alt = img.getAttribute("alt");
      const src = img.getAttribute("src") || "";
      if (alt === null) imagesNoAlt++;
      else if (alt === "") imagesEmptyAlt++;
      if (src.startsWith("http://")) imagesHttp++;
    });

    return {
      url: window.location.href,
      domain: currentDomain,
      title,
      metaDescription: metaDesc,
      canonical,
      robots,
      h1Count: h1s.length,
      h1Texts: Array.from(h1s).map((h) => h.textContent.trim()).filter(Boolean),
      h2Count,
      ogTitle,
      ogDesc,
      twitterCard,
      hasViewport: !!viewport,
      hasLang,
      links: deduped,
      duplicateUrls: duplicates,
      stats: {
        totalLinks: deduped.length,
        internal: deduped.filter((l) => l.type === "internal").length,
        external: deduped.filter((l) => l.type === "external").length,
        mailto: deduped.filter((l) => l.type === "mailto").length,
        tel: deduped.filter((l) => l.type === "tel").length,
        fragments: deduped.filter((l) => l.type === "fragment").length,
        nofollow: deduped.filter((l) => l.isNofollow).length,
        dofollow: deduped.filter((l) => l.isDoFollow).length,
        genericAnchors: deduped.filter((l) => l.anchorQuality === "generic").length,
        emptyAnchors: deduped.filter((l) => l.anchorQuality === "empty").length,
        insecure: deduped.filter((l) => !l.isHttps && (l.type === "internal" || l.type === "external")).length,
        duplicates: duplicates.length,
        issues: deduped.filter((l) => l.issue).length,
        imagesTotal,
        imagesNoAlt,
        imagesEmptyAlt,
        imagesHttp,
      },
    };
  }

  // Listen for scan requests from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scanPage") {
      const result = extractLinks();
      sendResponse(result);
    }
    return true;
  });
})();
