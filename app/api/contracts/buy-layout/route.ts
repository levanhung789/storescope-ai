/**
 * POST /api/contracts/buy-layout
 * Buy a RetailLayout NFT: Circle USDC payment → recordSale() on-chain
 */
import { NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { randomUUID } from "crypto";
import { getDeployerWallet, CONTRACTS } from "../../../_lib/contracts";

const USDC_TOKEN_ID = "15dc2b5d-0994-58b0-bf8c-3a0501148ee8";

const NFT_ABI = [
  {
    name: "recordSale",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "buyer",   type: "address" },
    ],
    outputs: [],
  },
  {
    name: "getLayoutInfo",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "tokenOwner", type: "address" },
      { name: "uri",        type: "string"  },
      { name: "_name",      type: "string"  },
      { name: "price",      type: "uint256" },
      { name: "_forSale",   type: "bool"    },
      { name: "creator",    type: "address" },
    ],
  },
] as const;

export async function POST(req: NextRequest) {
  try {
    const { walletId, walletAddress, tokenId } = await req.json() as {
      walletId:      string;
      walletAddress: string;
      tokenId:       number;
    };

    if (!walletId || !walletAddress || tokenId === undefined) {
      return NextResponse.json({ error: "walletId, walletAddress, tokenId required" }, { status: 400 });
    }

    const { publicClient, getDeployerWallet: gw } = await import("../../../_lib/contracts");

    // 1. Get layout info (price + seller)
    const info = await publicClient.readContract({
      address:      CONTRACTS.RETAIL_LAYOUT_NFT,
      abi:          NFT_ABI,
      functionName: "getLayoutInfo",
      args:         [BigInt(tokenId)],
    }) as [string, string, string, bigint, boolean, string];

    const [owner, , title, price, forSale] = info;

    if (!forSale) {
      return NextResponse.json({ error: "Layout is not for sale" }, { status: 400 });
    }
    if (owner.toLowerCase() === walletAddress.toLowerCase()) {
      return NextResponse.json({ error: "You already own this layout" }, { status: 400 });
    }

    const priceUsdc = (Number(price) / 1_000_000).toFixed(6);

    // 2. Check buyer balance
    const circleClient = initiateDeveloperControlledWalletsClient({
      apiKey:       process.env.CIRCLE_API_KEY!,
      entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
    });

    const balRes   = await circleClient.getWalletTokenBalance({ id: walletId });
    const balances = balRes.data?.tokenBalances ?? [];
    const usdc     = balances.find(b =>
      b.token?.symbol?.toUpperCase() === "USDC" || b.token?.id === USDC_TOKEN_ID
    );
    const balance  = Number(usdc?.amount ?? 0);

    if (balance < Number(priceUsdc)) {
      return NextResponse.json({
        error:    `Insufficient USDC. Have ${balance} USDC, need ${priceUsdc} USDC`,
        balance,
        required: Number(priceUsdc),
        faucet:   "https://faucet.circle.com",
      }, { status: 402 });
    }

    const tokenIdCircle = usdc?.token?.id ?? USDC_TOKEN_ID;

    // 3. Transfer USDC from buyer to seller
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payRes = await (circleClient.createTransaction as any)({
      walletId,
      tokenId:            tokenIdCircle,
      destinationAddress: owner,
      amounts:            [priceUsdc],
      fee:                { type: "level", config: { feeLevel: "LOW" } },
      idempotencyKey:     randomUUID(),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payTx: any = payRes?.data ?? payRes;
    if (!payTx?.id) throw new Error("Payment failed");

    // 4. Record sale on-chain (transfer NFT to buyer)
    const deployer  = gw();
    const saleHash  = await deployer.writeContract({
      address:      CONTRACTS.RETAIL_LAYOUT_NFT,
      abi:          NFT_ABI,
      functionName: "recordSale",
      args:         [BigInt(tokenId), walletAddress as `0x${string}`],
    });

    return NextResponse.json({
      success:       true,
      tokenId,
      title,
      buyer:         walletAddress,
      seller:        owner,
      price:         priceUsdc,
      paymentTxId:   payTx.id,
      paymentTxHash: payTx.txHash ?? null,
      saleTxHash:    saleHash,
      explorerUrl:   `https://testnet.arcscan.app/tx/${saleHash}`,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
