/**
 * ARC Testnet Smart Contracts — ABIs, addresses, viem client
 * Server-side only — never import in "use client" components
 */
import { createPublicClient, createWalletClient, http, keccak256, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// ── ARC Testnet chain config ───────────────────────────────────────────────
export const arcTestnet = {
  id:       5042002,
  name:     "Arc Testnet",
  rpcUrls:  { default: { http: ["https://rpc.testnet.arc.network"] } },
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
} as const;

// ── Contract addresses ─────────────────────────────────────────────────────
export const CONTRACTS = {
  ANALYSIS_REGISTRY:   (process.env.ANALYSIS_REGISTRY_ADDRESS   ?? "0x1D8bBf0A9ba8CC51d08d4Fff15be79719C0A122C") as `0x${string}`,
  PAYMENT_VERIFIER:    (process.env.PAYMENT_VERIFIER_ADDRESS     ?? "0xeC595fE964be09854B6F5fa5FED0a814dacD6AcC") as `0x${string}`,
  RETAIL_LAYOUT_NFT:   (process.env.RETAIL_LAYOUT_NFT_ADDRESS    ?? "0x18B434352c1ff1BdAde1E7871823b7bC6eed00dB") as `0x${string}`,
  IDENTITY_REGISTRY:   (process.env.ARC_IDENTITY_REGISTRY        ?? "0x8004A818BFB912233c491871b3d84c89A494BD9e") as `0x${string}`,
  REPUTATION_REGISTRY: (process.env.ARC_REPUTATION_REGISTRY      ?? "0x8004B663056A597Dffe9eCcC1965A193B7388713") as `0x${string}`,
  VALIDATION_REGISTRY: (process.env.ARC_VALIDATION_REGISTRY      ?? "0x8004Cb1BF31DAf7788923b405b754f57acEB4272") as `0x${string}`,

  // 10 Micro-Task Verifier Contracts (deployed 2026-05-17)
  TASK_UPLOAD:       (process.env.TASK_UPLOAD_ADDRESS       ?? "0x65c9E64cd0fCeFFEAB374E78Ef7B31Ab5140f578") as `0x${string}`,
  TASK_QUALITY:      (process.env.TASK_QUALITY_ADDRESS      ?? "0x92f785270db32676571736095c0621F00E2033c0") as `0x${string}`,
  TASK_SHELF_DETECT: (process.env.TASK_SHELF_DETECT_ADDRESS ?? "0x47efe628B089Fc25593e4070489DC8aa46B624f5") as `0x${string}`,
  TASK_SKU_DETECT:   (process.env.TASK_SKU_DETECT_ADDRESS   ?? "0xF0Af9129664869402943Db3E36836F67a045252d") as `0x${string}`,
  TASK_COMPETITOR:   (process.env.TASK_COMPETITOR_ADDRESS   ?? "0xE72cA03fF2e1A78E0384dc4c72F4Ea0c22a31d5f") as `0x${string}`,
  TASK_STOCK_RISK:   (process.env.TASK_STOCK_RISK_ADDRESS   ?? "0xb74a2d5232A8F9792ee2ad3B2f43817c24eae189") as `0x${string}`,
  TASK_LAYOUT_SIM:   (process.env.TASK_LAYOUT_SIM_ADDRESS   ?? "0x5A903C08Ea7f495BEED3A0C81b4F3Aa878C6fc15") as `0x${string}`,
  TASK_RECOMMEND:    (process.env.TASK_RECOMMEND_ADDRESS    ?? "0xB779fFa5883748Da0DEAd01d2a0CEcd763Af65FF") as `0x${string}`,
  TASK_HUMAN_REVIEW: (process.env.TASK_HUMAN_REVIEW_ADDRESS ?? "0x47BeDDf187A0816884dC3c61298DBDe131cBF986") as `0x${string}`,
  TASK_REPORT:       (process.env.TASK_REPORT_ADDRESS       ?? "0x8e1AA6a0569A11611E1953eAA1a543d638f4873D") as `0x${string}`,
} as const;

// Map taskId → contract address
export const TASK_CONTRACT: Record<string, `0x${string}`> = {
  upload:       CONTRACTS.TASK_UPLOAD,
  quality:      CONTRACTS.TASK_QUALITY,
  shelf_detect: CONTRACTS.TASK_SHELF_DETECT,
  sku_detect:   CONTRACTS.TASK_SKU_DETECT,
  competitor:   CONTRACTS.TASK_COMPETITOR,
  stock_risk:   CONTRACTS.TASK_STOCK_RISK,
  layout_sim:   CONTRACTS.TASK_LAYOUT_SIM,
  recommend:    CONTRACTS.TASK_RECOMMEND,
  human_review: CONTRACTS.TASK_HUMAN_REVIEW,
  report:       CONTRACTS.TASK_REPORT,
};

// ── AnalysisRegistry ABI ───────────────────────────────────────────────────
export const ANALYSIS_REGISTRY_ABI = [
  {
    name: "requestAnalysis",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "analysisId", type: "bytes32" },
      { name: "payer",      type: "address" },
      { name: "imageHash",  type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "confirmPayment",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "analysisId",  type: "bytes32" },
      { name: "circleTxId",  type: "string"  },
      { name: "pricePaid",   type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "submitResult",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "analysisId",   type: "bytes32" },
      { name: "resultHash",   type: "bytes32" },
      { name: "ipfsCid",      type: "string"  },
      { name: "modelVersion", type: "string"  },
      { name: "brandCount",   type: "uint8"   },
      { name: "skuCount",     type: "uint8"   },
    ],
    outputs: [],
  },
  {
    name: "markFailed",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "analysisId", type: "bytes32" },
      { name: "reason",     type: "string"  },
    ],
    outputs: [],
  },
  {
    name: "getAnalysis",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "analysisId", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "payer",         type: "address" },
          { name: "imageHash",     type: "bytes32" },
          { name: "resultHash",    type: "bytes32" },
          { name: "circleTxId",    type: "string"  },
          { name: "ipfsResultCid", type: "string"  },
          { name: "pricePaid",     type: "uint256" },
          { name: "requestedAt",   type: "uint256" },
          { name: "completedAt",   type: "uint256" },
          { name: "status",        type: "uint8"   },
          { name: "modelVersion",  type: "string"  },
          { name: "brandCount",    type: "uint8"   },
          { name: "skuCount",      type: "uint8"   },
        ],
      },
    ],
  },
  {
    name: "verifyResult",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "analysisId", type: "bytes32" },
      { name: "resultHash", type: "bytes32" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "totalAnalyses",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  // Events
  {
    name: "AnalysisRequested",
    type: "event",
    inputs: [
      { name: "analysisId", type: "bytes32", indexed: true },
      { name: "payer",      type: "address", indexed: true },
      { name: "imageHash",  type: "bytes32", indexed: false },
      { name: "timestamp",  type: "uint256", indexed: false },
    ],
  },
  {
    name: "ResultSubmitted",
    type: "event",
    inputs: [
      { name: "analysisId",  type: "bytes32", indexed: true },
      { name: "resultHash",  type: "bytes32", indexed: false },
      { name: "ipfsCid",     type: "string",  indexed: false },
      { name: "brandCount",  type: "uint8",   indexed: false },
      { name: "skuCount",    type: "uint8",   indexed: false },
      { name: "completedAt", type: "uint256", indexed: false },
    ],
  },
] as const;

// ── viem clients (server-side) ────────────────────────────────────────────
export const publicClient = createPublicClient({
  chain:     arcTestnet,
  transport: http("https://rpc.testnet.arc.network"),
});

export function getDeployerWallet() {
  const key = process.env.DEPLOYER_KEY;
  if (!key) throw new Error("DEPLOYER_KEY not set in .env.local");
  const account = privateKeyToAccount(key as `0x${string}`);
  return createWalletClient({
    account,
    chain:     arcTestnet,
    transport: http("https://rpc.testnet.arc.network"),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Generate unique analysisId from payer + imageHash + timestamp */
export function makeAnalysisId(payer: string, imageHash: string, ts?: number): `0x${string}` {
  const t = ts ?? Date.now();
  return keccak256(toHex(`${payer}-${imageHash}-${t}`));
}

/** Hash a result JSON string for on-chain fingerprint */
export function hashResult(resultJson: string): `0x${string}` {
  return keccak256(toHex(resultJson));
}

/** Hash image bytes (base64 string) */
export function hashImage(imageBase64: string): `0x${string}` {
  return keccak256(toHex(imageBase64.slice(0, 1000)));
}

// ── BaseTaskVerifier ABI (shared by all 10 task contracts) ────────────────
export const BASE_TASK_VERIFIER_ABI = [
  {
    name: "recordPayment",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "analysisId", type: "bytes32" },
      { name: "payer",      type: "address" },
      { name: "amount",     type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "isRecorded",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "analysisId", type: "bytes32" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "taskName",
    type: "function",
    stateMutability: "pure",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "taskPrice",
    type: "function",
    stateMutability: "pure",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "TaskPaymentRecorded",
    type: "event",
    inputs: [
      { name: "analysisId", type: "bytes32", indexed: true  },
      { name: "payer",      type: "address", indexed: true  },
      { name: "amount",     type: "uint256", indexed: false },
      { name: "timestamp",  type: "uint256", indexed: false },
    ],
  },
] as const;

// ── PaymentVerifier ABI ────────────────────────────────────────────────────
export const PAYMENT_VERIFIER_ABI = [
  {
    name: "recordPayment",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "paymentId", type: "bytes32" },
      { name: "payer",     type: "address" },
      { name: "amount",    type: "uint256" },
      { name: "taskType",  type: "string"  },
    ],
    outputs: [],
  },
  {
    name: "isVerified",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "paymentId", type: "bytes32" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "PaymentRecorded",
    type: "event",
    inputs: [
      { name: "paymentId", type: "bytes32", indexed: true  },
      { name: "payer",     type: "address", indexed: true  },
      { name: "amount",    type: "uint256", indexed: false },
      { name: "taskType",  type: "string",  indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;

// ── ARC Agent Identity ─────────────────────────────────────────────────────
export const ARC_AGENT_ID = BigInt(process.env.ARC_AGENT_ID ?? "9393");

export const REPUTATION_REGISTRY_ABI = [
  {
    name: "giveFeedback",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "score",   type: "uint8"   },
      { name: "tag",     type: "string"  },
    ],
    outputs: [],
  },
  {
    name: "FeedbackGiven",
    type: "event",
    inputs: [
      { name: "agentId",   type: "uint256", indexed: true  },
      { name: "validator", type: "address", indexed: true  },
      { name: "score",     type: "uint8",   indexed: false },
      { name: "tag",       type: "string",  indexed: false },
    ],
  },
] as const;

export const VALIDATION_REGISTRY_ABI = [
  {
    name: "validationRequest",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "validationResponse",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestId", type: "uint256" },
      { name: "passed",    type: "bool"    },
    ],
    outputs: [],
  },
  {
    name: "ValidationRequested",
    type: "event",
    inputs: [
      { name: "requestId", type: "uint256", indexed: true },
      { name: "agentId",   type: "uint256", indexed: true },
    ],
  },
] as const;
