import { NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { createHash, randomUUID as crypto_randomUUID } from "crypto";
const crypto = { randomUUID: crypto_randomUUID };

function isConfigured() {
  return !!(process.env.CIRCLE_API_KEY && process.env.CIRCLE_ENTITY_SECRET);
}

function getClient() {
  return initiateDeveloperControlledWalletsClient({
    apiKey:       process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  });
}

function demoTxHash(seed: string) {
  return "0x" + createHash("sha256").update(`demo-tx-${seed}-${Date.now()}`).digest("hex");
}

// POST /api/circle/transfer
// Body: { walletId, destinationAddress, amount, taskName }
export async function POST(req: NextRequest) {
  try {
    const { walletId, destinationAddress, amount, taskName } = await req.json();

    if (!walletId || !destinationAddress || !amount) {
      return NextResponse.json(
        { error: "Missing walletId, destinationAddress, or amount" },
        { status: 400 }
      );
    }

    // Demo mode
    if (!isConfigured() || walletId.startsWith("demo-")) {
      return NextResponse.json({
        txId:     `demo-tx-${Date.now()}`,
        txHash:   demoTxHash(`${walletId}-${taskName}`),
        state:    "CONFIRMED",
        amount,
        taskName,
        mode:     "demo",
      });
    }

    const client = getClient();

    // ARC-TESTNET USDC tokenId (Circle internal UUID, da xac nhan)
    const ARC_USDC_TOKEN_ID = "15dc2b5d-0994-58b0-bf8c-3a0501148ee8";

    // Kiem tra balance truoc khi transfer
    const balRes  = await client.getWalletTokenBalance({ id: walletId });
    const balances = balRes.data?.tokenBalances ?? [];

    const usdcBalance = balances.find(
      (b) =>
        b.token?.symbol?.toUpperCase() === "USDC" ||
        b.token?.id === ARC_USDC_TOKEN_ID
    );

    const usdcAmount = Number(usdcBalance?.amount ?? 0);

    if (usdcAmount < Number(amount)) {
      return NextResponse.json(
        {
          error: `Insufficient USDC. Wallet has ${usdcAmount} USDC, need ${amount} USDC.`,
          balance: usdcAmount,
          required: Number(amount),
          action: "fund_wallet",
          faucet: "https://faucet.circle.com",
          walletId,
        },
        { status: 402 }
      );
    }

    const tokenId = usdcBalance?.token?.id ?? ARC_USDC_TOKEN_ID;

    // Tao giao dich USDC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txRes = await (client.createTransaction as any)({
      walletId,
      tokenId,
      destinationAddress,
      amounts:        [amount],
      fee:            { type: "level", config: { feeLevel: "LOW" } },
      idempotencyKey: crypto.randomUUID(),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txData: any = txRes?.data ?? txRes;
    if (!txData?.id) {
      throw new Error("Failed to create transaction: " + JSON.stringify(txData));
    }

    return NextResponse.json({
      txId:     txData.id,
      txHash:   txData.txHash ?? txData.transactionHash ?? null,
      state:    txData.state ?? "INITIATED",
      amount,
      taskName,
      tokenId,
      mode:     "live",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET /api/circle/transfer?txId=xxx
export async function GET(req: NextRequest) {
  try {
    const txId = req.nextUrl.searchParams.get("txId");
    if (!txId) return NextResponse.json({ error: "txId is required" }, { status: 400 });

    if (!isConfigured() || txId.startsWith("demo-")) {
      return NextResponse.json({
        txId,
        txHash: "0x" + createHash("sha256").update(txId).digest("hex"),
        state:  "CONFIRMED",
        mode:   "demo",
      });
    }

    const client = getClient();
    const res = await client.getTransaction({ id: txId });
    const tx  = res.data?.transaction;
    if (!tx) throw new Error("Transaction not found");

    return NextResponse.json({
      txId:   tx.id,
      txHash: tx.txHash ?? null,
      state:  tx.state,
      mode:   "live",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
