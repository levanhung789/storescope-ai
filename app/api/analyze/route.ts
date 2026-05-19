import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const RF_API_KEY = process.env.ROBOFLOW_API_KEY || "";
const RF_PROJECT = process.env.RF_PROJECT || "";
const RF_VERSION = process.env.RF_VERSION || "1";

interface Detection {
  text: string;
  brand: string;
  company: string;
  sector: string;
  confidence: number;
  source: "gpt4v" | "roboflow" | "ocr";
  bbox?: { x: number; y: number; width: number; height: number };
}

// ── GPT-4o Vision ─────────────────────────────────────────────────────────────
async function runGPT4Vision(base64: string, mimeType: string): Promise<{
  detections: Detection[];
  prices: number[];
  shelfShare: { brand: string; pct: number }[];
  imageQuality: { score: number; issues: string[] };
  recommendations: string[];
  stockRisks: string[];
  rawSummary: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const client = new OpenAI({ apiKey });

  const prompt = `You are an expert FMCG retail analyst. Analyze this shelf image and return a JSON object with the following structure:

{
  "detections": [
    {
      "brand": "brand name",
      "company": "parent company name",
      "product": "specific product name",
      "sector": "product category (Cooking Oil/Beverages/Dairy/Condiments/Beer/Instant Food/Snacks/etc)",
      "confidence": 85,
      "price_vnd": 42000
    }
  ],
  "shelf_share": [
    { "brand": "brand name", "pct": 45 }
  ],
  "image_quality": {
    "score": 87,
    "issues": ["list any issues: blur/low-light/wrong-angle/partial view"]
  },
  "prices_detected": [42000, 56000],
  "recommendations": [
    "actionable recommendation 1",
    "actionable recommendation 2"
  ],
  "stock_risks": [
    "any out-of-stock or overstock risk"
  ],
  "summary": "1-2 sentence overall summary of the shelf"
}

Rules:
- Focus on Vietnamese FMCG brands: Masan, Vinamilk, Acecook, Calofic, Tường An, Pepsi, Coca-Cola, Heineken, SABECO, Ajinomoto, Knorr, Maggi, TH True Milk, etc.
- confidence: 0-100 based on how clearly visible the product is
- shelf_share: percentage of shelf space per brand (must sum to 100)
- price_vnd: price in Vietnamese Dong if visible, null if not
- Return ONLY valid JSON, no markdown, no explanation outside the JSON`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
              detail: "high",
            },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1500,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = JSON.parse(raw) as Record<string, any>;

  const detections: Detection[] = (parsed.detections ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any) => ({
      text:       d.product ?? d.brand,
      brand:      d.brand ?? "Unknown",
      company:    d.company ?? "Unknown",
      sector:     d.sector ?? "FMCG",
      confidence: Number(d.confidence ?? 75),
      source:     "gpt4v" as const,
    })
  );

  const prices: number[] = (parsed.prices_detected ?? [])
    .map(Number)
    .filter((n: number) => n >= 1000 && n <= 5_000_000);

  const shelfShare: { brand: string; pct: number }[] = (parsed.shelf_share ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => ({ brand: String(s.brand), pct: Number(s.pct) })
  );

  const imageQuality = {
    score:  Number(parsed.image_quality?.score ?? 80),
    issues: (parsed.image_quality?.issues ?? []) as string[],
  };

  return {
    detections,
    prices,
    shelfShare,
    imageQuality,
    recommendations: (parsed.recommendations ?? []) as string[],
    stockRisks:      (parsed.stock_risks ?? []) as string[],
    rawSummary:      String(parsed.summary ?? ""),
  };
}

// ── Roboflow fallback ─────────────────────────────────────────────────────────
const BRAND_CATALOG = [
  { keywords: ["ajinomoto","aji-ngon","aji-mayo"],                              brand: "Ajinomoto",      company: "Ajinomoto Vietnam",  sector: "Condiments" },
  { keywords: ["chinsu","nam ngu","nam ngư","masan","tiến vua","hảo hảo"],      brand: "Masan / Chinsu", company: "Masan Consumer",     sector: "Condiments" },
  { keywords: ["maggi","nestlé","nestle"],                                       brand: "Maggi",          company: "Nestlé Vietnam",     sector: "Condiments" },
  { keywords: ["knorr","unilever"],                                              brand: "Knorr",          company: "Unilever Vietnam",   sector: "Condiments" },
  { keywords: ["meizan","cái lân","neptune","calofic","orchid"],                 brand: "Calofic",        company: "Calofic",            sector: "Cooking Oil" },
  { keywords: ["tường an","tuong an"],                                           brand: "Tường An",       company: "Tường An",           sector: "Cooking Oil" },
  { keywords: ["vinamilk"],                                                      brand: "Vinamilk",       company: "Vinamilk",           sector: "Dairy" },
  { keywords: ["th true","th milk"],                                             brand: "TH True Milk",   company: "TH True Milk",       sector: "Dairy" },
  { keywords: ["pepsi","7up","mirinda","sting","aquafina"],                      brand: "Pepsi",          company: "Suntory PepsiCo",    sector: "Beverages" },
  { keywords: ["coca cola","coca-cola","coke","sprite","fanta"],                 brand: "Coca-Cola",      company: "Coca-Cola Vietnam",  sector: "Beverages" },
  { keywords: ["heineken"],                                                       brand: "Heineken",       company: "Heineken Vietnam",   sector: "Beer" },
  { keywords: ["bia saigon","sabeco","333"],                                     brand: "Bia Saigon",     company: "SABECO",             sector: "Beer" },
  { keywords: ["acecook","hảo hảo","kokomi"],                                   brand: "Acecook",        company: "Acecook Vietnam",    sector: "Instant Food" },
];

function matchBrand(text: string) {
  const lower = text.toLowerCase();
  for (const e of BRAND_CATALOG) {
    if (e.keywords.some(k => lower.includes(k)))
      return { brand: e.brand, company: e.company, sector: e.sector };
  }
  return null;
}

async function runRoboflow(base64: string): Promise<Detection[]> {
  if (!RF_PROJECT || !RF_API_KEY) return [];
  try {
    const res = await fetch(
      `https://detect.roboflow.com/${RF_PROJECT}/${RF_VERSION}?api_key=${RF_API_KEY}&confidence=25`,
      { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: base64 }
    );
    if (!res.ok) return [];
    const data = await res.json() as { predictions?: Array<{ class: string; confidence: number; x: number; y: number; width: number; height: number }> };
    return (data.predictions ?? []).map(p => {
      const match = matchBrand(p.class);
      return {
        text: p.class, brand: match?.brand ?? p.class,
        company: match?.company ?? "Unknown", sector: match?.sector ?? "FMCG",
        confidence: Math.round(p.confidence * 100), source: "roboflow" as const,
        bbox: { x: p.x, y: p.y, width: p.width, height: p.height },
      };
    });
  } catch { return []; }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const form     = await req.formData();
    const file     = form.get("image") as File | null;
    const ocrText  = (form.get("ocrText") as string) ?? "";
    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const bytes    = await file.arrayBuffer();
    const base64   = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    // ── Primary: GPT-4o Vision ────────────────────────────────────────────────
    if (process.env.OPENAI_API_KEY) {
      const vision = await runGPT4Vision(base64, mimeType);

      // Merge Roboflow detections if model is available (add bboxes)
      const rfDetections = await runRoboflow(base64);
      const merged = [...vision.detections];
      for (const rf of rfDetections) {
        if (!merged.some(d => d.brand === rf.brand)) merged.push(rf);
      }

      const brandCount: Record<string, number> = {};
      merged.forEach(d => { brandCount[d.brand] = (brandCount[d.brand] ?? 0) + 1; });

      // Use GPT shelf share if available, otherwise calculate from detections
      const shelfShare = vision.shelfShare.length > 0
        ? vision.shelfShare
        : (() => {
            const total = Math.max(Object.values(brandCount).reduce((a, b) => a + b, 0), 1);
            return Object.entries(brandCount)
              .map(([brand, cnt]) => ({ brand, pct: Math.round((cnt / total) * 100) }))
              .sort((a, b) => b.pct - a.pct);
          })();

      return NextResponse.json({
        success:      true,
        model:        "gpt-4o",
        method:       "gpt4v" + (rfDetections.length ? "+roboflow" : ""),
        detections:   merged,
        prices:       vision.prices.sort((a, b) => a - b),
        shelfShare,
        imageQuality: vision.imageQuality,
        recommendations: vision.recommendations,
        stockRisks:   vision.stockRisks,
        rawSummary:   vision.rawSummary,
        ocrLines:     ocrText.split("\n").filter(l => l.trim().length > 2).length,
        summary: {
          totalBrands: Object.keys(brandCount).length,
          topBrand:    shelfShare[0]?.brand ?? "—",
          priceRange:  vision.prices.length
            ? { min: Math.min(...vision.prices), max: Math.max(...vision.prices) }
            : null,
          rfHits:   rfDetections.length,
          gpt4vHits: vision.detections.length,
        },
      });
    }

    // ── Fallback: Roboflow + OCR ──────────────────────────────────────────────
    const rfDetections = await runRoboflow(base64);
    const results: Detection[] = [...rfDetections];

    const lines = ocrText.split("\n").map(l => l.trim()).filter(l => l.length > 2);
    for (const line of lines) {
      const match = matchBrand(line);
      if (match && !results.some(r => r.brand === match.brand))
        results.push({ text: line, ...match, confidence: 78, source: "ocr" });
    }

    const PRICE_REGEX = /\b(\d{2,3}[.,]\d{3})\s*(đ|d)?\b|\b(\d{4,6})\s*đ\b/gi;
    const prices: number[] = [];
    for (const m of ocrText.matchAll(PRICE_REGEX)) {
      const n = parseInt((m[1] ?? m[3] ?? "").replace(/[.,]/g, ""));
      if (n >= 5000 && n <= 5_000_000) prices.push(n);
    }

    const brandCount: Record<string, number> = {};
    results.forEach(d => { brandCount[d.brand] = (brandCount[d.brand] ?? 0) + 1; });
    const total = Math.max(Object.values(brandCount).reduce((a, b) => a + b, 0), 1);
    const shelfShare = Object.entries(brandCount)
      .map(([brand, cnt]) => ({ brand, pct: Math.round((cnt / total) * 100) }))
      .sort((a, b) => b.pct - a.pct);

    return NextResponse.json({
      success: true,
      model:   RF_PROJECT || "ocr-only",
      method:  RF_PROJECT ? "roboflow+ocr" : "ocr",
      detections: results,
      prices:  [...new Set(prices)].sort((a, b) => a - b),
      shelfShare,
      ocrLines: lines.length,
      summary: {
        totalBrands: Object.keys(brandCount).length,
        topBrand:    shelfShare[0]?.brand ?? "—",
        priceRange:  prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
        rfHits:      rfDetections.length,
        ocrHits:     results.length - rfDetections.length,
      },
    });

  } catch (err) {
    console.error("[Analyze] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
