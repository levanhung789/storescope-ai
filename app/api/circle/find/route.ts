import { NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

// GET /api/circle/find?address=0x...
// Tim walletId tuong ung voi mot dia chi vi tren ARC-TESTNET
export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    if (!address) return NextResponse.json({ error: "address is required" }, { status: 400 });

    const apiKey       = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
    if (!apiKey || !entitySecret) {
      return NextResponse.json({ error: "Circle not configured" }, { status: 503 });
    }

    const client = initiateDeveloperControlledWalletsClient({ apiKey, entitySecret });
    const target = address.toLowerCase();

    // Lay danh sach tat ca wallets (toi da 50)
    const res     = await client.listWallets({ pageSize: 50 });
    const wallets = res.data?.wallets ?? [];

    const match = wallets.find(w => w.address?.toLowerCase() === target);

    if (!match) {
      return NextResponse.json({
        found:   false,
        message: "Address not found in Circle wallets. This may be a MetaMask or external wallet.",
        total:   wallets.length,
      });
    }

    return NextResponse.json({
      found:         true,
      walletId:      match.id,
      walletAddress: match.address,
      refId:         match.refId,
      state:         match.state,
      blockchain:    match.blockchain,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
