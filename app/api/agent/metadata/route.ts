import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name:        "StoreScope AI Analysis Agent",
    description: "AI retail shelf analysis — SKU detection, brand distribution, competitor visibility. Powered by OCR + Roboflow on ARC Testnet.",
    version:     "1.0.0",
    capabilities: ["shelf-image-analysis","sku-detection","brand-recognition","competitor-analysis","stock-risk"],
    payment: { scheme: "circle-arc", price: "0.025", currency: "USDC", network: "ARC-TESTNET" },
    endpoints:   { analyze: "/api/agent/analyze", run: "/api/agent/run" },
    contracts: {
      analysisRegistry: "0x3974Ce11d3c656a8A0faB63BC498441D8a6423Bd",
      paymentVerifier:  "0xeC595fE964be09854B6F5fa5FED0a814dacD6AcC",
    },
    agentWallet:  "0xba6ddaad30da0a749a168d1a1b3952cdea68b4e4",
    blockchain:   "ARC-TESTNET",
    chainId:      5042002,
    external_url: "https://storescope-ai.vercel.app",
    tags:         ["retail","fmcg","ai","circle","arc"],
  });
}
