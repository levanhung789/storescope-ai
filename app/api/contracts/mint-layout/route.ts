/**
 * POST /api/contracts/mint-layout
 * Mint a RetailLayout NFT via Circle Wallet payment + on-chain mint
 */
import { NextRequest, NextResponse } from "next/server";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { randomUUID } from "crypto";
import { getDeployerWallet, CONTRACTS } from "../../../_lib/contracts";

const MINT_PRICE     = "0.20"; // USDC — mint + listing fee
const USDC_TOKEN_ID  = "15dc2b5d-0994-58b0-bf8c-3a0501148ee8";
const SERVICE_WALLET = process.env.SERVICE_WALLET ?? process.env.DEPLOYER_ADDRESS ?? "0x68e51fb0A433caBe0d4f17AEe537676d925Cb35c";

const NFT_ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to",     type: "address" },
      { name: "uri",    type: "string"  },
      { name: "_name",  type: "string"  },
      { name: "_price", type: "uint256" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
] as const;

export async function POST(req: NextRequest) {
  try {
    const { walletId, walletAddress, title, description, salePrice } = await req.json() as {
      walletId:      string;
      walletAddress: string;
      title:         string;
      description?:  string;
      salePrice?:    string;
    };

    if (!walletId || !walletAddress || !title) {
      return NextResponse.json({ error: "walletId, walletAddress, title required" }, { status: 400 });
    }

    const circleClient = initiateDeveloperControlledWalletsClient({
      apiKey:       process.env.CIRCLE_API_KEY!,
      entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
    });

    // 1. Check USDC balance
    const balRes   = await circleClient.getWalletTokenBalance({ id: walletId });
    const balances = balRes.data?.tokenBalances ?? [];
    const usdc     = balances.find(b =>
      b.token?.symbol?.toUpperCase() === "USDC" || b.token?.id === USDC_TOKEN_ID
    );
    const balance  = Number(usdc?.amount ?? 0);

    if (balance < Number(MINT_PRICE)) {
      return NextResponse.json({
        error:    `Insufficient USDC. Have ${balance} USDC, need ${MINT_PRICE} USDC to mint.`,
        balance,
        required: Number(MINT_PRICE),
        faucet:   "https://faucet.circle.com",
      }, { status: 402 });
    }

    const tokenId = usdc?.token?.id ?? USDC_TOKEN_ID;

    // 2. Pay mint fee via Circle transfer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payRes = await (circleClient.createTransaction as any)({
      walletId,
      tokenId,
      destinationAddress: SERVICE_WALLET,
      amounts:            [MINT_PRICE],
      fee:                { type: "level", config: { feeLevel: "LOW" } },
      idempotencyKey:     randomUUID(),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payTx: any = payRes?.data ?? payRes;
    if (!payTx?.id) {
      throw new Error("Payment transaction failed");
    }

    // 3. Mint NFT on-chain via deployer wallet
    const deployerWallet  = getDeployerWallet();
    const salePriceUnits  = BigInt(Math.round(Number(salePrice ?? "5") * 1_000_000));
    const metadataUri     = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({
      name:        title,
      description: description ?? "",
      creator:     walletAddress,
      salePrice:   salePrice ?? "5.00",
      createdAt:   new Date().toISOString(),
    }))}`;

    const mintHash = await deployerWallet.writeContract({
      address:      CONTRACTS.RETAIL_LAYOUT_NFT,
      abi:          NFT_ABI,
      functionName: "mint",
      args: [
        walletAddress as `0x${string}`,
        metadataUri,
        title,
        salePriceUnits,
      ],
    });

    return NextResponse.json({
      success:      true,
      paymentTxId:  payTx.id,
      paymentTxHash: payTx.txHash ?? null,
      mintTxHash:   mintHash,
      explorerUrl:  `https://testnet.arcscan.app/tx/${mintHash}`,
      tokenAddress: CONTRACTS.RETAIL_LAYOUT_NFT,
      minter:       walletAddress,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
