// Vision Agent Memory — stores analyses, feedback, training examples
// Uses global in-memory store (persists across hot reloads in dev)
// Production: replace with Vercel KV or database

import type { AgentMemory, PipelineResult, TrainingExample, FeedbackPayload } from "./types";
type AnalysisResult = PipelineResult;

const DEFAULT_MEMORY: AgentMemory = {
  analyses: [],
  trainingExamples: [],
  stats: { totalAnalyses: 0, avgFeedbackScore: 0, topBrands: [], lastUpdated: Date.now() },
};

const g = globalThis as typeof globalThis & { __visionAgentMemory?: AgentMemory };
if (!g.__visionAgentMemory) g.__visionAgentMemory = DEFAULT_MEMORY;

function mem(): AgentMemory {
  return g.__visionAgentMemory!;
}

// ── Save analysis ──────────────────────────────────────────────────────────────
export function saveAnalysis(result: AnalysisResult): void {
  const m = mem();
  // Remove old entry if same imageHash exists
  const idx = m.analyses.findIndex(a => a.id === result.id);
  if (idx >= 0) m.analyses[idx] = result;
  else m.analyses.unshift(result);

  // Keep last 200 analyses
  if (m.analyses.length > 200) m.analyses = m.analyses.slice(0, 200);

  updateStats();
}

// ── Apply feedback ─────────────────────────────────────────────────────────────
export function applyFeedback(payload: FeedbackPayload): AnalysisResult | null {
  const m = mem();
  const analysis = m.analyses.find(a => a.id === payload.analysisId);
  if (!analysis) return null;

  analysis.feedbackScore = payload.score;
  analysis.feedbackNotes = payload.notes;

  // Note: corrections on PipelineResult apply to step3_skus (legacy field removed)

  // Auto-save as training example if score >= 4 or explicitly requested
  if ((payload.score >= 4 || payload.saveAsExample) && (analysis.step1_quality?.score ?? 80) >= 70) {
    saveTrainingExample(analysis);
  }

  updateStats();
  return analysis;
}

// ── Training examples ──────────────────────────────────────────────────────────
export function saveTrainingExample(analysis: AnalysisResult, imageBase64?: string): void {
  const m = mem();
  const exists = m.trainingExamples.some(e => e.imageHash === analysis.imageHash);
  if (exists) return;

  const example: TrainingExample = {
    id:          analysis.id,
    imageHash:   analysis.imageHash,
    imageBase64: imageBase64 ?? "",
    result:      analysis,
    addedAt:     Date.now(),
    quality:     analysis.feedbackScore && analysis.feedbackScore >= 5 ? "excellent" : "good",
  };

  m.trainingExamples.unshift(example);
  // Keep best 20 examples (prioritize excellent)
  m.trainingExamples.sort((a, b) => {
    if (a.quality === "excellent" && b.quality !== "excellent") return -1;
    if (b.quality === "excellent" && a.quality !== "excellent") return 1;
    return b.addedAt - a.addedAt;
  });
  if (m.trainingExamples.length > 20) m.trainingExamples = m.trainingExamples.slice(0, 20);
}

// ── Get best examples for few-shot prompting ───────────────────────────────────
export function getBestExamples(limit = 3): TrainingExample[] {
  return mem().trainingExamples.slice(0, limit);
}

// ── Get analysis by ID ─────────────────────────────────────────────────────────
export function getAnalysis(id: string): AnalysisResult | null {
  return mem().analyses.find(a => a.id === id) ?? null;
}

// ── Get all analyses ───────────────────────────────────────────────────────────
export function getAllAnalyses(): AnalysisResult[] {
  return mem().analyses;
}

// ── Get all training examples ──────────────────────────────────────────────────
export function getAllExamples(): TrainingExample[] {
  return mem().trainingExamples;
}

// ── Delete training example ────────────────────────────────────────────────────
export function deleteExample(id: string): void {
  const m = mem();
  m.trainingExamples = m.trainingExamples.filter(e => e.id !== id);
}

// ── Stats ──────────────────────────────────────────────────────────────────────
function updateStats(): void {
  const m = mem();
  const scored = m.analyses.filter(a => a.feedbackScore);
  const avgScore = scored.length
    ? scored.reduce((s, a) => s + (a.feedbackScore ?? 0), 0) / scored.length
    : 0;

  const brandCount: Record<string, number> = {};
  m.analyses.forEach(a => {
    (a.step3_skus ?? []).forEach(d => {
      brandCount[d.brand] = (brandCount[d.brand] ?? 0) + 1;
    });
  });
  const topBrands = Object.entries(brandCount)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  m.stats = {
    totalAnalyses:    m.analyses.length,
    avgFeedbackScore: Math.round(avgScore * 10) / 10,
    topBrands,
    lastUpdated:      Date.now(),
  };
}

export function getStats() {
  return mem().stats;
}
