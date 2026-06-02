import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { prompt, style, size } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Build enhanced prompt for website backgrounds
    const styleMap: Record<string, string> = {
      abstract:   "abstract digital art background, smooth flowing shapes, depth",
      gradient:   "smooth gradient background, professional, minimalist, no text",
      geometric:  "geometric pattern background, clean lines, modern design",
      dark:       "dark dramatic background, deep colors, atmospheric, cinematic",
      tech:       "technology background, circuit patterns, digital grid, futuristic",
      fmcg:       "retail store shelf background, FMCG products, soft focus, professional",
      minimal:    "clean minimal background, subtle texture, white space, professional",
      neon:       "neon glow background, dark base, vibrant accent colors, tech vibe",
    };

    const styleHint = styleMap[style] ?? styleMap.abstract;
    const fullPrompt = `${prompt}. Style: ${styleHint}. High quality, website hero background image, no text, no watermarks, photorealistic or artistic, 4K quality.`;

    const dalleSize = size === "wide" ? "1792x1024" : size === "square" ? "1024x1024" : "1024x1024";

    const response = await openai.images.generate({
      model:   "dall-e-3",
      prompt:  fullPrompt,
      n:       1,
      size:    dalleSize as "1024x1024" | "1792x1024" | "1024x1792",
      quality: "standard",
    });

    const imageData = response.data ?? [];
    const imageUrl = imageData[0]?.url;
    if (!imageUrl) return NextResponse.json({ error: "No image generated" }, { status: 500 });

    return NextResponse.json({ url: imageUrl, revisedPrompt: imageData[0]?.revised_prompt });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
