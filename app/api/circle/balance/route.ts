import { NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const ARC_RPC      = "https://rpc.testnet.arc.network";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
// balanceOf(address) selector = 0x70a08231
const BALANCE_OF   = "0x70a08231";

// Query USDC balance truc tiep tu ARC Testnet RPC
async function queryArcBalance(walletAddress: string): Promise<string> {
  const addr = walletAddress.replace("0x", "").toLowerCase().padStart(64, "0");
  const data = BALANCE_OF + addr;

  const body = JSON.stringify({
    jsonrpc: "2.0", id: 1, method: "eth_call",
    params: [{ to: USDC_ADDRESS, data }, "latest"],
  });

  const res = await fetch(ARC_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal: AbortSignal.timeout(5000),
  });

  const json = await res.json() as { result?: string };
  const hex  = json.result ?? "0x0";
  // USDC = 6 decimals
  const raw  = BigInt(hex === "0x" ? "0" : hex);
  const usdc = (Number(raw) / 1_000_000).toFixed(2);
  return usdc;
}

function isConfigured() {
  return !!(process.env.CIRCLE_API_KEY && process.env.CIRCLE_ENTITY_SECRET);
}

function getClient() {
  return initiateDeveloperControlledWalletsClient({
    apiKey:       process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  });
}

// GET /api/circle/balance?walletId=xxx&address=0x...
export async function GET(req: NextRequest) {
  try {
    const walletId      = req.nextUrl.searchParams.get("walletId");
    const walletAddress = req.nextUrl.searchParams.get("address");

    if (!walletId && !walletAddress) {
      return NextResponse.json({ error: "walletId or address is required" }, { status: 400 });
    }

    // Demo mode
    if (!isConfigured() || walletId?.startsWith("demo-")) {
      // Demo mode: thu query ARC RPC neu co address
      if (walletAddress) {
        const usdc = await queryArcBalance(walletAddress).catch(() => "0.00");
        return NextResponse.json({ usdc, usdcRaw: "0", mode: "arc-rpc" });
      }
      return NextResponse.json({ usdc: "0.00", usdcRaw: "0", mode: "demo" });
    }

    // Thu Circle API truoc (chi hoat dong voi Circle-managed wallets)
    if (walletId && !walletId.startsWith("demo-")) {
      const client = getClient();
      const res    = await client.getWalletTokenBalance({ id: walletId });
      const balances = res.data?.tokenBalances ?? [];

      const usdc = balances.find(
        (b) => b.token?.symbol?.toUpperCase() === "USDC" || b.token?.name?.toLowerCase().includes("usdc")
      );

      // Circle tra ve amount da o dang hien thi (vi du "20" = 20 USDC)
      // KHONG chia them cho 1,000,000
      const circleAmount = Number(usdc?.amount ?? "0");

      // Neu Circle biet ve balance nay, tra ve ngay
      if (circleAmount > 0 || !walletAddress) {
        return NextResponse.json({
          usdc:        circleAmount.toFixed(2),
          usdcRaw:     usdc?.amount ?? "0",
          tokenId:     usdc?.token?.id ?? null,
          allBalances: balances.map((b) => ({ symbol: b.token?.symbol, amount: b.amount })),
          mode:        "circle",
        });
      }
    }

    // Fallback: Query truc tiep ARC Testnet RPC theo dia chi vi
    if (walletAddress) {
      const usdc = await queryArcBalance(walletAddress);
      return NextResponse.json({
        usdc,
        usdcRaw:  String(Math.round(Number(usdc) * 1_000_000)),
        tokenId:  null,
        mode:     "arc-rpc",
      });
    }

    return NextResponse.json({ usdc: "0.00", usdcRaw: "0", mode: "empty" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
