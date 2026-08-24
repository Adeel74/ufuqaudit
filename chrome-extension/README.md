# UfuqLink — Chrome Extension

**Instant Link & SEO Checker for Every Web Page**

## Installation

1. Download or clone this folder
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select this folder
5. The UfuqLink icon will appear in your toolbar

## Features

- 🔍 **Instant Link Scan** — Extract all links from any page in 1 click
- ✅ **HTTP Status Check** — 200/301/302/404/403/500 detection
- 🔄 **Redirect Analysis** — Track redirect chains and hops
- 🔗 **Internal vs External** — Automatic classification
- 🏷️ **Rel Attributes** — follow/nofollow/sponsored/UGC/noopener/noreferrer
- 📝 **Anchor Analysis** — Detect generic/empty anchor text
- 🔒 **HTTPS Check** — Flag insecure HTTP links
- 📊 **SEO Score** — Per-page score based on link health
- 📄 **CSV Export** — Export link data
- 🔔 **Notifications** — Alert on scan completion
- 🚀 **UfuqAudit Integration** — Escalate to full website audit

## Architecture

```
chrome-extension/
├── manifest.json          # Manifest V3 config
├── content/
│   └── scanner.js         # Extracts links + SEO metadata from page
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic + score animation + CSV export
├── background/
│   └── service-worker.js  # HTTP status checking via fetch()
└── icons/                 # Extension icons (add PNG files)
```

## How It Works

1. **Content Script** (`scanner.js`) runs on every page, extracts all `<a>` tags
2. **Popup** (`popup.html/js`) shows scan results with animated SEO score
3. **Service Worker** (`service-worker.js`) checks HTTP status via fetch()
4. Results include: link count, broken links, redirects, anchor issues, rel attributes

## UfuqAudit Integration

The extension is a lead-gen channel for UfuqAudit:
- Single page scan (extension) → Full website audit (UfuqAudit)
- "Run Full Website Audit" button opens ufuqaudit.app
