// POST /api/content/analyze — analyze content for readability, keyword density, SEO
import { NextRequest, NextResponse } from "next/server";

interface AnalysisResult {
  stats: {
    wordCount: number;
    charCount: number;
    sentenceCount: number;
    paragraphCount: number;
    readingTimeMin: number;
    avgWordsPerSentence: number;
    avgCharsPerWord: number;
  };
  readability: {
    fleschReadingEase: number;
    fleschKincaidGrade: number;
    grade: string;
    interpretation: string;
    color: string;
  };
  keywordDensity: { word: string; count: number; density: number }[];
  topPhrases: { phrase: string; count: number }[];
  contentChecks: {
    id: string;
    label: string;
    status: "pass" | "warn" | "fail";
    detail: string;
  }[];
  suggestions: string[];
}

function splitSentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, "$1\n")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = (body?.text || "").toString().trim();
    const focusKeyword = (body?.keyword || "").toString().trim().toLowerCase();

    if (!text) {
      return NextResponse.json({ error: "Text content is required" }, { status: 400 });
    }

    const words = text
      .replace(/<[^>]+>/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const wordCount = words.length;
    const charCount = text.length;
    const sentences = splitSentences(text);
    const sentenceCount = sentences.length;
    const paragraphCount = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
    const readingTimeMin = Math.max(1, Math.round(wordCount / 200));
    const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;
    const avgCharsPerWord = wordCount > 0 ? Math.round(charCount / wordCount) : 0;

    // Flesch Reading Ease
    const syllableCount = words.reduce((s, w) => s + countSyllables(w), 0);
    const fleschReadingEase =
      sentenceCount > 0 && wordCount > 0
        ? Math.round((206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount)) * 10) / 10
        : 0;
    const fleschKincaidGrade =
      sentenceCount > 0 && wordCount > 0
        ? Math.round((0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59) * 10) / 10
        : 0;

    let interpretation = "";
    let grade = "";
    let color = "";
    if (fleschReadingEase >= 90) { interpretation = "Very easy to read — 5th grade"; grade = "A+"; color = "#10b981"; }
    else if (fleschReadingEase >= 80) { interpretation = "Easy to read — 6th grade"; grade = "A"; color = "#10b981"; }
    else if (fleschReadingEase >= 70) { interpretation = "Fairly easy — 7th grade"; grade = "B+"; color = "#10b981"; }
    else if (fleschReadingEase >= 60) { interpretation = "Standard — 8th-9th grade"; grade = "B"; color = "#f59e0b"; }
    else if (fleschReadingEase >= 50) { interpretation = "Fairly difficult — 10th-12th grade"; grade = "C"; color = "#f59e0b"; }
    else if (fleschReadingEase >= 30) { interpretation = "Difficult — college level"; grade = "D"; color = "#f97316"; }
    else { interpretation = "Very difficult — graduate level"; grade = "F"; color = "#ef4444"; }

    // Keyword density (top 10 single words, excluding stopwords)
    const stopWords = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
      "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
      "being", "have", "has", "had", "do", "does", "did", "will", "would",
      "could", "should", "may", "might", "must", "can", "this", "that",
      "these", "those", "i", "you", "he", "she", "it", "we", "they", "what",
      "which", "who", "when", "where", "why", "how", "all", "each", "every",
      "both", "few", "more", "most", "other", "some", "such", "no", "not",
      "only", "own", "same", "so", "than", "too", "very", "just", "as",
      "if", "then", "also", "into", "your", "you", "your", "ours", "ourselves",
      "out", "up", "down", "off", "over", "under", "again",
    ]);
    const wordFreq: Record<string, number> = {};
    for (const w of words) {
      const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (clean.length < 3 || stopWords.has(clean)) continue;
      wordFreq[clean] = (wordFreq[clean] || 0) + 1;
    }
    const keywordDensity = Object.entries(wordFreq)
      .map(([word, count]) => ({ word, count, density: Math.round((count / wordCount) * 1000) / 10 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top phrases (2-3 word n-grams)
    const phraseFreq: Record<string, number> = {};
    for (let i = 0; i < words.length - 1; i++) {
      const pair = `${words[i].toLowerCase().replace(/[^a-z0-9]/g, "")} ${words[i + 1].toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      const parts = pair.split(" ");
      if (parts.some((p) => p.length < 3 || stopWords.has(p))) continue;
      phraseFreq[pair] = (phraseFreq[pair] || 0) + 1;
    }
    const topPhrases = Object.entries(phraseFreq)
      .filter(([, count]) => count >= 2)
      .map(([phrase, count]) => ({ phrase, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Content checks
    const contentChecks: AnalysisResult["contentChecks"] = [];
    contentChecks.push({
      id: "word_count",
      label: "Word count",
      status: wordCount >= 300 ? "pass" : wordCount >= 150 ? "warn" : "fail",
      detail: `${wordCount} words — ${wordCount >= 300 ? "good depth" : wordCount >= 150 ? "could be deeper" : "too thin"}`,
    });
    contentChecks.push({
      id: "paragraphs",
      label: "Paragraph structure",
      status: paragraphCount >= 3 ? "pass" : paragraphCount >= 2 ? "warn" : "fail",
      detail: `${paragraphCount} paragraphs — ${paragraphCount >= 3 ? "well-structured" : "consider breaking into more paragraphs"}`,
    });
    contentChecks.push({
      id: "sentence_length",
      label: "Avg sentence length",
      status: avgWordsPerSentence <= 20 ? "pass" : avgWordsPerSentence <= 25 ? "warn" : "fail",
      detail: `${avgWordsPerSentence} words/sentence — ${avgWordsPerSentence <= 20 ? "concise" : "consider shorter sentences"}`,
    });
    contentChecks.push({
      id: "readability",
      label: "Readability",
      status: fleschReadingEase >= 60 ? "pass" : fleschReadingEase >= 40 ? "warn" : "fail",
      detail: `Flesch ${fleschReadingEase} — ${interpretation}`,
    });
    if (focusKeyword) {
      const kwCount = words.filter((w) => w.toLowerCase().replace(/[^a-z0-9]/g, "") === focusKeyword).length;
      const kwDensity = Math.round((kwCount / wordCount) * 1000) / 10;
      contentChecks.push({
        id: "focus_keyword",
        label: `Focus keyword "${focusKeyword}"`,
        status: kwDensity >= 0.5 && kwDensity <= 2.5 ? "pass" : kwDensity > 2.5 ? "warn" : "fail",
        detail: `${kwCount} occurrences (${kwDensity}%) — ${kwDensity >= 0.5 && kwDensity <= 2.5 ? "optimal density" : kwDensity > 2.5 ? "risk of keyword stuffing" : "keyword too sparse"}`,
      });
    }
    contentChecks.push({
      id: "reading_time",
      label: "Reading time",
      status: readingTimeMin <= 7 ? "pass" : readingTimeMin <= 12 ? "warn" : "fail",
      detail: `${readingTimeMin} min — ${readingTimeMin <= 7 ? "ideal length" : "consider splitting"}`,
    });

    // Suggestions
    const suggestions: string[] = [];
    if (wordCount < 300) suggestions.push("Expand content to at least 300 words for better topical coverage.");
    if (avgWordsPerSentence > 20) suggestions.push("Shorten sentences — aim for 15-20 words on average.");
    if (fleschReadingEase < 60) suggestions.push("Simplify language — use shorter words and sentences.");
    if (paragraphCount < 3) suggestions.push("Break content into more paragraphs with H2/H3 subheadings.");
    if (focusKeyword) {
      const kwDensity = keywordDensity.find((k) => k.word === focusKeyword)?.density ?? 0;
      if (kwDensity < 0.5) suggestions.push(`Use the focus keyword "${focusKeyword}" more often (currently ${kwDensity}%).`);
      if (kwDensity > 2.5) suggestions.push(`Reduce "${focusKeyword}" usage (currently ${kwDensity}%) to avoid keyword stuffing.`);
    }
    if (suggestions.length === 0) suggestions.push("Content looks well-optimized! Consider adding internal links and a FAQ section.");

    const result: AnalysisResult = {
      stats: { wordCount, charCount, sentenceCount, paragraphCount, readingTimeMin, avgWordsPerSentence, avgCharsPerWord },
      readability: { fleschReadingEase, fleschKincaidGrade, grade, interpretation, color },
      keywordDensity,
      topPhrases,
      contentChecks,
      suggestions,
    };

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Analysis failed" }, { status: 500 });
  }
}
