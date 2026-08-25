# UfuqAudit — Complete Project Archive

## Overview
AI-Powered Website Audit SaaS for SEO + AEO + GEO + Performance + Security.
Built on Next.js 16 App Router with TypeScript, Tailwind CSS 4, shadcn/ui, Prisma, and z-ai-web-dev-sdk.

## Archive Contents
- **src/** — All source code (197 TS/TSX files)
  - **src/app/** — Next.js app router pages + 54 API routes
  - **src/components/** — 129 React components
  - **src/lib/** — Core libraries (auth, crawler, analyzers, AI, store, types)
  - **src/hooks/** — Custom React hooks
- **prisma/** — Database schema (16 models)
- **chrome-extension/** — UfuqLink Chrome Extension (MV3) + Firefox (MV2)
- **public/** — Static assets
- Config files: package.json, tsconfig.json, next.config.ts, tailwind.config.ts, etc.

## Quick Start
1. Extract the zip
2. `bun install` (or npm install)
3. Copy `.env` and set `DATABASE_URL`
4. `bun run db:push` (create SQLite database)
5. `bun run dev` (start on :3000)

## Key Features (33 views)
### User Dashboard
- Dashboard (personal audit overview with score ring + AI action plan)
- Issues (filterable list with AI fix generation)
- Pages (crawled pages table)
- Visual Preview (page screenshots with SEO issue overlays)
- Audit History (trend charts + reload past audits)
- Competitors (side-by-side comparison + radar chart)
- AEO (Answer Engine Optimization scoring)
- GEO (AI visibility readiness)
- Performance (Core Web Vitals)
- Security (HTTPS + headers checker)
- AI Recommendations (generate fixes for each issue)
- AI Chat (conversational assistant)
- UfuqLink (single-page link scanner)
- SEO Tools (6 generators: meta, robots, schema, sitemap, canonical, OG)
- Keywords (rank tracker with sparklines)
- Backlinks (monitor with DA distribution)
- Content Analyzer (readability + keyword density)
- Link Graph (interactive SVG node-edge visualization)
- Page Editor (edit meta tags with live SERP preview)
- Crawl Settings (depth/engines/user-agent config)
- Scheduled Audits (recurring audit scheduler)
- Client Portal (shareable branded audit links)
- Search Console (GSC-style data dashboard)
- Email Reports (compose + send branded reports)
- Activity Feed (team timeline)
- API Docs (10 endpoints + key management + try-it)
- Support (ticket system with conversations)
- Extension (Chrome Extension download page)
- Reports (PDF export + white-label)
- Settings, Billing, Integrations

### Super Admin Portal (26 tabs)
**Phase 1 (Core):** Dashboard, Users, Organizations, Plans, Subscriptions, Billing, API Keys, Audits, System
**Phase 2 (Product):** Audit Rules, Scoring, AI Models, AI Costs, Crawler
**Phase 3 (Growth):** Blog, Campaigns, Leads, Coupons, Affiliates, Announcements
**Phase 4 (Enterprise):** Feature Flags, Webhooks, Analytics, White Label, Competitors, Security

### Public Pages
- Landing (hero + free audit + features + pricing)
- Pricing (4 plans with comparison)
- Documentation (9 sections, 20+ pages with search)
- Features (18 feature cards)
- About (mission + differentiation)
- Blog (public post cards)
- Login/Register (auth with RBAC)

### Chrome Extension (UfuqLink)
- Manifest V3 (Chrome) + Manifest V2 (Firefox)
- Content scanner (extracts all links, SEO metadata, images)
- Popup UI (scan → loading → results with animated score)
- Service worker (HTTP status checking via fetch)
- CSV export, notifications, UfuqAudit escalation CTA

## Tech Stack
- **Framework**: Next.js 16 App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma ORM + SQLite
- **AI**: z-ai-web-dev-sdk (LLM + VLM)
- **State**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React
- **Auth**: Custom (scrypt password hashing, session tokens, RBAC with 6 roles)

## Demo Credentials
- admin@ufuqaudit.app / admin123 (Super Admin, Agency plan)
- demo@ufuqaudit.app / demo123 (Admin, Pro plan)

## File Stats
- 197 TypeScript/TSX files
- 54 API routes
- 129 React components
- 26 admin section components
- 16 Prisma models
- 8 Chrome Extension files
- 33 view cases in page.tsx
