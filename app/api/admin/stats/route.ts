/**
 * GET /api/admin/stats
 * Admin-only: tổng hợp dữ liệu toàn hệ thống
 */
import { NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { publicClient, CONTRACTS } from "../../../_lib/contracts";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "storescope-admin-2026";

function auth(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  return token === ADMIN_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const results = await Promise.allSettled([
      // Tong analyses on-chain
      publicClient.readContract({
        address:      CONTRACTS.ANALYSIS_REGISTRY,
        abi:          [{ name: "totalAnalyses", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] }],
        functionName: "totalAnalyses",
      }),
      // Danh sach Circle wallets
      (() => {
        const client = initiateDeveloperControlledWalletsClient({
          apiKey: process.env.CIRCLE_API_KEY!,
          entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
        });
        return client.listWallets({ pageSize: 50 });
      })(),
      // Block hien tai
      publicClient.getBlockNumber(),
    ]);

    const totalAnalyses = results[0].status === "fulfilled" ? Number(results[0].value) : 0;
    const walletsRes    = results[1].status === "fulfilled" ? results[1].value : null;
    const wallets       = (walletsRes as { data?: { wallets?: unknown[] } })?.data?.wallets ?? [];
    const blockNumber   = results[2].status === "fulfilled" ? Number(results[2].value) : 0;

    // USDC balance tren tat ca wallets
    let totalUSDC = 0;
    const client2 = initiateDeveloperControlledWalletsClient({
      apiKey: process.env.CIRCLE_API_KEY!,
      entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
    });
    const balances = await Promise.allSettled(
      (wallets as { id: string }[]).map(w =>
        client2.getWalletTokenBalance({ id: w.id })
          .then(r => r.data?.tokenBalances ?? [])
          .catch(() => [])
      )
    );
    for (const b of balances) {
      if (b.status === "fulfilled") {
        for (const token of b.value as { token?: { symbol?: string }; amount?: string }[]) {
          if (token.token?.symbol?.toUpperCase() === "USDC") {
            totalUSDC += Number(token.amount ?? 0);
          }
        }
      }
    }

    return NextResponse.json({
      totalAnalyses,
      totalWallets:  wallets.length,
      totalUSDC:     totalUSDC.toFixed(2),
      blockNumber,
      contracts: {
        analysisRegistry: CONTRACTS.ANALYSIS_REGISTRY,
        paymentVerifier:  CONTRACTS.PAYMENT_VERIFIER,
        retailLayoutNFT:  CONTRACTS.RETAIL_LAYOUT_NFT,
        identityRegistry: CONTRACTS.IDENTITY_REGISTRY,
      },
      agentId: process.env.ARC_AGENT_ID ?? "9393",
      serviceWallet: process.env.SERVICE_WALLET ?? process.env.DEPLOYER_ADDRESS,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
