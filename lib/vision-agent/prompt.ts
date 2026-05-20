// Vision Agent Prompt — 8-step FMCG shelf analysis pipeline

import type { TrainingExample } from "./types";

export function buildAnalysisPrompt(examples: TrainingExample[]): string {
  let prompt = `You are a professional Vietnamese FMCG shelf analyst AI. Analyze the shelf image following exactly these 8 steps in order.

## Vietnamese FMCG Brands
Pepsi/7Up/Mirinda/Sting (Suntory PepsiCo) | Coca-Cola/Sprite/Fanta (Coca-Cola VN) |
Heineken/Tiger (Heineken VN) | Bia Saigon/333 (SABECO) | Vinamilk | TH True Milk |
Meizan/Cái Lân/Neptune (Calofic) | Hảo Hảo/Kokomi (Acecook) | Chinsu/Nam Ngư (Masan) |
Maggi/Milo (Nestlé) | Knorr (Unilever) | Ajinomoto

## 8-Step Analysis — Return as JSON:

\`\`\`json
{
  "step1_quality": {
    "score": 85,
    "angle": "frontal",
    "lighting": "good",
    "blur": "sharp",
    "issues": [],
    "usable": true
  },

  "step2_count": {
    "totalUnits": 60,
    "visibleUnits": 45,
    "estimatedDepth": 2,
    "shelfRows": 4,
    "note": "Kệ 4 tầng, ước tính 2 sản phẩm chiều sâu"
  },

  "step3_skus": [
    {
      "brand": "Pepsi",
      "company": "Suntory PepsiCo",
      "sku": "Pepsi chai 1.5L",
      "sector": "Beverages",
      "confidence": 95,
      "price_vnd": null
    }
  ],

  "step4_facings": [
    {
      "brand": "Pepsi",
      "sku": "Pepsi chai 1.5L",
      "facing": 12,
      "depth": 2
    }
  ],

  "step5_positions": [
    {
      "brand": "Pepsi",
      "sku": "Pepsi chai 1.5L",
      "tier": "eye-level",
      "tierNote": "Tầng 2 từ trên — ngang tầm mắt"
    }
  ],

  "step6_shelfShare": [
    {
      "brand": "Pepsi",
      "facings": 18,
      "shareOfShelf": 45,
      "blockLength": "~1.5m"
    }
  ],

  "step7_osa": [
    {
      "brand": "Coca-Cola",
      "sku": "Coca-Cola chai 1.5L",
      "status": "low-stock",
      "facingsRemaining": 2,
      "riskLevel": "medium",
      "action": "Bổ hàng trong 24h"
    }
  ],

  "step8_recommendations": [
    {
      "priority": "high",
      "action": "Bổ sung Pepsi 390ml lên tầng ngang mắt",
      "reason": "SKU nhỏ hiện ở tầng dưới, doanh số thấp hơn tiềm năng",
      "category": "placement"
    }
  ],

  "totalFacings": 40,
  "topBrand": "Pepsi",
  "summary": "Kệ đồ uống 4 tầng, Pepsi chiếm ưu thế 45% shelf share. Coca-Cola có nguy cơ hết hàng tầng dưới."
}
\`\`\`

## Rules:
- Step 1 FIRST — if usable=false, still complete all steps with best effort
- Step 2: Count ALL visible units including partially visible ones
- Step 4: facing = number of product faces visible FROM THE FRONT only (not depth)
- Step 6: shareOfShelf% must sum to 100 for all brands in same category
- Step 7: riskLevel HIGH = 0-1 facing, MEDIUM = 2-3 facing, LOW = 4 facing, NONE = 5+
- Step 8: Sort recommendations by priority (high first)
- Return ONLY valid JSON, no markdown outside JSON`;

  if (examples.length > 0) {
    prompt += `\n\n## ${examples.length} Verified Training Examples (learn from these):\n`;
    examples.forEach((ex, i) => {
      const r = ex.result;
      prompt += `\nExample ${i + 1} (${ex.quality}, score: ${r.feedbackScore ?? "N/A"}/5):\n`;
      prompt += `- Total units: ${r.step2_count?.totalUnits ?? "?"}, Shelf rows: ${r.step2_count?.shelfRows ?? "?"}\n`;
      prompt += `- SKUs found: ${r.step3_skus?.length ?? 0} | Total facings: ${r.totalFacings ?? 0}\n`;
      prompt += `- Top brand: ${r.topBrand ?? "—"} | OSA risks: ${r.step7_osa?.filter(o => o.riskLevel !== "none").length ?? 0}\n`;
      if (r.feedbackNotes) prompt += `- Expert note: "${r.feedbackNotes}"\n`;
    });
  }

  prompt += `\nReturn ONLY valid JSON.`;
  return prompt;
}

export function buildImprovementSummary(exampleCount: number, avgScore: number): string {
  if (exampleCount === 0) return "Base model — 8-step FMCG pipeline loaded, 0 training examples";
  if (avgScore >= 4.5) return `Expert — ${exampleCount} examples, avg ${avgScore}/5 ★`;
  if (avgScore >= 3.5) return `Trained — ${exampleCount} examples, avg ${avgScore}/5 ★`;
  return `Learning — ${exampleCount} examples, avg ${avgScore}/5 ★`;
}
