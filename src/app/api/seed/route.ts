import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/seed — populate demo data so admin panel & history look realistic
export async function POST() {
  try {
    let demoUser = await db.user.findFirst({ where: { email: "demo@ufuqaudit.app" } });
    if (!demoUser) {
      demoUser = await db.user.create({
        data: { email: "demo@ufuqaudit.app", name: "Demo User", role: "admin", plan: "pro" },
      });
    }

    const seedUsers = [
      { email: "sarah@northwind.agency", name: "Sarah Chen", role: "user" as const, plan: "pro" },
      { email: "mike@brightlabs.io", name: "Mike Rodriguez", role: "user" as const, plan: "starter" },
      { email: "amir@pixelcraft.co", name: "Amir Hassan", role: "user" as const, plan: "agency" },
      { email: "lena@growthflow.com", name: "Lena Petrova", role: "user" as const, plan: "free" },
      { email: "admin@ufuqaudit.app", name: "System Admin", role: "admin" as const, plan: "agency" },
    ];
    for (const u of seedUsers) {
      const exists = await db.user.findFirst({ where: { email: u.email } });
      if (!exists) await db.user.create({ data: u });
    }

    const seedAudits = [
      { url: "https://stripe.com", score: 92, technical: 95, content: 88, performance: 90, aeo: 94, geo: 89, security: 96, pages: 1247, daysAgo: 1 },
      { url: "https://vercel.com", score: 88, technical: 91, content: 85, performance: 92, aeo: 82, geo: 78, security: 95, pages: 892, daysAgo: 2 },
      { url: "https://shopify.com", score: 76, technical: 82, content: 74, performance: 71, aeo: 68, geo: 61, security: 90, pages: 2104, daysAgo: 3 },
      { url: "https://notion.so", score: 71, technical: 78, content: 69, performance: 65, aeo: 64, geo: 58, security: 88, pages: 643, daysAgo: 5 },
      { url: "https://linear.app", score: 84, technical: 88, content: 80, performance: 86, aeo: 79, geo: 72, security: 92, pages: 318, daysAgo: 7 },
      { url: "https://framer.com", score: 68, technical: 71, content: 65, performance: 62, aeo: 61, geo: 54, security: 85, pages: 456, daysAgo: 10 },
      { url: "https://webflow.com", score: 79, technical: 83, content: 76, performance: 78, aeo: 73, geo: 66, security: 91, pages: 1102, daysAgo: 14 },
      { url: "https://github.com", score: 94, technical: 96, content: 92, performance: 91, aeo: 95, geo: 91, security: 97, pages: 3847, daysAgo: 18 },
    ];

    const now = Date.now();
    for (const s of seedAudits) {
      const exists = await db.audit.findFirst({ where: { url: s.url } });
      if (exists) continue;

      const auditUser = seedUsers[Math.floor(Math.random() * seedUsers.length)];
      const user = await db.user.findFirst({ where: { email: auditUser.email } });
      if (!user) continue;

      let project = await db.project.findFirst({ where: { userId: user.id, url: s.url } });
      if (!project) {
        project = await db.project.create({ data: { name: s.url, url: s.url, userId: user.id } });
      }

      await db.audit.create({
        data: {
          projectId: project.id,
          userId: user.id,
          url: s.url,
          status: "done",
          overallScore: s.score,
          technicalScore: s.technical,
          contentScore: s.content,
          performanceScore: s.performance,
          aeoScore: s.aeo,
          geoScore: s.geo,
          securityScore: s.security,
          pagesCrawled: s.pages,
          issuesCount: Math.floor((100 - s.score) * 1.5),
          criticalCount: Math.floor((100 - s.score) / 20),
          errorCount: Math.floor((100 - s.score) / 8),
          warningCount: Math.floor((100 - s.score) / 3),
          opportunityCount: Math.floor((100 - s.score) / 5),
          summary: `Overall health ${s.score}/100 with ${s.pages} pages crawled.`,
          createdAt: new Date(now - s.daysAgo * 86400000),
        },
      });
    }

    const logActions = [
      { action: "user.login", entity: "user", details: "Demo user signed in" },
      { action: "audit.scheduled", entity: "audit", details: "Scheduled weekly audit for stripe.com" },
      { action: "report.generated", entity: "report", details: "Generated Executive Summary PDF for vercel.com" },
      { action: "integration.connected", entity: "integration", details: "Connected Google Search Console" },
      { action: "plan.upgraded", entity: "subscription", details: "User upgraded from Starter to Pro" },
      { action: "user.invited", entity: "user", details: "Invited team member sarah@northwind.agency" },
    ];
    for (let i = 0; i < logActions.length; i++) {
      const log = logActions[i];
      const existing = await db.auditLog.findFirst({ where: { action: log.action } });
      if (!existing) {
        await db.auditLog.create({
          data: {
            userId: demoUser.id,
            action: log.action,
            entity: log.entity,
            details: log.details,
            createdAt: new Date(now - (i + 1) * 3600000),
          },
        });
      }
    }

    // Seed demo-user audits with varying scores over time (for the history trend chart)
    // First, clean up duplicate example.com audits — keep only 1, delete the rest
    const existingDemoAudits = await db.audit.findMany({
      where: { userId: demoUser.id, url: "https://example.com" },
      orderBy: { createdAt: "asc" },
    });
    if (existingDemoAudits.length > 1) {
      // Keep the oldest, delete the rest
      const toDelete = existingDemoAudits.slice(1);
      for (const a of toDelete) {
        await db.issue.deleteMany({ where: { auditId: a.id } });
        await db.auditPage.deleteMany({ where: { auditId: a.id } });
        await db.audit.delete({ where: { id: a.id } });
      }
    }

    const demoAudits = [
      { url: "https://example.com", score: 62, technical: 68, content: 58, performance: 71, aeo: 55, geo: 48, security: 75, pages: 12, daysAgo: 28, hour: 9 },
      { url: "https://example.com", score: 68, technical: 73, content: 64, performance: 76, aeo: 61, geo: 53, security: 80, pages: 12, daysAgo: 21, hour: 14 },
      { url: "https://example.com", score: 71, technical: 78, content: 69, performance: 78, aeo: 64, geo: 58, security: 82, pages: 12, daysAgo: 14, hour: 11 },
      { url: "https://example.com", score: 78, technical: 82, content: 74, performance: 81, aeo: 68, geo: 59, security: 92, pages: 12, daysAgo: 7, hour: 16 },
    ];
    let demoProject = await db.project.findFirst({ where: { userId: demoUser.id, url: "https://example.com" } });
    if (!demoProject) {
      demoProject = await db.project.create({ data: { name: "example.com", url: "https://example.com", userId: demoUser.id } });
    }
    for (const s of demoAudits) {
      const auditDate = new Date(now - s.daysAgo * 86400000);
      auditDate.setHours(s.hour, 30, 0, 0);
      await db.audit.create({
        data: {
          projectId: demoProject.id,
          userId: demoUser.id,
          url: s.url,
          status: "done",
          overallScore: s.score,
          technicalScore: s.technical,
          contentScore: s.content,
          performanceScore: s.performance,
          aeoScore: s.aeo,
          geoScore: s.geo,
          securityScore: s.security,
          pagesCrawled: s.pages,
          issuesCount: Math.floor((100 - s.score) * 1.5),
          criticalCount: Math.floor((100 - s.score) / 20),
          errorCount: Math.floor((100 - s.score) / 8),
          warningCount: Math.floor((100 - s.score) / 3),
          opportunityCount: Math.floor((100 - s.score) / 5),
          summary: `Overall health ${s.score}/100 with ${s.pages} pages crawled.`,
          createdAt: auditDate,
        },
      });
    }

    const counts = {
      users: await db.user.count(),
      audits: await db.audit.count(),
      projects: await db.project.count(),
      issues: await db.issue.count(),
    };
    return NextResponse.json({ ok: true, seeded: true, counts });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Seed failed" }, { status: 500 });
  }
}
