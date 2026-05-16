/**
 * GET /api/contracts/layouts
 * Fetch all minted layouts from RetailLayoutNFT on ARC Testnet
 */
import { NextResponse } from "next/server";
import { publicClient, CONTRACTS } from "../../../_lib/contracts";

const NFT_ABI = [
  {
    name: "totalMinted",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getLayoutInfo",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "tokenOwner",    type: "address" },
      { name: "uri",          type: "string"  },
      { name: "_name",        type: "string"  },
      { name: "price",        type: "uint256" },
      { name: "_forSale",     type: "bool"    },
      { name: "creator",      type: "address" },
    ],
  },
] as const;

export type LayoutListing = {
  tokenId:   number;
  title:     string;
  owner:     string;
  creator:   string;
  price:     string;      // USDC display
  priceRaw:  string;      // micro-units
  forSale:   boolean;
  uri:       string;
  metadata?: {
    name?: string;
    description?: string;
    salePrice?: string;
    createdAt?: string;
  };
  contract:  string;
  arcScan:   string;
};

export async function GET() {
  try {
    // Get total minted count
    const total = await publicClient.readContract({
      address:      CONTRACTS.RETAIL_LAYOUT_NFT,
      abi:          NFT_ABI,
      functionName: "totalMinted",
    }) as bigint;

    const count = Number(total);
    if (count === 0) {
      return NextResponse.json({ layouts: [], total: 0 });
    }

    // Fetch all tokens (max 50)
    const fetches = Array.from({ length: Math.min(count, 50) }, (_, i) =>
      publicClient.readContract({
        address:      CONTRACTS.RETAIL_LAYOUT_NFT,
        abi:          NFT_ABI,
        functionName: "getLayoutInfo",
        args:         [BigInt(i)],
      }).catch(() => null)
    );

    const results = await Promise.all(fetches);
    const layouts: LayoutListing[] = [];

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (!r) continue;

      const [owner, uri, name, price, forSale, creator] = r as [string, string, string, bigint, boolean, string];

      // Parse metadata from data URI or skip
      let metadata: LayoutListing["metadata"] = {};
      try {
        if (uri.startsWith("data:application/json")) {
          const json = decodeURIComponent(uri.split(",")[1] ?? "{}");
          metadata = JSON.parse(json);
        }
      } catch { /* keep empty */ }

      // price is in USDC micro-units (6 decimals)
      const priceUsdc = (Number(price) / 1_000_000).toFixed(2);

      layouts.push({
        tokenId:  i,
        title:    name || metadata?.name || `Layout #${i}`,
        owner,
        creator,
        price:    priceUsdc,
        priceRaw: price.toString(),
        forSale,
        uri,
        metadata,
        contract: CONTRACTS.RETAIL_LAYOUT_NFT,
        arcScan:  `https://testnet.arcscan.app/address/${CONTRACTS.RETAIL_LAYOUT_NFT}`,
      });
    }

    // Show for-sale first, then others
    layouts.sort((a, b) => (b.forSale ? 1 : 0) - (a.forSale ? 1 : 0));

    return NextResponse.json({ layouts, total: count });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg, layouts: [], total: 0 }, { status: 500 });
  }
}
