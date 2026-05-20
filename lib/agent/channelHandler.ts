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
    fetch(`${getBaseUrl()}/api/circle/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletId:           user.circleWalletId,
        destinationAddress: process.env.SERVICE_WALLET ?? "0x68e51fb0A433caBe0d4f17AEe537676d925Cb35c",
        amount:             ANALYSIS_COST.toString(),
        taskName:           `shelf-analysis-${channel}`,
      }),
    }).catch(() => {}); // fire-and-forget

    // Update stats
    updateUserStats(channel, userId, ANALYSIS_COST);

    // Format response
    const text = formatAnalysisResult(result, ANALYSIS_COST, balance - ANALYSIS_COST);

    updateMessage(inMsg.id, { status: "done", analysisId: result.id, cost: ANALYSIS_COST });
    addMessage({ channel, userId, username, type: "result", content: text, analysisId: result.id, cost: ANALYSIS_COST, status: "done" });

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
  const q    = result.step1_quality ?? {};
  const cnt  = result.step2_count ?? {};
  const sos  = result.step6_shelfShare ?? [];
  const osa  = (result.step7_osa ?? []).filter((o: {riskLevel:string}) => o.riskLevel !== "none");
  const recs = result.step8_recommendations ?? [];
  const top  = sos[0];

  let msg = `🤖 *StoreScope AI — Shelf Analysis*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Summary
  msg += `📊 *Tóm tắt*\n`;
  msg += `${result.summary ?? "Phân tích hoàn tất"}\n\n`;

  // Quality
  msg += `🔍 *Chất lượng ảnh:* ${q.score ?? "—"}/100`;
  if (q.perspective?.shootingAngle > 10) msg += ` ⚠️ Góc xiên ~${q.perspective.shootingAngle}°`;
  msg += `\n`;

  // Count
  msg += `📦 *Sản phẩm:* ~${cnt.totalUnits ?? "?"} units · ${cnt.shelfRows ?? "?"} tầng kệ\n`;

  // SKUs
  const skuCount = (result.step3_skus ?? []).length;
  msg += `🏷️ *SKUs:* ${skuCount} loại · ${result.totalFacings ?? "?"} facings\n\n`;

  // Shelf share
  if (sos.length > 0) {
    msg += `📊 *Share of Shelf:*\n`;
    sos.slice(0, 4).forEach((s: {brand:string;shareOfShelf:number;facings:number}) => {
      const bar = "█".repeat(Math.round(s.shareOfShelf / 10)) + "░".repeat(10 - Math.round(s.shareOfShelf / 10));
      msg += `  ${s.brand}: ${bar} ${s.shareOfShelf}% (${s.facings} facing)\n`;
    });
    msg += `\n`;
  }

  // OSA alerts
  if (osa.length > 0) {
    msg += `⚠️ *Cảnh báo hết hàng (OSA):*\n`;
    osa.slice(0, 3).forEach((o: {sku:string;riskLevel:string;facingsRemaining:number;action:string}) => {
      const emoji = o.riskLevel === "high" ? "🔴" : o.riskLevel === "medium" ? "🟡" : "🟢";
      msg += `  ${emoji} ${o.sku}: ${o.facingsRemaining} facing còn — ${o.action}\n`;
    });
    msg += `\n`;
  }

  // Top recommendation
  if (recs.length > 0) {
    const highRec = recs.find((r: {priority:string}) => r.priority === "high") ?? recs[0];
    msg += `💡 *Gợi ý ưu tiên:*\n`;
    msg += `  → ${highRec.action}\n\n`;
  }

  // Cost
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💳 Phí phân tích: $${cost.toFixed(3)} USDC\n`;
  msg += `💰 Số dư còn lại: $${balanceAfter.toFixed(3)} USDC\n`;
  msg += `🔗 Analysis ID: ${result.id}`;

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
  return process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}
