// Vision Agent — Core Types

export interface Detection {
  brand:      string;
  company:    string;
  product:    string;
  sector:     string;
  confidence: number;
  price_vnd:  number | null;
  verified?:  boolean; // marked correct by human
}

export interface ShelfShare {
  brand: string;
  pct:   number;
}

export interface ImageQuality {
  score:  number;  // 0-100
  issues: string[];
}

export interface AnalysisResult {
  id:             string;  // unique analysis ID
  imageHash:      string;  // SHA256 of image for dedup
  detections:     Detection[];
  shelfShare:     ShelfShare[];
  imageQuality:   ImageQuality;
  recommendations: string[];
  stockRisks:     string[];
  rawSummary:     string;
  model:          string;
  createdAt:      number;
  feedbackScore?: number;   // 1-5 stars from user
  feedbackNotes?: string;
  isTrainingExample: boolean;
}

export interface AgentMemory {
  analyses:         AnalysisResult[];    // all past analyses
  trainingExamples: TrainingExample[];   // curated examples for few-shot
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
  imageBase64: string;   // stored for few-shot prompting
  result:      AnalysisResult;
  addedAt:     number;
  quality:     "excellent" | "good";  // only high-quality examples
}

export interface FeedbackPayload {
  analysisId:  string;
  score:       number;   // 1-5
  notes?:      string;
  corrections?: {
    brand: string;
    isCorrect: boolean;
    actualBrand?: string;
  }[];
  saveAsExample?: boolean;
}

export interface AgentStats {
  totalAnalyses:    number;
  avgScore:         number;
  trainingExamples: number;
  topBrands:        { brand: string; count: number }[];
  recentAnalyses:   { id: string; createdAt: number; score?: number; summary: string }[];
  modelVersion:     string;
}
