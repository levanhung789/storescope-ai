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

// Validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ── POST /api/circle/wallet — create or retrieve wallet for userId ─────────────
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    // Enforce email format — mỗi ví phải gắn với email hợp lệ
    const normalizedEmail = userId.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "A valid email address is required (e.g. name@gmail.com). Each email creates exactly one wallet." },
        { status: 400 }
      );
    }

    // Demo mode: Circle API keys not configured
    if (!isConfigured()) {
      return NextResponse.json({ ...demoBuild(normalizedEmail), mode: "demo", reused: false });
    }

    const client = getClient();

    // Enforce 1 email = 1 wallet: kiểm tra wallet đã tồn tại theo email (refId)
    const existing = await client.listWallets({ pageSize: 50 });
    const allWallets = existing.data?.wallets ?? [];
    const existingWallet = allWallets.find(
      w => w.refId === normalizedEmail && w.blockchain === "ARC-TESTNET" && w.state === "LIVE"
    );

    if (existingWallet) {
      // Trả về wallet cũ — 1 email chỉ có 1 wallet, ưu tiên wallet có balance
      const withBalance = await Promise.all(
        allWallets
          .filter(w => w.refId === normalizedEmail && w.blockchain === "ARC-TESTNET" && w.state === "LIVE")
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
        userId:        normalizedEmail,
        mode:          "live",
        reused:        true,  // wallet cũ — user đăng nhập lại
      });
    }

    // Tạo wallet mới — email này chưa có wallet
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
      metadata: [{ name: `user-${normalizedEmail}`, refId: normalizedEmail }],
    });

    const wallet = walletRes.data?.wallets?.[0];
    if (!wallet) throw new Error("Failed to create wallet");

    return NextResponse.json({
      walletId:      wallet.id,
      walletAddress: wallet.address,
      walletSetId,
      userId:        normalizedEmail,
      mode:          "live",
      reused:        false,  // wallet mới tạo
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
