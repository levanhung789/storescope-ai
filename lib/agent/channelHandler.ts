// Unified channel handler — shared logic for Telegram, Zalo, WebChat

import { getUser, addMessage, updateMessage, updateUserStats, type Channel } from "./channelStore";
import { analyzeImage } from "../vision-agent/agent";

const ANALYSIS_COST = 0.025; // USDC

export interface AnalysisResponse {
  success:     boolean;
  messageId:   string;
  text:        string;
  cost?:       number;
  analysisId?: string;
  error?:      string;
}

// ── Main handler: receive image from any channel ───────────────────────────────
export async function handleImageMessage(
  channel:  Channel,
  userId:   string,
  username: string | undefined,
  imageBase64: string,
  mimeType:    string,
): Promise<AnalysisResponse> {

  // Log incoming image
  const inMsg = addMessage({ channel, userId, username, type: "image", content: "", status: "pending" });

  // Check user linked
  const user = getUser(channel, userId);
  if (!user) {
    updateMessage(inMsg.id, { status: "error" });
    const text = formatNotLinked(channel, userId);
    addMessage({ channel, userId, username, type: "result", content: text, status: "error" });
    return { success: false, messageId: inMsg.id, text, error: "not_linked" };
  }

  // Check Circle balance
  updateMessage(inMsg.id, { status: "analyzing" });
  try {
    const balRes = await fetch(`${getBaseUrl()}/api/circle/balance?walletId=${user.circleWalletId}&address=${user.walletAddress}`);
    const balData = await balRes.json() as { usdc?: string };
    const balance  = parseFloat(balData.usdc ?? "0");

    if (balance < ANALYSIS_COST) {
      const text = formatInsufficientFunds(balance, ANALYSIS_COST, user.walletAddress);
      updateMessage(inMsg.id, { status: "insufficient_funds" });
      addMessage({ channel, userId, username, type: "result", content: text, status: "insufficient_funds" });
      return { success: false, messageId: inMsg.id, text, error: "insufficient_funds" };
    }

    // Run Vision Agent analysis
    const result = await analyzeImage(imageBase64, mimeType, false);

    // Charge Circle wallet
    let txId: string | null = null;
    let txHash: string | null = null;
    try {
      const transferRes = await fetch(`${getBaseUrl()}/api/circle/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId:           user.circleWalletId,
          destinationAddress: process.env.SERVICE_WALLET ?? "0x68e51fb0A433caBe0d4f17AEe537676d925Cb35c",
          amount:             ANALYSIS_COST.toString(),
          taskName:           `shelf-analysis-${channel}`,
        }),
      });
      const transferData = await transferRes.json() as { txId?: string; txHash?: string | null };
      txId   = transferData.txId ?? null;
      txHash = transferData.txHash ?? null;
    } catch {
      // payment record is best-effort — analysis result is still delivered
    }

    // Update stats
    updateUserStats(channel, userId, ANALYSIS_COST);

    // Format response
    const text = formatAnalysisResult(result, ANALYSIS_COST, balance - ANALYSIS_COST);

    updateMessage(inMsg.id, { status: "done", analysisId: result.id, cost: ANALYSIS_COST, txId, txHash });
    addMessage({ channel, userId, username, type: "result", content: text, analysisId: result.id, cost: ANALYSIS_COST, txId, txHash, status: "done" });

    return { success: true, messageId: inMsg.id, text, cost: ANALYSIS_COST, analysisId: result.id };

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Analysis failed";
    updateMessage(inMsg.id, { status: "error" });
    addMessage({ channel, userId, username, type: "result", content: `❌ Error: ${errMsg}`, status: "error" });
    return { success: false, messageId: inMsg.id, text: `❌ Error: ${errMsg}`, error: errMsg };
  }
}

// ── Format responses ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatAnalysisResult(result: any, cost: number, balanceAfter: number): string {
  const q     = result.step1_quality ?? {};
  const pers  = q.perspective ?? {};
  const cnt   = result.step2_count ?? {};
  const skus  = result.step3_skus ?? [];
  const facs  = result.step4_facings ?? [];
  const pos   = result.step5_positions ?? [];
  const sos   = result.step6_shelfShare ?? [];
  const osa   = result.step7_osa ?? [];
  const osaRisk = osa.filter((o: {riskLevel:string}) => o.riskLevel !== "none");
  const recs  = result.step8_recommendations ?? [];

  let msg = `🤖 *StoreScope AI — Shelf Analysis (8 bước)*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Summary
  msg += `📊 *Tóm tắt*\n`;
  msg += `${result.summary || "Phân tích hoàn tất"}\n\n`;

  // Step 1 — Quality & perspective
  msg += `1️⃣ *Chất lượng & góc chụp*\n`;
  msg += `  Điểm: ${q.score ?? "—"}/100 · Góc: ${q.angle ?? "—"} · Sáng: ${q.lighting ?? "—"} · Nét: ${q.blur ?? "—"}\n`;
  if (pers.shootingAngle) {
    msg += `  Shooting angle ~${pers.shootingAngle}° (${pers.perspectiveType ?? "—"})`;
    if (pers.correctionFactor && pers.correctionFactor !== 1) msg += ` → hệ số hiệu chỉnh ${pers.correctionFactor}`;
    msg += `\n`;
  }
  if (q.issues?.length) msg += `  ⚠️ ${q.issues.join("; ")}\n`;
  msg += `\n`;

  // Step 2 — Product count
  msg += `2️⃣ *Đếm sản phẩm*\n`;
  msg += `  ~${cnt.totalUnits ?? "?"} units (${cnt.visibleUnits ?? "?"} thấy rõ) · ${cnt.shelfRows ?? "?"} tầng kệ · depth ~${cnt.estimatedDepth ?? "?"}\n`;
  if (cnt.note) msg += `  ${cnt.note}\n`;
  msg += `\n`;

  // Step 3 — SKUs
  msg += `3️⃣ *SKU phát hiện (${skus.length})*\n`;
  if (skus.length > 0) {
    skus.slice(0, 10).forEach((s: {brand:string;sku:string;confidence:number}) => {
      msg += `  • ${s.brand} — ${s.sku} (${s.confidence}%)\n`;
    });
    if (skus.length > 10) msg += `  …+${skus.length - 10} SKU khác\n`;
  } else {
    msg += `  Không phát hiện SKU\n`;
  }
  msg += `\n`;

  // Step 4 — Facings
  msg += `4️⃣ *Facings (tổng ${result.totalFacings ?? 0})*\n`;
  if (facs.length > 0) {
    facs.slice(0, 10).forEach((f: {brand:string;sku:string;facing:number;facingAdjusted:number}) => {
      msg += `  • ${f.brand} ${f.sku}: ${f.facing} facing` + (f.facingAdjusted !== f.facing ? ` → ${f.facingAdjusted} (hiệu chỉnh)\n` : `\n`);
    });
    if (facs.length > 10) msg += `  …+${facs.length - 10} dòng khác\n`;
  } else {
    msg += `  Không có dữ liệu facing\n`;
  }
  msg += `\n`;

  // Step 5 — Shelf positions
  msg += `5️⃣ *Vị trí trên kệ*\n`;
  if (pos.length > 0) {
    pos.slice(0, 8).forEach((p: {brand:string;sku:string;tier:string}) => {
      msg += `  • ${p.brand} ${p.sku}: ${p.tier}\n`;
    });
    if (pos.length > 8) msg += `  …+${pos.length - 8} dòng khác\n`;
  } else {
    msg += `  Không có dữ liệu vị trí\n`;
  }
  msg += `\n`;

  // Step 6 — Share of Shelf
  msg += `6️⃣ *Share of Shelf*\n`;
  if (sos.length > 0) {
    sos.slice(0, 6).forEach((s: {brand:string;shareOfShelf:number;facings:number}) => {
      const bar = "█".repeat(Math.round(s.shareOfShelf / 10)) + "░".repeat(10 - Math.round(s.shareOfShelf / 10));
      msg += `  ${s.brand}: ${bar} ${s.shareOfShelf}% (${s.facings} facing)\n`;
    });
  } else {
    msg += `  Không có dữ liệu\n`;
  }
  msg += `\n`;

  // Step 7 — OSA alerts
  msg += `7️⃣ *Cảnh báo hết hàng (OSA)*\n`;
  if (osaRisk.length > 0) {
    osaRisk.slice(0, 5).forEach((o: {brand:string;sku:string;riskLevel:string;facingsRemaining:number;action:string}) => {
      const emoji = o.riskLevel === "high" ? "🔴" : o.riskLevel === "medium" ? "🟡" : "🟢";
      msg += `  ${emoji} ${o.brand} ${o.sku}: ${o.facingsRemaining} facing còn — ${o.action}\n`;
    });
  } else {
    msg += `  ✅ Không có rủi ro hết hàng\n`;
  }
  msg += `\n`;

  // Step 8 — Recommendations
  msg += `8️⃣ *Gợi ý tối ưu*\n`;
  if (recs.length > 0) {
    recs.slice(0, 5).forEach((r: {priority:string;action:string;reason:string}) => {
      const emoji = r.priority === "high" ? "🔴" : r.priority === "medium" ? "🟡" : "🟢";
      msg += `  ${emoji} ${r.action}\n     → ${r.reason}\n`;
    });
  } else {
    msg += `  Không có gợi ý\n`;
  }

  // Footer
  msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💳 Phí phân tích: $${cost.toFixed(3)} USDC\n`;
  msg += `💰 Số dư còn lại: $${balanceAfter.toFixed(3)} USDC\n`;
  msg += `🔗 Analysis ID: ${result.id}`;

  // Telegram message hard limit is 4096 chars — truncate defensively.
  if (msg.length > 4000) {
    msg = msg.slice(0, 3950) + "\n\n…(báo cáo đã được rút ngắn)";
  }

  return msg;
}

function formatNotLinked(channel: Channel, userId: string): string {
  return `⚠️ *Chưa liên kết ví*\n\nBạn cần liên kết Circle Wallet để sử dụng AI phân tích.\n\n` +
    `Vào: https://storescope-ai.vercel.app/login\n` +
    `Tạo Circle Wallet → Liên kết ${channel === "telegram" ? "Telegram" : "Zalo"} ID: \`${userId}\``;
}

function formatInsufficientFunds(balance: number, required: number, address: string): string {
  return `❌ *Không đủ USDC*\n\n` +
    `Số dư: $${balance.toFixed(3)} USDC\n` +
    `Cần: $${required.toFixed(3)} USDC\n\n` +
    `Nạp thêm tại: https://faucet.circle.com\n` +
    `Địa chỉ ví: \`${address}\``;
}

function getBaseUrl(): string {
  if (process.env.VERCEL_ENV === "production") return "https://storescope-ai.vercel.app";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
