// GET /api/admin/crawler — crawler management dashboard
import { NextResponse } from "next/server";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export async function GET() {
  const now = Date.now();

  // Currently running crawlers
  const running = [
    { id: "crawl_1", url: "https://stripe.com", userId: "sarah@northwind.agency", pagesCrawled: 847, totalPages: 1247, progress: 68, startedAt: new Date(now - 120000).toISOString(), cpu: 34, memory: 128 },
    { id: "crawl_2", url: "https://shopify.com", userId: "amir@pixelcraft.co", pagesCrawled: 1234, totalPages: 2104, progress: 59, startedAt: new Date(now - 300000).toISOString(), cpu: 45, memory: 256 },
    { id: "crawl_3", url: "https://notion.so", userId: "mike@brightlabs.io", pagesCrawled: 312, totalPages: 643, progress: 49, startedAt: new Date(now - 60000).toISOString(), cpu: 18, memory: 64 },
  ];

  // Queued crawlers
  const queued = [
    { id: "crawl_4", url: "https://vercel.com", userId: "demo@ufuqaudit.app", position: 1, enqueuedAt: new Date(now - 30000).toISOString() },
    { id: "crawl_5", url: "https://github.com", userId: "lena@growthflow.com", position: 2, enqueuedAt: new Date(now - 20000).toISOString() },
  ];

  // Recently completed
  const completed = [
    { id: "crawl_6", url: "https://example.com", userId: "demo@ufuqaudit.app", pagesCrawled: 12, score: 94, duration: 4.2, completedAt: new Date(now - 300000).toISOString() },
    { id: "crawl_7", url: "https://framer.com", userId: "sarah@northwind.agency", pagesCrawled: 456, score: 68, duration: 12.8, completedAt: new Date(now - 600000).toISOString() },
    { id: "crawl_8", url: "https://linear.app", userId: "amir@pixelcraft.co", pagesCrawled: 318, score: 84, duration: 8.4, completedAt: new Date(now - 900000).toISOString() },
  ];

  // Failed crawlers
  const failed = [
    { id: "crawl_9", url: "https://broken-site.example", userId: "test@test.com", error: "Connection timeout", failedAt: new Date(now - 1200000).toISOString() },
    { id: "crawl_10", url: "https://offline-site.example", userId: "test2@test.com", error: "DNS resolution failed", failedAt: new Date(now - 1800000).toISOString() },
  ];

  // Server metrics
  const metrics = {
    cpu: 42,
    memory: 448, // MB
    memoryLimit: 2048,
    disk: 12.4, // GB
    diskLimit: 50,
    network: 8.2, // Mbps
    queueSize: 2,
    workers: 4,
    maxWorkers: 10,
    dbConnections: 8,
    maxDbConnections: 20,
  };

  return NextResponse.json({
    stats: {
      running: running.length,
      queued: queued.length,
      completed: completed.length,
      failed: failed.length,
      totalCpu: metrics.cpu,
      totalMemory: metrics.memory,
    },
    running,
    queued,
    completed,
    failed,
    metrics,
  });
}
