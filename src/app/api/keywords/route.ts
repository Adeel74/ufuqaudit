// GET /api/keywords — returns mock keyword rank tracking data
// POST /api/keywords — add a keyword to track
import { NextRequest, NextResponse } from "next/server";

interface KeywordRow {
  keyword: string;
  position: number;
  prevPosition: number;
  volume: number;
  difficulty: number;
  url: string;
  serpFeatures: string[];
  trend: number[];
}

// Deterministic seed from string
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function genTrend(seed: number, current: number): number[] {
  const r = (i: number) => ((seed >> (i * 3)) & 0x3ff) / 1024;
  const trend: number[] = [];
  let pos = current + 15;
  for (let i = 0; i < 12; i++) {
    pos = Math.max(1, pos - Math.round(r(i) * 4) + Math.round(r(i + 4) * 2));
    trend.push(pos);
  }
  trend.push(current);
  return trend;
}

const DEFAULT_KEYWORDS = [
  "seo audit tool",
  "aeo optimization",
  "geo ai visibility",
  "core web vitals checker",
  "schema markup generator",
  "robots.txt generator",
  "website health score",
  "ai search readiness",
];

function genKeywordData(kw: string): KeywordRow {
  const seed = hashStr(kw);
  const position = 1 + (seed % 50);
  const prevPosition = Math.max(1, position + ((seed >> 8) % 20) - 10);
  const volume = 100 + (seed % 9000);
  const difficulty = (seed % 90) + 5;
  const paths = ["/", "/blog/seo-guide", "/services", "/pricing", "/faq"];
  const url = `https://example.com${paths[seed % paths.length]}`;
  const features = ["organic"];
  if (seed % 3 === 0) features.push("featured");
  if (seed % 4 === 0) features.push("sitelinks");
  if (seed % 5 === 0) features.push("faq");
  if (seed % 7 === 0) features.push("video");
  return {
    keyword: kw,
    position,
    prevPosition,
    volume,
    difficulty,
    url,
    serpFeatures: features,
    trend: genTrend(seed, position),
  };
}

export async function GET() {
  const keywords = DEFAULT_KEYWORDS.map(genKeywordData);
  const avgPos = Math.round(keywords.reduce((s, k) => s + k.position, 0) / keywords.length);
  const totalVol = keywords.reduce((s, k) => s + k.volume, 0);
  const top3 = keywords.filter((k) => k.position <= 3).length;
  const top10 = keywords.filter((k) => k.position <= 10).length;
  const improved = keywords.filter((k) => k.position < k.prevPosition).length;
  return NextResponse.json({
    keywords,
    stats: {
      total: keywords.length,
      avgPosition: avgPos,
      totalVolume: totalVol,
      top3,
      top10,
      improved,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const keyword = (body?.keyword || "").toString().trim();
  if (!keyword) return NextResponse.json({ error: "keyword required" }, { status: 400 });
  const data = genKeywordData(keyword);
  return NextResponse.json({ keyword: data });
}
