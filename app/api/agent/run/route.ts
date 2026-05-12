/**
 * Circle Agent Stack — Autonomous agent run endpoint
 * Validates policy, then calls /api/agent/analyze
 */
import { NextRequest, NextResponse } from "next/server";

// POST /api/agent/run
// Body: { walletId, imageBase64?, ocrText?, policy }
export async function POST(req: NextRequest) {
  try {
    const {
      walletId,
      imageBase64,
      ocrText,
      policy,
    } = await req.json() as {
      walletId:     string;
      imageBase64?: string;
      ocrText?:     string;
      policy:       { maxPerTx: number; maxPerDay: number; spentToday: number };
    };

    if (!walletId) {
      return NextResponse.json({ error: "walletId required" }, { status: 400 });
    }

    // Validate policy server-side
    const PRICE = 0.025;
    if (PRICE > policy.maxPerTx) {
      return NextResponse.json({ error: `Exceeds per-tx limit ($${policy.maxPerTx} USDC)` }, { status: 403 });
    }
    if (policy.spentToday + PRICE > policy.maxPerDay) {
      return NextResponse.json({
        error: `Daily limit reached. Spent: $${policy.spentToday.toFixed(3)} / $${policy.maxPerDay} USDC`,
      }, { status: 403 });
    }

    // Call x402-protected analyze endpoint
    const analyzeRes = await fetch(new URL("/api/agent/analyze", req.url).toString(), {
      method:  "POST",
      headers: {
        "Content-Type":        "application/json",
        "X-Agent-Wallet-Id":   walletId,
      },
      body: JSON.stringify({ image: imageBase64, ocrText }),
    });

    const data = await analyzeRes.json();

    if (!analyzeRes.ok) {
      return NextResponse.json({ error: data.error ?? "Agent run failed" }, { status: analyzeRes.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
