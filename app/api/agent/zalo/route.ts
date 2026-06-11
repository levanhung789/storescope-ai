// Zalo OA Webhook Handler
// Setup: Register webhook URL at developers.zalo.me → Official Account → Webhook

import { NextRequest, NextResponse } from "next/server";
import { handleImageMessage } from "../../../../lib/agent/channelHandler";
import { getUser, linkUser } from "../../../../lib/agent/channelStore";
import { createHmac } from "crypto";

const OA_TOKEN    = process.env.ZALO_OA_TOKEN    ?? "";
const APP_SECRET  = process.env.ZALO_APP_SECRET  ?? "";

// Verify Zalo webhook signature
function verifySignature(body: string, signature: string): boolean {
  if (!APP_SECRET) return true; // skip in dev
  const expected = createHmac("sha256", APP_SECRET).update(body).digest("hex");
  return expected === signature;
}

async function sendZaloMessage(userId: string, text: string) {
  if (!OA_TOKEN) return;
  await fetch("https://openapi.zalo.me/v2.0/oa/message", {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      "access_token": OA_TOKEN,
    },
    body: JSON.stringify({
      recipient: { user_id: userId },
      message:   { text: text.slice(0, 2000) }, // Zalo text limit
    }),
  }).catch(() => {});
}

// GET — Zalo webhook verification
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get("challenge") ?? "";
  return new Response(challenge, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody  = await req.text();
    const sig      = req.headers.get("x-zevent-signature") ?? "";
    if (APP_SECRET && !verifySignature(rawBody, sig)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as Record<string, unknown>;
    const eventName = event.event_name as string;
    const sender    = (event.sender as Record<string, string>)?.id;
    const recipient = (event.recipient as Record<string, string>)?.id;
    void recipient;

    if (!sender) return NextResponse.json({ ok: true });

    // ── User follow OA ────────────────────────────────────────────────────────
    if (eventName === "follow") {
      await sendZaloMessage(sender,
        "👋 Xin chào! Tôi là StoreScope AI Bot.\n\n" +
        "📸 Gửi ảnh kệ hàng → AI phân tích 8 bước (OSA, SoS, Recommendations)\n\n" +
        "💳 Phí: 0.025 USDC/lần\n\n" +
        `🔗 User ID của bạn: ${sender}\n\n` +
        "Vào https://storescope-ai.vercel.app/dashboard/agent → mục \"Zalo OA\" → dán User ID này để liên kết với ví Circle của bạn."
      );
      return NextResponse.json({ ok: true });
    }

    // ── Text message ──────────────────────────────────────────────────────────
    if (eventName === "user_send_text") {
      const text = ((event.message as Record<string, unknown>)?.text as string) ?? "";

      if (text.startsWith("/link ")) {
        const parts = text.split(" ");
        if (parts.length < 3) {
          await sendZaloMessage(sender, "❌ Cú pháp: /link <walletId> <walletAddress>");
        } else {
          linkUser({
            channel:        "zalo",
            userId:         sender,
            circleWalletId: parts[1],
            walletAddress:  parts[2],
            linkedAt:       Date.now(),
            totalAnalyses:  0,
            totalSpentUSDC: 0,
          });
          await sendZaloMessage(sender, "✅ Đã liên kết ví thành công! Gửi ảnh kệ hàng để bắt đầu.");
        }
        return NextResponse.json({ ok: true });
      }

      if (text.startsWith("/balance")) {
        const user = getUser("zalo", sender);
        if (!user) {
          await sendZaloMessage(sender, "⚠️ Chưa liên kết ví. Nhắn: /link <walletId> <address>");
        } else {
          await sendZaloMessage(sender,
            `💰 Số dư: $${user.totalSpentUSDC} đã dùng\nTổng phân tích: ${user.totalAnalyses} lần`
          );
        }
        return NextResponse.json({ ok: true });
      }

      await sendZaloMessage(sender, "📸 Gửi ảnh kệ hàng để phân tích!\n/link - Liên kết ví\n/balance - Xem số dư");
    }

    // ── Image message ─────────────────────────────────────────────────────────
    if (eventName === "user_send_image") {
      const attachments = (event.message as Record<string, unknown>)?.attachments as Record<string, string>[];
      const imageUrl    = attachments?.[0]?.payload;
      if (!imageUrl) return NextResponse.json({ ok: true });

      await sendZaloMessage(sender, "⏳ Đang phân tích ảnh... (~15 giây)");

      const imgRes  = await fetch(imageUrl);
      const buffer  = await imgRes.arrayBuffer();
      const base64  = Buffer.from(buffer).toString("base64");
      const mime    = imgRes.headers.get("content-type") ?? "image/jpeg";

      const response = await handleImageMessage("zalo", sender, undefined, base64, mime);

      // Zalo has 2000 char limit — split if needed
      const text = response.text;
      if (text.length <= 2000) {
        await sendZaloMessage(sender, text);
      } else {
        await sendZaloMessage(sender, text.slice(0, 1990) + "...");
        await sendZaloMessage(sender, "📊 Xem báo cáo đầy đủ tại: https://storescope-ai.vercel.app/dashboard/analysis");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Zalo webhook]", err);
    return NextResponse.json({ ok: true });
  }
}
