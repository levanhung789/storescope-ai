/**
 * POST /api/contracts/record
 * Records analysis lifecycle on-chain via AnalysisRegistry contract
 *
 * Stages:
 *  - "request"  → requestAnalysis()
 *  - "payment"  → confirmPayment()
 *  - "result"   → submitResult()
 *  - "failed"   → markFailed()
 */
import { NextRequest, NextResponse } from "next/server";
import {
  getDeployerWallet, publicClient,
  CONTRACTS, ANALYSIS_REGISTRY_ABI,
  REPUTATION_REGISTRY_ABI, ARC_AGENT_ID,
  makeAnalysisId, hashResult, hashImage,
} from "../../../_lib/contracts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const stage = body.stage as string;

    if (!stage) {
      return NextResponse.json({ error: "stage is required" }, { status: 400 });
    }

    const wallet = getDeployerWallet();

    // ── Stage 1: request ──────────────────────────────────────────────────
    if (stage === "request") {
      const { payer, imageBase64 } = body as { payer: string; imageBase64?: string };
      if (!payer) return NextResponse.json({ error: "payer required" }, { status: 400 });

      const imageHash  = hashImage(imageBase64 ?? payer);
      const analysisId = makeAnalysisId(payer, imageHash);

      const hash = await wallet.writeContract({
        address:      CONTRACTS.ANALYSIS_REGISTRY,
        abi:          ANALYSIS_REGISTRY_ABI,
        functionName: "requestAnalysis",
        args:         [analysisId, payer as `0x${string}`, imageHash],
      });

      return NextResponse.json({
        stage:      "request",
        analysisId,
        imageHash,
        txHash:     hash,
        explorerUrl: `https://testnet.arcscan.app/tx/${hash}`,
      });
    }

    // ── Stage 2: payment ──────────────────────────────────────────────────
    if (stage === "payment") {
      const { analysisId, circleTxId, pricePaid } = body as {
        analysisId: string; circleTxId: string; pricePaid?: number;
      };
      if (!analysisId || !circleTxId) {
        return NextResponse.json({ error: "analysisId and circleTxId required" }, { status: 400 });
      }

      const priceUnits = BigInt(Math.round((pricePaid ?? 0.025) * 1_000_000));

      const hash = await wallet.writeContract({
        address:      CONTRACTS.ANALYSIS_REGISTRY,
        abi:          ANALYSIS_REGISTRY_ABI,
        functionName: "confirmPayment",
        args:         [analysisId as `0x${string}`, circleTxId, priceUnits],
      });

      return NextResponse.json({
        stage:       "payment",
        analysisId,
        txHash:      hash,
        explorerUrl: `https://testnet.arcscan.app/tx/${hash}`,
      });
    }

    // ── Stage 3: result ───────────────────────────────────────────────────
    if (stage === "result") {
      const {
        analysisId, resultJson, ipfsCid,
        modelVersion, brandCount, skuCount,
      } = body as {
        analysisId: string; resultJson: string;
        ipfsCid?: string; modelVersion?: string;
        brandCount?: number; skuCount?: number;
      };
      if (!analysisId || !resultJson) {
        return NextResponse.json({ error: "analysisId and resultJson required" }, { status: 400 });
      }

      const resultHash = hashResult(resultJson);

      const hash = await wallet.writeContract({
        address:      CONTRACTS.ANALYSIS_REGISTRY,
        abi:          ANALYSIS_REGISTRY_ABI,
        functionName: "submitResult",
        args: [
          analysisId as `0x${string}`,
          resultHash,
          ipfsCid      ?? "",
          modelVersion ?? "tesseract+roboflow-fmcg",
          brandCount   ?? 0,
          skuCount     ?? 0,
        ],
      });

      // Auto giveFeedback to ReputationRegistry after successful analysis
      const score = Math.min(100, 70 + Math.round((Number(brandCount ?? 0) + Number(skuCount ?? 0)) * 2));
      wallet.writeContract({
        address:      CONTRACTS.REPUTATION_REGISTRY,
        abi:          REPUTATION_REGISTRY_ABI,
        functionName: "giveFeedback",
        args:         [ARC_AGENT_ID, score, "shelf-analysis"],
      }).catch(() => {}); // fire-and-forget

      return NextResponse.json({
        stage:        "result",
        analysisId,
        resultHash,
        txHash:       hash,
        reputationScore: score,
        explorerUrl:  `https://testnet.arcscan.app/tx/${hash}`,
      });
    }

    // ── Stage 4: failed ───────────────────────────────────────────────────
    if (stage === "failed") {
      const { analysisId, reason } = body as { analysisId: string; reason?: string };
      if (!analysisId) return NextResponse.json({ error: "analysisId required" }, { status: 400 });

      const hash = await wallet.writeContract({
        address:      CONTRACTS.ANALYSIS_REGISTRY,
        abi:          ANALYSIS_REGISTRY_ABI,
        functionName: "markFailed",
        args:         [analysisId as `0x${string}`, reason ?? "Unknown error"],
      });

      return NextResponse.json({ stage: "failed", analysisId, txHash: hash });
    }

    // ── Read: get analysis ────────────────────────────────────────────────
    if (stage === "get") {
      const { analysisId } = body as { analysisId: string };
      if (!analysisId) return NextResponse.json({ error: "analysisId required" }, { status: 400 });

      const data = await publicClient.readContract({
        address:      CONTRACTS.ANALYSIS_REGISTRY,
        abi:          ANALYSIS_REGISTRY_ABI,
        functionName: "getAnalysis",
        args:         [analysisId as `0x${string}`],
      });

      const STATUS = ["REQUESTED", "PAID", "COMPLETED", "FAILED"];
      return NextResponse.json({
        analysisId,
        ...data,
        statusText:  STATUS[Number((data as Record<string, unknown>).status) ?? 0],
        explorerUrl: `https://testnet.arcscan.app/address/${CONTRACTS.ANALYSIS_REGISTRY}`,
      });
    }

    return NextResponse.json({ error: `Unknown stage: ${stage}` }, { status: 400 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
