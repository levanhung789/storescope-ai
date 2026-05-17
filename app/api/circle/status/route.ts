import { NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { getTx, setTx } from "../../../_lib/txStore";

function isConfigured() {
  return !!(process.env.CIRCLE_API_KEY && process.env.CIRCLE_ENTITY_SECRET);
}

// GET /api/circle/status?txId=xxx
// Checks in-memory store first (populated by webhook), falls back to Circle API.
export async function GET(req: NextRequest) {
  const txId = req.nextUrl.searchParams.get("txId");
  if (!txId) return NextResponse.json({ error: "txId required" }, { status: 400 });

  // Demo mode
  if (!isConfigured() || txId.startsWith("demo-")) {
    return NextResponse.json({ txId, txHash: null, state: "CONFIRMED", source: "demo" });
  }

  // Check webhook-populated store first (instant, no Circle API call)
  const cached = getTx(txId);
  if (cached) {
    return NextResponse.json({ ...cached, source: "webhook" });
  }

  // Fallback: query Circle API directly
  try {
    const client = initiateDeveloperControlledWalletsClient({
      apiKey:       process.env.CIRCLE_API_KEY!,
      entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
    });
    const res = await client.getTransaction({ id: txId });
    const tx  = res.data?.transaction;
    if (!tx) throw new Error("Transaction not found");

    const record = { txId: tx.id, txHash: tx.txHash ?? null, state: tx.state };
    // Cache it so next poll is instant
    setTx(txId, record);

    return NextResponse.json({ ...record, source: "api" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
