/**
 * Circle Agent Stack — x402-style protected analysis endpoint
 *
 * Flow:
 *  1. Agent sends request with X-Agent-Wallet-Id header
 *  2. Server verifies Circle Wallet has enough USDC
 *  3. Server deducts $0.025 USDC via Circle transfer
 *  4. Server runs shelf analysis and returns results
 *
 * Returns 402 Payment Required if wallet has insufficient funds.
 */
import { NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { createHash, randomUUID } from "crypto";

const ANALYSIS_PRICE    = 0.025; // USDC
const SERVICE_WALLET    = process.env.SERVICE_WALLET ?? "0x1234567890123456789012345678901234567890";
const ARC_USDC_TOKEN_ID = "15dc2b5d-0994-58b0-bf8c-3a0501148ee8";

function getCircleClient() {
  return initiateDeveloperControlledWalletsClient({
    apiKey:       process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  });
}

// ── 402 Payment Required response (x402 protocol) ─────────────────────────
function paymentRequired(walletAddress?: string) {
  return NextResponse.json(
    {
      error:   "Payment Required",
      version: "x402-circle/1.0",
      accepts: {
        scheme:    "circle-arc",
        price:     `$${ANALYSIS_PRICE}`,
        network:   "ARC-TESTNET",
        payTo:     SERVICE_WALLET,
        tokenId:   ARC_USDC_TOKEN_ID,
        currency:  "USDC",
      },
      message: "Send X-Agent-Wallet-Id header with a funded Circle Wallet to access this endpoint.",
      ...(walletAddress && { walletAddress }),
    },
    {
      status:  402,
      headers: {
        "X-402-Version":  "1.0",
        "X-402-Scheme":   "circle-arc",
        "X-402-Price":    String(ANALYSIS_PRICE),
        "X-402-Network":  "ARC-TESTNET",
        "X-402-Pay-To":   SERVICE_WALLET,
      },
    }
  );
}

// ── POST /api/agent/analyze ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const walletId = req.headers.get("x-agent-wallet-id");
    if (!walletId) return paymentRequired();

    if (!process.env.CIRCLE_API_KEY || !process.env.CIRCLE_ENTITY_SECRET) {
      return NextResponse.json({ error: "Circle not configured" }, { status: 503 });
    }

    const client = getCircleClient();

    // 1. Verify balance
    const balRes   = await client.getWalletTokenBalance({ id: walletId });
    const balances = balRes.data?.tokenBalances ?? [];
    const usdc     = balances.find(b =>
      b.token?.symbol?.toUpperCase() === "USDC" || b.token?.id === ARC_USDC_TOKEN_ID
    );
    const balance  = Number(usdc?.amount ?? 0);

    if (balance < ANALYSIS_PRICE) {
      const walletRes = await client.getWallet({ id: walletId }).catch(() => null);
      return paymentRequired(walletRes?.data?.wallet?.address ?? undefined);
    }

    const tokenId = usdc?.token?.id ?? ARC_USDC_TOKEN_ID;

    // 2. Deduct payment via Circle transfer (x402 settle)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txRes = await (client.createTransaction as any)({
      walletId,
      tokenId,
      destinationAddress: SERVICE_WALLET,
      amounts:            [String(ANALYSIS_PRICE)],
      fee:                { type: "level", config: { feeLevel: "LOW" } },
      idempotencyKey:     randomUUID(),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tx: any = txRes?.data ?? txRes;
    if (!tx?.id) {
      return NextResponse.json({ error: "Payment failed: " + JSON.stringify(tx) }, { status: 402 });
    }

    // 3. Parse request body (image data + OCR)
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const imageBase64 = body.image as string | undefined;
    const ocrText     = body.ocrText as string | undefined;

    // 4. Call analysis (reuse existing /api/analyze logic)
    let analysisResult: Record<string, unknown> = {};
    if (imageBase64 || ocrText) {
      const analyzeRes = await fetch(new URL("/api/analyze", req.url).toString(), {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ image: imageBase64, ocrText }),
      }).catch(() => null);
      if (analyzeRes?.ok) {
        analysisResult = await analyzeRes.json();
      }
    }

    // 5. Return x402 settlement + results
    return NextResponse.json(
      {
        payment: {
          settled:  true,
          txId:     tx.id,
          txHash:   tx.txHash ?? null,
          amount:   ANALYSIS_PRICE,
          currency: "USDC",
          network:  "ARC-TESTNET",
        },
        analysis: analysisResult,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "X-Payment-Response": createHash("sha256").update(tx.id).digest("hex"),
          "X-402-Settled":      "true",
        },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── GET /api/agent/analyze — return payment requirements ──────────────────
export async function GET() {
  return paymentRequired();
}
