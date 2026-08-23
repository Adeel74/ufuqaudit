// GET/POST /api/admin/ai-models — AI model configuration
import { NextRequest, NextResponse } from "next/server";

interface AIModel {
  id: string;
  provider: string;
  model: string;
  apiKey: string; // masked
  temperature: number;
  maxTokens: number;
  contextWindow: number;
  costPerInputToken: number;
  costPerOutputToken: number;
  enabled: boolean;
  isDefault: boolean;
}

const MODELS: AIModel[] = [
  { id: "model_1", provider: "Z.ai", model: "glm-5.2", apiKey: "za_••••••••2a8f", temperature: 0.7, maxTokens: 4096, contextWindow: 128000, costPerInputToken: 0.00001, costPerOutputToken: 0.00003, enabled: true, isDefault: true },
  { id: "model_2", provider: "OpenAI", model: "gpt-4o", apiKey: "sk_••••••••9b3c", temperature: 0.7, maxTokens: 16384, contextWindow: 128000, costPerInputToken: 0.000005, costPerOutputToken: 0.000015, enabled: true, isDefault: false },
  { id: "model_3", provider: "OpenAI", model: "gpt-4o-mini", apiKey: "sk_••••••••9b3c", temperature: 0.7, maxTokens: 16384, contextWindow: 128000, costPerInputToken: 0.00000015, costPerOutputToken: 0.0000006, enabled: true, isDefault: false },
  { id: "model_4", provider: "Anthropic", model: "claude-3-5-sonnet", apiKey: "sk-ant_••••7d1e", temperature: 0.7, maxTokens: 8192, contextWindow: 200000, costPerInputToken: 0.000003, costPerOutputToken: 0.000015, enabled: false, isDefault: false },
  { id: "model_5", provider: "Google", model: "gemini-1.5-pro", apiKey: "AI_••••••5f2a", temperature: 0.7, maxTokens: 8192, contextWindow: 1000000, costPerInputToken: 0.00000125, costPerOutputToken: 0.000005, enabled: false, isDefault: false },
];

// AI routing config
const ROUTING = {
  cheap: { modelId: "model_3", purpose: "Simple recommendations (meta tags, titles, alt text)", model: "gpt-4o-mini" },
  premium: { modelId: "model_1", purpose: "Advanced content analysis (AEO, GEO, content briefs)", model: "glm-5.2" },
  large: { modelId: "model_2", purpose: "Complex SEO strategy (competitor analysis, action plans)", model: "gpt-4o" },
};

const FEATURES = [
  { feature: "AI Recommendations", enabled: true, modelId: "model_1" },
  { feature: "Meta Title Generation", enabled: true, modelId: "model_3" },
  { feature: "Meta Description Generation", enabled: true, modelId: "model_3" },
  { feature: "H1 Generation", enabled: true, modelId: "model_3" },
  { feature: "FAQ Generation", enabled: true, modelId: "model_1" },
  { feature: "Schema Generation", enabled: true, modelId: "model_3" },
  { feature: "Content Brief", enabled: true, modelId: "model_2" },
  { feature: "AEO Recommendations", enabled: true, modelId: "model_1" },
  { feature: "GEO Recommendations", enabled: true, modelId: "model_1" },
  { feature: "AI Blog Generator", enabled: false, modelId: "model_2" },
];

export async function GET() {
  return NextResponse.json({ models: MODELS, routing: ROUTING, features: FEATURES });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { action, modelId } = body;

  if (action === "toggle" && modelId) {
    const model = MODELS.find((m) => m.id === modelId);
    if (model) {
      model.enabled = !model.enabled;
      return NextResponse.json({ ok: true, model });
    }
  }
  if (action === "setDefault" && modelId) {
    MODELS.forEach((m) => m.isDefault = m.id === modelId);
    return NextResponse.json({ ok: true, defaultId: modelId });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
