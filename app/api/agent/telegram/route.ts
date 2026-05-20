// Telegram Bot Webhook Handler
// Setup: POST https://api.telegram.org/bot{TOKEN}/setWebhook?url={BASE_URL}/api/agent/telegram

import { NextRequest, NextResponse } from "next/server";
import { handleImageMessage } from "../../../../lib/agent/channelHandler";
import { getUser, linkUser, addMessage } from "../../../../lib/agent/channelStore";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

async function sendMessage(chatId: number | string, text: string, parseMode = "Markdown") {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  }).catch(() => {});
}

async function getFileUrl(fileId: string): Promise<string | null> {
  if (!BOT_TOKEN) return null;
  const res  = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
  const data = await res.json() as { ok: boolean; result?: { file_path?: string } };
  if (!data.ok || !data.result?.file_path) return null;
  return `https://api.telegram.org/file/bot${BOT_TOKEN}/${data.result.file_path}`;
}

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update = await req.json() as Record<string, any>;
    const msg    = update.message ?? update.channel_post;
    if (!msg) return NextResponse.json({ ok: true });

    const chatId   = msg.chat?.id;
    const userId   = String(msg.from?.id ?? chatId);
    const username = msg.from?.username ?? msg.from?.first_name ?? "User";
    const text     = msg.text ?? "";

    // ── /start ──────────────────────────────────────────────────────────────
    if (text.startsWith("/start")) {
      await sendMessage(chatId,
        `👋 *Xin chào ${username}!*\n\n` +
        `Tôi là *StoreScope AI Bot* — phân tích kệ hàng FMCG bằng AI.\n\n` +
        `📸 Gửi ảnh kệ hàng → AI phân tích 8 bước:\n` +
        `  • Đếm sản phẩm & facings\n` +
        `  • Share of Shelf\n` +
        `  • Cảnh báo hết hàng (OSA)\n` +
        `  • Gợi ý tối ưu trưng bày\n\n` +
        `💳 Phí: $0.025 USDC/lần\n\n` +
        `🔗 Liên kết ví tại:\nhttps://storescope-ai.vercel.app/login\n\n` +
        `Sau khi có ví, gửi:\n\`/link <walletId> <walletAddress>\``
      );
      return NextResponse.json({ ok: true });
    }

    // ── /link <walletId> <walletAddress> ────────────────────────────────────
    if (text.startsWith("/link ")) {
      const parts = text.split(" ");
      if (parts.length < 3) {
        await sendMessage(chatId, "❌ Cú pháp: `/link <walletId> <walletAddress>`");
        return NextResponse.json({ ok: true });
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
      return NextResponse.json({ ok: true });
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
      return NextResponse.json({ ok: true });
    }

    // ── Photo message ─────────────────────────────────────────────────────────
    if (msg.photo || msg.document?.mime_type?.startsWith("image/")) {
      await sendMessage(chatId, "⏳ Đang phân tích ảnh... (~10-15 giây)");

      // Get highest resolution photo
      const photo  = msg.photo ? msg.photo[msg.photo.length - 1] : msg.document;
      const fileUrl = await getFileUrl(photo.file_id);
      if (!fileUrl) {
        await sendMessage(chatId, "❌ Không thể tải ảnh. Thử lại.");
        return NextResponse.json({ ok: true });
      }

      // Download and convert to base64
      const imgRes  = await fetch(fileUrl);
      const buffer  = await imgRes.arrayBuffer();
      const base64  = Buffer.from(buffer).toString("base64");
      const mime    = imgRes.headers.get("content-type") ?? "image/jpeg";

      const response = await handleImageMessage("telegram", userId, username, base64, mime);
      await sendMessage(chatId, response.text);
      return NextResponse.json({ ok: true });
    }

    // ── Unknown message ───────────────────────────────────────────────────────
    if (text && !text.startsWith("/")) {
      await sendMessage(chatId,
        `📸 Gửi ảnh kệ hàng để phân tích!\n\n` +
        `Lệnh:\n/start - Hướng dẫn\n/link - Liên kết ví\n/balance - Xem số dư`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Telegram webhook]", err);
    return NextResponse.json({ ok: true }); // always 200 to avoid Telegram retries
  }
}
