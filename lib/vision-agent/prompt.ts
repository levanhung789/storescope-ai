// Vision Agent Prompt Builder
// Dynamically constructs prompts with few-shot examples from memory

import type { TrainingExample } from "./types";

// Vietnamese FMCG knowledge base — grows as agent learns
const KNOWLEDGE_BASE = `
## Vietnamese FMCG Brand Knowledge Base
- Calofic: Meizan Gold, Cái Lân, Neptune Light — Cooking Oil
- Masan Consumer: Chinsu fish sauce, Nam Ngư, Tiến Vua, Hảo Hảo noodles
- Acecook Vietnam: Hảo Hảo, Kokomi instant noodles
- Vinamilk: milk, yogurt, condensed milk
- TH True Milk: fresh milk, juice
- Suntory PepsiCo: Pepsi, 7Up, Mirinda, Sting, Aquafina, Lipton
- Coca-Cola Vietnam: Coca-Cola, Sprite, Fanta, Dasani
- Heineken Vietnam: Heineken, Tiger, Larue, Bivina
- SABECO: Bia Saigon, 333 beer
- Ajinomoto Vietnam: Aji-ngon, Aji-mayo, MSG
- Nestlé Vietnam: Maggi, Milo, Kit-Kat
- Unilever Vietnam: Knorr, Lipton (food)
- Cholimex: sauces, condiments

## Price Reference (VND)
- Instant noodles: 5,000–15,000đ/pack
- Cooking oil 1L: 35,000–60,000đ
- Beer 330ml: 8,000–25,000đ
- Milk 1L: 25,000–45,000đ
- Soft drink 330ml: 10,000–18,000đ
`;

export function buildAnalysisPrompt(examples: TrainingExample[]): string {
  let prompt = `You are a specialized Vietnamese FMCG retail shelf analyst AI. Your task is to analyze shelf images and return structured JSON data.

${KNOWLEDGE_BASE}

## Output Format (JSON only, no markdown):
{
  "detections": [
    {
      "brand": "exact brand name",
      "company": "parent company",
      "product": "specific product name and variant",
      "sector": "Cooking Oil|Beverages|Dairy|Condiments|Beer|Instant Food|Snacks|Personal Care|Other",
      "confidence": 0-100,
      "price_vnd": number or null
    }
  ],
  "shelf_share": [{ "brand": "name", "pct": 0-100 }],
  "image_quality": { "score": 0-100, "issues": ["blur","low-light","partial-view","wrong-angle"] },
  "prices_detected": [number],
  "recommendations": ["actionable recommendation"],
  "stock_risks": ["specific risk"],
  "summary": "2-3 sentence analysis summary"
}

## Rules:
- shelf_share percentages must sum to 100
- confidence: 90+ = clearly visible, 70-89 = mostly visible, 50-69 = partially visible
- Only list prices you can actually read from the image
- Be specific: "Meizan Gold 1L" not just "cooking oil"
- Flag empty shelves, missing price tags, damaged products in stock_risks`;

  // Add few-shot examples if available
  if (examples.length > 0) {
    prompt += `\n\n## Learning from Past Analyses (${examples.length} examples):\n`;
    prompt += `These are verified correct analyses — use them as reference:\n`;
    examples.forEach((ex, i) => {
      const r = ex.result;
      prompt += `\nExample ${i + 1} (quality: ${ex.quality}, score: ${r.feedbackScore ?? "N/A"}/5):\n`;
      prompt += `- Detected ${r.detections.length} products: ${r.detections.slice(0, 3).map(d => d.brand).join(", ")}${r.detections.length > 3 ? "..." : ""}\n`;
      prompt += `- Top shelf share: ${r.shelfShare.slice(0, 2).map(s => `${s.brand} ${s.pct}%`).join(", ")}\n`;
      if (r.feedbackNotes) prompt += `- Human feedback: "${r.feedbackNotes}"\n`;
    });
    prompt += `\nApply the same level of detail and accuracy to the new image.\n`;
  }

  prompt += `\nReturn ONLY valid JSON. No explanations outside JSON.`;
  return prompt;
}

export function buildImprovementSummary(exampleCount: number, avgScore: number): string {
  if (exampleCount === 0) return "Base model — no training examples yet";
  if (avgScore >= 4.5) return `Highly trained — ${exampleCount} examples, avg score ${avgScore}/5`;
  if (avgScore >= 3.5) return `Well trained — ${exampleCount} examples, avg score ${avgScore}/5`;
  return `Learning — ${exampleCount} examples, avg score ${avgScore}/5`;
}
