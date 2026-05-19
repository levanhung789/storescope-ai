import { NextRequest, NextResponse } from "next/server";
import { applyFeedback } from "../../../../lib/vision-agent/memory";
import type { FeedbackPayload } from "../../../../lib/vision-agent/types";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json() as FeedbackPayload;
    if (!payload.analysisId || !payload.score) {
      return NextResponse.json({ error: "analysisId and score required" }, { status: 400 });
    }
    const updated = applyFeedback(payload);
    if (!updated) return NextResponse.json({ error: "Analysis not found" }, { status: 404 });

    return NextResponse.json({
      success:         true,
      analysisId:      updated.id,
      feedbackScore:   updated.feedbackScore,
      savedAsExample:  updated.isTrainingExample,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
