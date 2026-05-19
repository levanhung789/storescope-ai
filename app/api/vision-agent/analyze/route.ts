import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "../../../../lib/vision-agent/agent";

export async function POST(req: NextRequest) {
  try {
    const form      = await req.formData();
    const file      = form.get("image") as File | null;
    const saveEx    = form.get("saveExample") === "true";

    if (!file) return NextResponse.json({ error: "No image" }, { status: 400 });

    const bytes    = await file.arrayBuffer();
    const base64   = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const result = await analyzeImage(base64, mimeType, saveEx);

    return NextResponse.json({ success: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
