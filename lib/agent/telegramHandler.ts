// Shared Telegram update handler — used by both the shared bot webhook
// (app/api/agent/telegram/route.ts) and personal bot webhooks
// (app/api/agent/telegram/[secret]/route.ts)

import { handleImageMessage } from "./channelHandler";
import { getUser, linkUser } from "./channelStore";

export type TelegramCtx =
  | { mode: "shared" }
  | { mode: "personal"; walletId: string; walletAddress: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleTelegramUpdate(token: string, update: Record<string, any>, ctx: TelegramCtx): Promise<void> {
  async function sendMessage(chatId: number | string, text: string, parseMode = "Markdown") {
    if (!token) return;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
    }).catch(() => {});
  }

  async function getFileUrl(fileId: string): Promise<string | null> {
    if (!token) return null;
    const res  = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const data = await res.json() as { ok: boolean; result?: { file_path?: string } };
    if (!data.ok || !data.result?.file_path) return null;
    return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
  }

  const msg = update.message ?? update.channel_post;
  if (!msg) return;

  const chatId   = msg.chat?.id;
  const username = msg.from?.username ?? msg.from?.first_name ?? "User";
  const text     = msg.text ?? "";

  // userId resolves to the channelStore key — Telegram user id for shared bots,
  // the linked Circle wallet id for personal (1:1) bots
  const userId = ctx.mode === "personal" ? ctx.walletId : String(msg.from?.id ?? chatId);

  // ── /start ──────────────────────────────────────────────────────────────
  if (text.startsWith("/start")) {
    if (ctx.mode === "personal") {
      await sendMessage(chatId,
        `👋 *Xin chào ${username}!*\n\n` +
        `Bot này đã được kết nối với ví Circle của bạn.\n\n` +
        `📸 Gửi ảnh kệ hàng → AI phân tích 8 bước:\n` +
        `  • Đếm sản phẩm & facings\n` +
        `  • Share of Shelf\n` +
        `  • Cảnh báo hết hàng (OSA)\n` +
        `  • Gợi ý tối ưu trưng bày\n\n` +
        `💳 Phí: $0.025 USDC/lần\n\n` +
        `Wallet: \`${ctx.walletAddress.slice(0, 8)}...${ctx.walletAddress.slice(-6)}\`\n\n` +
        `Gửi ảnh kệ hàng để bắt đầu phân tích!`
      );
    } else {
      await sendMessage(chatId,
        `👋 *Xin chào ${username}!*\n\n` +
        `Tôi là *StoreScope AI Bot* — phân tích kệ hàng FMCG bằng AI.\n\n` +
        `📸 Gửi ảnh kệ hàng → AI phân tích 8 bước:\n` +
        `  • Đếm sản phẩm & facings\n` +
        `  • Share of Shelf\n` +
        `  • Cảnh báo hết hàng (OSA)\n` +
        `  • Gợi ý tối ưu trưng bày\n\n` +
        `💳 Phí: $0.025 USDC/lần\n\n` +
        `🔗 *User ID của bạn:* \`${userId}\`\n\n` +
        `Vào https://storescope-ai.vercel.app/dashboard/agent → mục "Telegram Bot" → dán User ID này để liên kết với ví Circle của bạn.\n\n` +
        `Sau khi liên kết, gửi ảnh kệ hàng để bắt đầu phân tích!`
      );
    }
    return;
  }

  // ── /link <walletId> <walletAddress> — shared mode only ─────────────────
  if (ctx.mode === "shared" && text.startsWith("/link ")) {
    const parts = text.split(" ");
    if (parts.length < 3) {
      await sendMessage(chatId, "❌ Cú pháp: `/link <walletId> <walletAddress>`");
      return;
    }
    const [, walletId, walletAddress] = parts;
    linkUser({
      channel:         "telegram",
      userId,
      username,
      circleWalletId:  walletId,
      walletAddress,
      linkedAt:        Date.now(),
      totalAnalyses:   0,
      totalSpentUSDC:  0,
    });
    await sendMessage(chatId,
      `✅ *Đã liên kết thành công!*\n\n` +
      `Wallet: \`${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}\`\n\n` +
      `Gửi ảnh kệ hàng để bắt đầu phân tích! 📸`
    );
    return;
  }

  // ── /balance ─────────────────────────────────────────────────────────────
  if (text.startsWith("/balance")) {
    const user = getUser("telegram", userId);
    if (!user) {
      await sendMessage(chatId, "⚠️ Chưa liên kết ví. Dùng `/link <walletId> <address>`");
    } else {
      const res  = await fetch(`https://storescope-ai.vercel.app/api/circle/balance?walletId=${user.circleWalletId}&address=${user.walletAddress}`);
      const data = await res.json() as { usdc?: string };
      await sendMessage(chatId,
        `💰 *Số dư ví*\n\n` +
        `USDC: $${data.usdc ?? "0.00"}\n` +
        `Địa chỉ: \`${user.walletAddress}\`\n` +
        `Tổng phân tích: ${user.totalAnalyses} lần ($${user.totalSpentUSDC.toFixed(3)})`
      );
    }
    return;
  }

  // ── Photo message ─────────────────────────────────────────────────────────
  if (msg.photo || msg.document?.mime_type?.startsWith("image/")) {
    await sendMessage(chatId, "⏳ Đang phân tích ảnh... (~10-15 giây)");

    // Get highest resolution photo
    const photo  = msg.photo ? msg.photo[msg.photo.length - 1] : msg.document;
    const fileUrl = await getFileUrl(photo.file_id);
    if (!fileUrl) {
      await sendMessage(chatId, "❌ Không thể tải ảnh. Thử lại.");
      return;
    }

    // Download and convert to base64
    const imgRes  = await fetch(fileUrl);
    const buffer  = await imgRes.arrayBuffer();
    const base64  = Buffer.from(buffer).toString("base64");
    const mime    = imgRes.headers.get("content-type") ?? "image/jpeg";

    const response = await handleImageMessage("telegram", userId, username, base64, mime);
    await sendMessage(chatId, response.text);
    return;
  }

  // ── Unknown message ───────────────────────────────────────────────────────
  if (text && !text.startsWith("/")) {
    if (ctx.mode === "personal") {
      await sendMessage(chatId,
        `📸 Gửi ảnh kệ hàng để phân tích!\n\n` +
        `Lệnh:\n/start - Hướng dẫn\n/balance - Xem số dư`
      );
    } else {
      await sendMessage(chatId,
        `📸 Gửi ảnh kệ hàng để phân tích!\n\n` +
        `Lệnh:\n/start - Hướng dẫn\n/link - Liên kết ví\n/balance - Xem số dư`
      );
    }
  }
}
