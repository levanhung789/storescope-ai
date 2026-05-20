// VisionAgent — 8-step FMCG shelf analysis

import OpenAI from "openai";
import { createHash } from "crypto";
import { getBestExamples, saveAnalysis, saveTrainingExample } from "./memory";
import { buildAnalysisPrompt } from "./prompt";
import type { PipelineResult } from "./types";

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
): Promise<PipelineResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const client   = new OpenAI({ apiKey });
  const examples = getBestExamples(3);
  const prompt   = buildAnalysisPrompt(examples);

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" } },
        { type: "text", text: prompt },
      ],
    }],
    response_format: { type: "json_object" },
    max_tokens: 2500,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p   = JSON.parse(raw) as Record<string, any>;

  const result: PipelineResult = {
    id:        makeId(),
    imageHash: hashImage(base64),
    model:     `gpt-4o (${examples.length} examples)`,
    createdAt: Date.now(),

    step1_quality: {
      score:    Number(p.step1_quality?.score ?? 80),
      angle:    p.step1_quality?.angle ?? "unknown",
      lighting: p.step1_quality?.lighting ?? "good",
      blur:     p.step1_quality?.blur ?? "sharp",
      issues:   p.step1_quality?.issues ?? [],
      usable:   p.step1_quality?.usable ?? true,
      perspective: {
        shootingAngle:      Number(p.step1_quality?.perspective?.shootingAngle ?? 0),
        vanishingPoint:     p.step1_quality?.perspective?.vanishingPoint ?? "none",
        perspectiveType:    p.step1_quality?.perspective?.perspectiveType ?? "frontal",
        nearSide:           p.step1_quality?.perspective?.nearSide ?? "none",
        nearFarRatio:       Number(p.step1_quality?.perspective?.nearFarRatio ?? 1),
        depthVisible:       Boolean(p.step1_quality?.perspective?.depthVisible ?? false),
        depthVisibleNote:   String(p.step1_quality?.perspective?.depthVisibleNote ?? ""),
        correctionFactor:   Number(p.step1_quality?.perspective?.correctionFactor ?? 1),
        correctionNote:     String(p.step1_quality?.perspective?.correctionNote ?? ""),
        shelfLinesConverge: Boolean(p.step1_quality?.perspective?.shelfLinesConverge ?? false),
        estimatedDistance:  String(p.step1_quality?.perspective?.estimatedDistance ?? "unknown"),
      },
    },

    step2_count: {
      totalUnits:     Number(p.step2_count?.totalUnits ?? 0),
      visibleUnits:   Number(p.step2_count?.visibleUnits ?? 0),
      estimatedDepth: Number(p.step2_count?.estimatedDepth ?? 1),
      shelfRows:      Number(p.step2_count?.shelfRows ?? 1),
      note:           String(p.step2_count?.note ?? ""),
    },

    step3_skus: (p.step3_skus ?? []).map((s: Record<string, unknown>) => ({
      brand:      String(s.brand ?? "Unknown"),
      company:    String(s.company ?? "Unknown"),
      sku:        String(s.sku ?? s.brand ?? "Unknown"),
      sector:     String(s.sector ?? "FMCG"),
      confidence: Number(s.confidence ?? 75),
      price_vnd:  s.price_vnd ? Number(s.price_vnd) : null,
    })),

    step4_facings: (p.step4_facings ?? []).map((f: Record<string, unknown>) => ({
      brand:           String(f.brand ?? ""),
      sku:             String(f.sku ?? ""),
      facing:          Number(f.facing ?? 1),
      facingAdjusted:  Number(f.facingAdjusted ?? f.facing ?? 1),
      depth:           Number(f.depth ?? 1),
      isDepthVisible:  Boolean(f.isDepthVisible ?? false),
      perspectiveNote: String(f.perspectiveNote ?? ""),
    })),

    step5_positions: (p.step5_positions ?? []).map((pos: Record<string, unknown>) => ({
      brand:    String(pos.brand ?? ""),
      sku:      String(pos.sku ?? ""),
      tier:     (pos.tier ?? "unknown") as PipelineResult["step5_positions"][0]["tier"],
      tierNote: String(pos.tierNote ?? ""),
    })),

    step6_shelfShare: (p.step6_shelfShare ?? []).map((s: Record<string, unknown>) => ({
      brand:        String(s.brand ?? ""),
      facings:      Number(s.facings ?? 0),
      shareOfShelf: Number(s.shareOfShelf ?? 0),
      blockLength:  String(s.blockLength ?? ""),
    })),

    step7_osa: (p.step7_osa ?? []).map((o: Record<string, unknown>) => ({
      brand:            String(o.brand ?? ""),
      sku:              String(o.sku ?? ""),
      status:           (o.status ?? "in-stock") as "in-stock" | "low-stock" | "out-of-stock",
      facingsRemaining: Number(o.facingsRemaining ?? 0),
      riskLevel:        (o.riskLevel ?? "none") as "none" | "low" | "medium" | "high",
      action:           String(o.action ?? ""),
    })),

    step8_recommendations: (p.step8_recommendations ?? []).map((r: Record<string, unknown>) => ({
      priority: (r.priority ?? "medium") as "high" | "medium" | "low",
      action:   String(r.action ?? ""),
      reason:   String(r.reason ?? ""),
      category: (r.category ?? "general") as "restocking" | "placement" | "planogram" | "pricing" | "general",
    })),

    totalFacings: Number(p.totalFacings ?? 0),
    topBrand:     String(p.topBrand ?? ""),
    summary:      String(p.summary ?? ""),
    isTrainingExample: false,
  };

  saveAnalysis(result);
  if (saveExample && result.step1_quality.score >= 80) saveTrainingExample(result, base64);

  return result;
}
