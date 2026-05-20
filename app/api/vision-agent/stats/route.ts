import { NextResponse } from "next/server";
import { getStats, getAllAnalyses, getAllExamples } from "../../../../lib/vision-agent/memory";
import { buildImprovementSummary } from "../../../../lib/vision-agent/prompt";

export async function GET() {
  const stats    = getStats();
  const analyses = getAllAnalyses();
  const examples = getAllExamples();

  const recentAnalyses = analyses.slice(0, 10).map(a => ({
    id:        a.id,
    createdAt: a.createdAt,
    score:     a.feedbackScore,
    summary:   (a.summary ?? "").slice(0, 100),
    brands:    a.step3_skus?.length ?? 0,
    quality:   a.step1_quality?.score ?? 0,
  }));

  return NextResponse.json({
    ...stats,
    trainingExamples:   examples.length,
    modelStatus:        buildImprovementSummary(examples.length, stats.avgFeedbackScore),
    recentAnalyses,
    exampleSummary:     examples.map(e => ({
      id:       e.id,
      quality:  e.quality,
      brands:   e.result.detections.length,
      score:    e.result.feedbackScore,
      addedAt:  e.addedAt,
    })),
  });
}
