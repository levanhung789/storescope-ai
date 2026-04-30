import { NextRequest, NextResponse } from "next/server";

const RF_API_KEY = process.env.ROBOFLOW_API_KEY || "QH9U94r31RusAz0TaO3O";
const RF_PROJECT = process.env.RF_PROJECT || "";
const RF_VERSION = process.env.RF_VERSION || "1";

// Vietnamese FMCG brand catalog
const BRAND_CATALOG = [
  { keywords: ["ajinomoto","aji-ngon","aji-mayo","aji-quick","ajinomot"],        brand: "Ajinomoto",       company: "Ajinomoto Vietnam",    sector: "Condiments" },
  { keywords: ["chinsu","nam ngu","nam ngư","masan","tiến vua","vị hảo hảo"],   brand: "Masan / Chinsu",  company: "Masan Consumer",       sector: "Condiments" },
  { keywords: ["maggi","nestlé","nestle"],                                       brand: "Maggi",           company: "Nestlé Vietnam",       sector: "Condiments" },
  { keywords: ["knorr","unilever","bestfood","best food"],                       brand: "Knorr",           company: "Unilever Vietnam",     sector: "Condiments" },
  { keywords: ["cholimex","hương việt"],                                         brand: "Cholimex",        company: "Cholimex Food",        sector: "Condiments" },
  { keywords: ["meizan","cái lân","cai lan","neptune","calofic","orchid"],       brand: "Calofic",         company: "Calofic",              sector: "Cooking Oil" },
  { keywords: ["tường an","tuong an"],                                           brand: "Tường An",        company: "Tường An",             sector: "Cooking Oil" },
  { keywords: ["vinamilk","vina milk"],                                          brand: "Vinamilk",        company: "Vinamilk",             sector: "Dairy" },
  { keywords: ["th true","th milk"],                                             brand: "TH True Milk",   company: "TH True Milk",         sector: "Dairy" },
  { keywords: ["pepsi","7up","mirinda","sting","aquafina","lipton"],             brand: "Pepsi",           company: "Suntory PepsiCo",      sector: "Beverages" },
  { keywords: ["coca cola","coca-cola","coke","sprite","fanta"],                 brand: "Coca-Cola",       company: "Coca-Cola Vietnam",    sector: "Beverages" },
  { keywords: ["heineken"],                                                       brand: "Heineken",        company: "Heineken Vietnam",     sector: "Beer" },
  { keywords: ["bia saigon","sabeco","333"],                                     brand: "Bia Saigon",      company: "SABECO",               sector: "Beer" },
  { keywords: ["habeco","bia hà nội"],                                           brand: "Bia Hà Nội",      company: "HABECO",               sector: "Beer" },
  { keywords: ["acecook","hảo hảo","kokomi"],                                   brand: "Acecook",         company: "Acecook Vietnam",      sector: "Instant Food" },
  { keywords: ["vifon"],                                                          brand: "Vifon",           company: "Vifon",                sector: "Instant Food" },
];

// Price pattern: 39,500 / 42.400 / 56200đ
const PRICE_REGEX = /\b(\d{2,3}[.,]\d{3})\s*(đ|d)?\b|\b(\d{4,6})\s*đ\b/gi;

interface Detection {
  text: string;
  brand: string;
  company: string;
  sector: string;
  confidence: number;
  source: "roboflow" | "ocr";
  bbox?: { x: number; y: number; width: number; height: number };
}

function matchBrand(text: string) {
  const lower = text.toLowerCase();
  for (const entry of BRAND_CATALOG) {
    if (entry.keywords.some(k => lower.includes(k))) {
      return { brand: entry.brand, company: entry.company, sector: entry.sector };
    }
  }
  return null;
}

function extractPrices(text: string): number[] {
  const prices: number[] = [];
  for (const m of text.matchAll(PRICE_REGEX)) {
    const raw = (m[1] || m[3] || "").replace(/[.,]/g, "");
    const n = parseInt(raw);
    if (n >= 5000 && n <= 5000000) prices.push(n);
  }
  return [...new Set(prices)];
}

async function runRoboflow(base64: string): Promise<Detection[]> {
  if (!RF_PROJECT) return [];
  try {
    const res = await fetch(
      `https://detect.roboflow.com/${RF_PROJECT}/${RF_VERSION}?api_key=${RF_API_KEY}&confidence=25`,
      { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: base64 }
    );
    if (!res.ok) return [];
    const data = await res.json() as { predictions?: Array<{ class: string; confidence: number; x: number; y: number; width: number; height: number }> };
    return (data.predictions || []).map(p => {
      const match = matchBrand(p.class);
      return {
        text: p.class,
        brand: match?.brand || p.class,
        company: match?.company || "Unknown",
        sector: match?.sector || "FMCG",
        confidence: Math.round(p.confidence * 100),
        source: "roboflow" as const,
        bbox: { x: p.x, y: p.y, width: p.width, height: p.height },
      };
    });
  } catch { return []; }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("image") as File | null;

    // OCR results sent from client (Tesseract.js runs client-side)
    const ocrText = (form.get("ocrText") as string) || "";

    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const bytes  = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const results: Detection[] = [];

    // ── Step 1: Roboflow detection (if model deployed) ────────────────────────
    const rfDetections = await runRoboflow(base64);
    results.push(...rfDetections);

    // ── Step 2: Brand matching from OCR text ──────────────────────────────────
    const lines = ocrText.split("\n").map(l => l.trim()).filter(l => l.length > 2);
    for (const line of lines) {
      const match = matchBrand(line);
      if (match && !results.some(r => r.brand === match.brand)) {
        results.push({ text: line, ...match, confidence: 78, source: "ocr" });
      }
    }

    // ── Step 3: Price extraction ──────────────────────────────────────────────
    const prices = extractPrices(ocrText);

    // ── Step 4: Shelf share ───────────────────────────────────────────────────
    const brandCount: Record<string, number> = {};
    results.forEach(d => { brandCount[d.brand] = (brandCount[d.brand] || 0) + 1; });
    const total = Math.max(Object.values(brandCount).reduce((a, b) => a + b, 0), 1);
    const shelfShare = Object.entries(brandCount)
      .map(([brand, count]) => ({ brand, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.pct - a.pct);

    return NextResponse.json({
      success: true,
      model: RF_PROJECT || "ocr-only",
      method: RF_PROJECT ? "roboflow+ocr" : "ocr",
      detections: results,
      prices: prices.sort((a, b) => a - b),
      shelfShare,
      ocrLines: lines.length,
      summary: {
        totalBrands:  Object.keys(brandCount).length,
        topBrand:     shelfShare[0]?.brand || "—",
        priceRange:   prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
        rfHits:       rfDetections.length,
        ocrHits:      results.length - rfDetections.length,
      },
    });

  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
