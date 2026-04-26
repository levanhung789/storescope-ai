import { defineChain } from "viem";
import { createConfig, http } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";

// ARC Testnet chain definition
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
  },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
    public:  { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

// Contract addresses on ARC testnet
export const ARC_CONTRACTS = {
  USDC:          "0x3600000000000000000000000000000000000000" as `0x${string}`,
  EURC:          "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a" as `0x${string}`,
  Permit2:       "0x000000000022D473030F116dDEE9F6B43aC78BA3" as `0x${string}`,
  SERVICE_WALLET:"0x1234567890123456789012345678901234567890" as `0x${string}`, // storescope.ai receiving wallet
} as const;

// ARC USDC has 6 decimals (not 18 like ETH)
export const ARC_USDC_DECIMALS = 6;

// ── Analysis micro-task pricing (USDC per task) ──────────────────────────────
export const ANALYSIS_TASKS = [
  { id: "upload",       label: "Upload / Register image task",       price: 0.001, desc: "Record image task on-chain for tracking" },
  { id: "quality",      label: "Image quality check",                price: 0.001, desc: "Detect blur, low-light, wrong angle" },
  { id: "shelf_detect", label: "Shelf object detection",             price: 0.003, desc: "AI detects shelves, coolers, display stands" },
  { id: "sku_detect",   label: "SKU / product detection",            price: 0.004, desc: "AI identifies products, brands, SKUs" },
  { id: "competitor",   label: "Competitor visibility analysis",      price: 0.003, desc: "Compare company vs competitor shelf presence" },
  { id: "stock_risk",   label: "Stock risk analysis",                price: 0.002, desc: "Alert on out-of-stock or overstock conditions" },
  { id: "layout_sim",   label: "Store layout simulation update",     price: 0.004, desc: "Update store simulation from image data" },
  { id: "recommend",    label: "Recommendation generation",          price: 0.003, desc: "Suggest display, restocking, category optimization" },
  { id: "human_review", label: "Human review request",              price: 0.002, desc: "Flag tasks needing human confirmation (if uncertain)" },
  { id: "report",       label: "Final report / proof record",        price: 0.002, desc: "Generate report and write proof to ArcScan" },
] as const;

export type TaskId = (typeof ANALYSIS_TASKS)[number]["id"];

export const TOTAL_ANALYSIS_PRICE = ANALYSIS_TASKS.reduce((s, t) => s + t.price, 0);

// ── Other pricing ─────────────────────────────────────────────────────────────
export const PRICING = {
  imageAnalysis: TOTAL_ANALYSIS_PRICE,
  layoutMint: 2.00,
  layoutList: 0.10,
} as const;

export function calcImagePrice(_count: number): number {
  return TOTAL_ANALYSIS_PRICE;
}

export function toUSDCUnits(dollars: number): bigint {
  return BigInt(Math.round(dollars * 1_000_000));
}

// ERC-20 minimal ABI (transfer + approve + balanceOf)
export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// Wagmi config
export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [arcTestnet.id]: http("https://rpc.testnet.arc.network"),
  },
});
