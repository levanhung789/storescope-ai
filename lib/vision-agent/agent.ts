// VisionAgent — Main analysis class
// Uses GPT-4o with few-shot learning from memory

import OpenAI from "openai";
import { createHash } from "crypto";
import { getBestExamples, saveAnalysis, saveTrainingExample } from "./memory";
import { buildAnalysisPrompt } from "./prompt";
import type { AnalysisResult, Detection, ShelfShare, ImageQuality } from "./types";

function makeId(): string {
  return "VA-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function hashImage(base64: string): string {
  return createHash("sha256").update(base64.slice(0, 5000)).digest("hex").slice(0, 16);
}

export async function analyzeImage(
  base64: string,
  mimeType: string,
  saveExample = false,
): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const client = new OpenAI({ apiKey });

  // Fetch best few-shot examples from memory
  const examples = getBestExamples(3);
  const prompt   = buildAnalysisPrompt(examples);

  const response = await client.chat.completions.create({
    model:           "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_tokens:      1800,
  });

  const raw    = response.choices[0]?.message?.content ?? "{}";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = JSON.parse(raw) as Record<string, any>;

  const detections: Detection[] = (parsed.detections ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any): Detection => ({
      brand:      String(d.brand ?? "Unknown"),
      company:    String(d.company ?? "Unknown"),
      product:    String(d.product ?? d.brand ?? "Unknown"),
      sector:     String(d.sector ?? "FMCG"),
      confidence: Number(d.confidence ?? 75),
      price_vnd:  d.price_vnd ? Number(d.price_vnd) : null,
    })
  );

  const shelfShare: ShelfShare[] = (parsed.shelf_share ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any): ShelfShare => ({ brand: String(s.brand), pct: Number(s.pct) })
  );

  const imageQuality: ImageQuality = {
    score:  Number(parsed.image_quality?.score ?? 80),
    issues: (parsed.image_quality?.issues ?? []) as string[],
  };

  const prices: number[] = (parsed.prices_detected ?? [])
    .map(Number)
    .filter((n: number) => n >= 1000 && n <= 5_000_000);

  const result: AnalysisResult = {
    id:              makeId(),
    imageHash:       hashImage(base64),
    detections,
    shelfShare,
    imageQuality,
    recommendations: (parsed.recommendations ?? []) as string[],
    stockRisks:      (parsed.stock_risks ?? []) as string[],
    rawSummary:      String(parsed.summary ?? ""),
    model:           `gpt-4o (${examples.length} examples)`,
    createdAt:       Date.now(),
    isTrainingExample: false,
    // Attach prices to result for downstream use
    ...({ prices } as object),
  };

  // Save to memory
  saveAnalysis(result);

  // Auto-save as example if high quality image
  if (saveExample && imageQuality.score >= 80) {
    saveTrainingExample(result, base64);
  }

  return result;
}
