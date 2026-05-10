import { NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { createHash } from "crypto";

// ── Helpers ───────────────────────────────────────────────────────────────────

function isConfigured() {
  return !!(process.env.CIRCLE_API_KEY && process.env.CIRCLE_ENTITY_SECRET);
}

function getClient() {
  return initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  });
}

// Generate a deterministic demo wallet address from userId
function demoBuild(userId: string) {
  const hash = createHash("sha256").update(`circle-demo-${userId}`).digest("hex");
  const address = "0x" + hash.slice(0, 40);
  return {
    walletId:      `demo-${hash.slice(0, 16)}`,
    walletAddress: address,
    walletSetId:   "demo-set-0000",
    userId,
    isDemo:        true,
  };
}

// ── POST /api/circle/wallet — create or retrieve wallet for userId ─────────────
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    // Demo mode: Circle API keys not configured
    if (!isConfigured()) {
      return NextResponse.json({ ...demoBuild(userId), mode: "demo" });
    }

    const client = getClient();

    // Kiem tra neu da co wallet cho userId nay (tranh tao trung)
    const existing = await client.listWallets({ pageSize: 50 });
    const allWallets = existing.data?.wallets ?? [];
    const existingWallet = allWallets.find(
      w => w.refId === userId && w.blockchain === "ARC-TESTNET" && w.state === "LIVE"
    );

    if (existingWallet) {
      // Tra ve wallet cu co san — uu tien wallet co balance
      const withBalance = await Promise.all(
        allWallets
          .filter(w => w.refId === userId && w.blockchain === "ARC-TESTNET" && w.state === "LIVE")
          .map(async w => {
            const b = await client.getWalletTokenBalance({ id: w.id }).catch(() => null);
            const usdc = b?.data?.tokenBalances?.find(t =>
              t.token?.symbol?.toUpperCase() === "USDC"
            );
            return { wallet: w, usdcAmount: Number(usdc?.amount ?? 0) };
          })
      );
      // Uu tien wallet co nhieu USDC nhat
      withBalance.sort((a, b) => b.usdcAmount - a.usdcAmount);
      const best = withBalance[0].wallet;

      return NextResponse.json({
        walletId:      best.id,
        walletAddress: best.address,
        walletSetId:   best.walletSetId ?? process.env.CIRCLE_WALLET_SET_ID ?? "",
        userId,
        mode:          "live",
        reused:        true,
      });
    }

    // Tao wallet moi neu chua co
    let walletSetId = process.env.CIRCLE_WALLET_SET_ID;
    if (!walletSetId) {
      const wsRes = await client.createWalletSet({ name: "StoreScope AI" });
      walletSetId = wsRes.data?.walletSet?.id;
      if (!walletSetId) throw new Error("Failed to create wallet set");
    }

    const walletRes = await client.createWallets({
      walletSetId,
      blockchains: ["ARC-TESTNET"],
      count: 1,
      metadata: [{ name: `user-${userId}`, refId: userId }],
    });

    const wallet = walletRes.data?.wallets?.[0];
    if (!wallet) throw new Error("Failed to create wallet");

    return NextResponse.json({
      walletId:      wallet.id,
      walletAddress: wallet.address,
      walletSetId,
      userId,
      mode:          "live",
      reused:        false,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── GET /api/circle/wallet?walletId=xxx ───────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const walletId = req.nextUrl.searchParams.get("walletId");
    if (!walletId) return NextResponse.json({ error: "walletId is required" }, { status: 400 });

    if (!isConfigured() || walletId.startsWith("demo-")) {
      return NextResponse.json({
        walletId,
        walletAddress: "0x" + walletId.replace("demo-", "").padEnd(40, "0"),
        state:         "LIVE",
        blockchain:    "ARC-TESTNET",
        mode:          "demo",
      });
    }

    const client = getClient();
    const res = await client.getWallet({ id: walletId });
    const wallet = res.data?.wallet;
    if (!wallet) throw new Error("Wallet not found");

    return NextResponse.json({
      walletId:      wallet.id,
      walletAddress: wallet.address,
      state:         wallet.state,
      blockchain:    wallet.blockchain,
      mode:          "live",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
