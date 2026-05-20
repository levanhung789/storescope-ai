// Vision Agent — Core Types (8-step pipeline)

// ── Step results ───────────────────────────────────────────────────────────────

// Perspective analysis — art/painting principles applied to shelf photos
export interface PerspectiveAnalysis {
  // Góc chụp
  shootingAngle:    number;   // ước tính độ lệch so với thẳng góc (0=frontal, 30=xiên 30°, 90=side)
  vanishingPoint:   "left" | "right" | "center" | "none";  // điểm tụ phối cảnh
  perspectiveType:  "frontal" | "one-point" | "two-point" | "top-down";

  // Phân tích near/far (gần/xa)
  nearSide:         "left" | "right" | "bottom" | "none";  // phía nào gần camera hơn
  nearFarRatio:     number;   // tỉ lệ pixel gần/xa — VD: 1.8 = sản phẩm gần chiếm 1.8× pixels
  depthVisible:     boolean;  // có thấy mặt bên sản phẩm không (depth đang bị nhầm với facing)
  depthVisibleNote: string;   // "Thấy mặt bên chai Pepsi — đây là depth, không phải facing"

  // Correction factor cho facing count
  correctionFactor: number;   // nhân với facing đếm được để ra facing thật. VD: 0.85 khi xiên 30°
  correctionNote:   string;   // giải thích: "Góc 30° → nhân 0.87 (cos30°) để hiệu chỉnh"

  // Shelf lines (đường kệ hội tụ về điểm tụ)
  shelfLinesConverge: boolean;  // các đường kệ có hội tụ không
  estimatedDistance:  string;   // ước tính khoảng cách chụp: "~1.5m", "~2m"
}

// Step 1: Image Quality + Perspective
export interface StepQuality {
  score:       number;    // 0-100
  angle:       "frontal" | "angled" | "top-down" | "unknown";
  lighting:    "good" | "low-light" | "overexposed";
  blur:        "sharp" | "slight-blur" | "blurry";
  issues:      string[];
  usable:      boolean;
  perspective: PerspectiveAnalysis;  // phân tích phối cảnh
}

// Step 2: Product Count
export interface StepProductCount {
  totalUnits:      number;   // tổng units ước tính
  visibleUnits:    number;   // units nhìn thấy rõ
  estimatedDepth:  number;   // ước tính độ sâu kệ (rows behind)
  shelfRows:       number;   // số tầng kệ
  note:            string;
}

// Step 3: Brand & SKU Detection
export interface SKUItem {
  brand:      string;
  company:    string;
  sku:        string;     // e.g. "Pepsi chai 1.5L"
  sector:     string;
  confidence: number;
  price_vnd:  number | null;
}

// Step 4: Facing Count (with perspective correction)
export interface FacingItem {
  brand:          string;
  sku:            string;
  facing:         number;   // facing đếm được từ ảnh (raw)
  facingAdjusted: number;   // facing sau hiệu chỉnh phối cảnh
  depth:          number;   // units sâu (không phải facing)
  isDepthVisible: boolean;  // có thấy mặt bên không
  perspectiveNote: string;  // "Gần camera — có thể overcounted 15%"
}

// Step 5: Shelf Position
export interface PositionItem {
  brand:    string;
  sku:      string;
  tier:     "eye-level" | "top" | "bottom" | "end-cap" | "floor-stack";
  tierNote: string;   // e.g. "tầng 2 từ trên"
}

// Step 6: Share of Shelf
export interface ShelfShareItem {
  brand:        string;
  facings:      number;
  shareOfShelf: number;   // %
  blockLength:  string;   // ước tính chiều dài block
}

// Step 7: OSA (On-Shelf Availability)
export interface OsaItem {
  brand:            string;
  sku:              string;
  status:           "in-stock" | "low-stock" | "out-of-stock";
  facingsRemaining: number;
  riskLevel:        "none" | "low" | "medium" | "high";
  action:           string;   // e.g. "Reorder within 24h"
}

// Step 8: Recommendations
export interface RecommendationItem {
  priority:   "high" | "medium" | "low";
  action:     string;
  reason:     string;
  category:   "restocking" | "placement" | "planogram" | "pricing" | "general";
}

// ── Full pipeline result ───────────────────────────────────────────────────────
export interface PipelineResult {
  id:        string;
  imageHash: string;
  model:     string;
  createdAt: number;

  step1_quality:      StepQuality;
  step2_count:        StepProductCount;
  step3_skus:         SKUItem[];
  step4_facings:      FacingItem[];
  step5_positions:    PositionItem[];
  step6_shelfShare:   ShelfShareItem[];
  step7_osa:          OsaItem[];
  step8_recommendations: RecommendationItem[];

  totalFacings:  number;
  topBrand:      string;
  summary:       string;

  // Learning
  feedbackScore?:    number;
  feedbackNotes?:    string;
  isTrainingExample: boolean;
}

// ── Legacy alias ───────────────────────────────────────────────────────────────
export type AnalysisResult = PipelineResult;

// ── Memory & Training ─────────────────────────────────────────────────────────
export interface AgentMemory {
  analyses:         PipelineResult[];
  trainingExamples: TrainingExample[];
  stats: {
    totalAnalyses:    number;
    avgFeedbackScore: number;
    topBrands:        { brand: string; count: number }[];
    lastUpdated:      number;
  };
}

export interface TrainingExample {
  id:          string;
  imageHash:   string;
  imageBase64: string;
  result:      PipelineResult;
  addedAt:     number;
  quality:     "excellent" | "good";
}

export interface FeedbackPayload {
  analysisId:    string;
  score:         number;
  notes?:        string;
  saveAsExample?: boolean;
}
