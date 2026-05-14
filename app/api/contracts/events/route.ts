/**
 * GET /api/contracts/events
 * Query on-chain events from StoreScope AI contracts on ARC Testnet
 *
 * Query params:
 *  - contract: "analysis" | "payment" | "nft" | "all"  (default: "analysis")
 *  - blocks:   number of recent blocks to scan         (default: 500)
 *  - address:  filter by payer/user address            (optional)
 */
import { NextRequest, NextResponse } from "next/server";
import { publicClient, CONTRACTS } from "../../../_lib/contracts";

const STATUS_LABEL = ["REQUESTED", "PAID", "COMPLETED", "FAILED"];

// ── Event topics ─────────────────────────────────────────────────────────────
const ANALYSIS_EVENTS = [
  {
    name:      "AnalysisRequested",
    signature: "AnalysisRequested(bytes32,address,bytes32,uint256)",
    topic:     "0x7b8ef6cf20e29e8866f7e0462d7ebb2cfbd4df9e0b98c088b8f4d9d2efb8dffc",
  },
  {
    name:      "PaymentConfirmed",
    signature: "PaymentConfirmed(bytes32,string,uint256)",
    topic:     "0x2f2ff15d17b5c0673fca1da4cede4041b7a47f8c1e4e5d2b6b0d83b2d7d8b3f",
  },
  {
    name:      "ResultSubmitted",
    signature: "ResultSubmitted(bytes32,bytes32,string,uint8,uint8,uint256)",
    topic:     "0x9a8d9c1dce2c57b3b3de8d6a6d8d3a3b3c3d3e3f3a3b3c3d3e3f3a3b3c3d3e",
  },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
function shortHash(h: string) {
  return h ? `${h.slice(0, 10)}...${h.slice(-6)}` : "—";
}

function arcScanTx(hash: string) {
  return `https://testnet.arcscan.app/tx/${hash}`;
}

function arcScanAddr(addr: string) {
  return `https://testnet.arcscan.app/address/${addr}`;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const sp       = req.nextUrl.searchParams;
    const contract = sp.get("contract") ?? "analysis";
    const blocks   = Math.min(Number(sp.get("blocks") ?? 500), 2000);
    const userAddr = sp.get("address")?.toLowerCase();

    const currentBlock = await publicClient.getBlockNumber();
    const fromBlock    = currentBlock - BigInt(blocks);

    const results: Record<string, unknown>[] = [];

    // ── AnalysisRegistry events ───────────────────────────────────────────
    if (contract === "analysis" || contract === "all") {
      // AnalysisRequested
      const requested = await publicClient.getLogs({
        address:   CONTRACTS.ANALYSIS_REGISTRY,
        fromBlock,
        toBlock:   currentBlock,
        event: {
          type: "event",
          name: "AnalysisRequested",
          inputs: [
            { name: "analysisId", type: "bytes32", indexed: true  },
            { name: "payer",      type: "address", indexed: true  },
            { name: "imageHash",  type: "bytes32", indexed: false },
            { name: "timestamp",  type: "uint256", indexed: false },
          ],
        },
      } as Parameters<typeof publicClient.getLogs>[0]);

      for (const rawLog of requested) {
        const log  = rawLog as unknown as { args: Record<string, unknown>; blockNumber: bigint; transactionHash: string };
        const args = log.args ?? {};
        if (userAddr && String(args.payer).toLowerCase() !== userAddr) continue;
        results.push({
          event:       "AnalysisRequested",
          contract:    "AnalysisRegistry",
          analysisId:  shortHash(String(args.analysisId ?? "")),
          payer:       String(args.payer ?? ""),
          blockNumber: String(log.blockNumber),
          txHash:      log.transactionHash,
          txUrl:       arcScanTx(log.transactionHash ?? ""),
          timestamp:   new Date(Number(args.timestamp ?? 0) * 1000).toISOString(),
        });
      }

      // ResultSubmitted
      const submitted = await publicClient.getLogs({
        address:   CONTRACTS.ANALYSIS_REGISTRY,
        fromBlock,
        toBlock:   currentBlock,
        event: {
          type: "event",
          name: "ResultSubmitted",
          inputs: [
            { name: "analysisId",  type: "bytes32", indexed: true  },
            { name: "resultHash",  type: "bytes32", indexed: false },
            { name: "ipfsCid",     type: "string",  indexed: false },
            { name: "brandCount",  type: "uint8",   indexed: false },
            { name: "skuCount",    type: "uint8",   indexed: false },
            { name: "completedAt", type: "uint256", indexed: false },
          ],
        },
      } as Parameters<typeof publicClient.getLogs>[0]);

      for (const rawLog2 of submitted) {
        const log  = rawLog2 as unknown as { args: Record<string, unknown>; blockNumber: bigint; transactionHash: string };
        const args = log.args ?? {};
        results.push({
          event:       "ResultSubmitted",
          contract:    "AnalysisRegistry",
          analysisId:  shortHash(String(args.analysisId ?? "")),
          resultHash:  shortHash(String(args.resultHash ?? "")),
          brandCount:  Number(args.brandCount ?? 0),
          skuCount:    Number(args.skuCount ?? 0),
          blockNumber: String(log.blockNumber),
          txHash:      log.transactionHash,
          txUrl:       arcScanTx(log.transactionHash ?? ""),
          timestamp:   new Date(Number(args.completedAt ?? 0) * 1000).toISOString(),
        });
      }
    }

    // ── RetailLayoutNFT events ────────────────────────────────────────────
    if (contract === "nft" || contract === "all") {
      const minted = await publicClient.getLogs({
        address:   CONTRACTS.RETAIL_LAYOUT_NFT,
        fromBlock,
        toBlock:   currentBlock,
        event: {
          type: "event",
          name: "LayoutMinted",
          inputs: [
            { name: "creator", type: "address", indexed: true  },
            { name: "tokenId", type: "uint256", indexed: true  },
            { name: "name",    type: "string",  indexed: false },
          ],
        },
      } as Parameters<typeof publicClient.getLogs>[0]);

      for (const rawLog3 of minted) {
        const log  = rawLog3 as unknown as { args: Record<string, unknown>; blockNumber: bigint; transactionHash: string };
        const args = log.args ?? {};
        if (userAddr && String(args.creator).toLowerCase() !== userAddr) continue;
        results.push({
          event:       "LayoutMinted",
          contract:    "RetailLayoutNFT",
          tokenId:     String(args.tokenId ?? ""),
          creator:     String(args.creator ?? ""),
          layoutName:  String(args.name ?? ""),
          creatorUrl:  arcScanAddr(String(args.creator ?? "")),
          blockNumber: String(log.blockNumber),
          txHash:      log.transactionHash,
          txUrl:       arcScanTx(log.transactionHash ?? ""),
        });
      }
    }

    // Sort by blockNumber descending
    results.sort((a, b) =>
      Number(BigInt(String(b.blockNumber)) - BigInt(String(a.blockNumber)))
    );

    return NextResponse.json({
      ok:          true,
      contract,
      fromBlock:   String(fromBlock),
      toBlock:     String(currentBlock),
      blocksScanned: blocks,
      eventCount:  results.length,
      events:      results,
      explorerUrl: `https://testnet.arcscan.app/address/${CONTRACTS.ANALYSIS_REGISTRY}`,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
