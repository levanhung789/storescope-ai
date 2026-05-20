import { NextRequest, NextResponse } from "next/server";
import { getAllExamples, deleteExample, saveTrainingExample, getAnalysis } from "../../../../lib/vision-agent/memory";

// GET — list training examples
export async function GET() {
  const examples = getAllExamples().map(e => ({
    id:        e.id,
    imageHash: e.imageHash,
    quality:   e.quality,
    addedAt:   e.addedAt,
    brands:    (e.result.step3_skus ?? []).map((s: {brand: string}) => s.brand),
    score:     e.result.feedbackScore,
    summary:   (e.result.summary ?? "").slice(0, 120),
  }));
  return NextResponse.json({ examples });
}

// POST — manually add analysis as training example
export async function POST(req: NextRequest) {
  try {
    const { analysisId } = await req.json() as { analysisId: string };
    const analysis = getAnalysis(analysisId);
    if (!analysis) return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    saveTrainingExample(analysis);
    return NextResponse.json({ success: true, message: "Added as training example" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE — remove training example
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json() as { id: string };
    deleteExample(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
