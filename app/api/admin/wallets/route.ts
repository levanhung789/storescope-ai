import { NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "storescope-admin-2026";

export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-token") !== ADMIN_TOKEN)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const client  = initiateDeveloperControlledWalletsClient({
      apiKey: process.env.CIRCLE_API_KEY!, entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
    });
    const res     = await client.listWallets({ pageSize: 50 });
    const wallets = res.data?.wallets ?? [];

    const withBalance = await Promise.all(
      wallets.map(async w => {
        const b = await client.getWalletTokenBalance({ id: w.id }).catch(() => null);
        const tokens = b?.data?.tokenBalances ?? [];
        const usdc = tokens.find((t: { token?: { symbol?: string }; amount?: string }) =>
          t.token?.symbol?.toUpperCase() === "USDC"
        );
        return {
          id:       w.id,
          address:  w.address,
          refId:    w.refId,
          state:    w.state,
          usdc:     Number((usdc as { amount?: string } | undefined)?.amount ?? 0).toFixed(2),
          createDate: w.createDate,
        };
      })
    );

    // Sort by USDC desc
    withBalance.sort((a, b) => Number(b.usdc) - Number(a.usdc));

    return NextResponse.json({ wallets: withBalance, total: withBalance.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
