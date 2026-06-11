// Personal Telegram Bot registration — each user connects their own @BotFather bot
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { registerBot, getBotByWallet, removeBot, linkUser, getUser } from "../../../../lib/agent/channelStore";

// GET ?walletId=... — returns current bot connection status
export async function GET(req: NextRequest) {
  const walletId = req.nextUrl.searchParams.get("walletId") ?? "";
  if (!walletId) return NextResponse.json({ connected: false });

  const bot = getBotByWallet("telegram", walletId);
  if (!bot) return NextResponse.json({ connected: false });

  return NextResponse.json({ connected: true, botUsername: bot.botUsername });
}

// POST { walletId, walletAddress, token } — validate token, register webhook
export async function POST(req: NextRequest) {
  try {
    const { walletId, walletAddress, token } = await req.json() as {
      walletId?: string; walletAddress?: string; token?: string;
    };

    if (!walletId || !walletAddress || !token) {
      return NextResponse.json({ error: "Thiếu walletId, walletAddress hoặc token" }, { status: 400 });
    }

    // Validate token via getMe
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`).catch(() => null);
    const me = await meRes?.json().catch(() => null) as { ok?: boolean; result?: { username?: string } } | null;
    if (!me?.ok || !me.result?.username) {
      return NextResponse.json({ error: "Bot token không hợp lệ" }, { status: 400 });
    }

    const secret  = randomBytes(16).toString("hex");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const webhookUrl = `${baseUrl}/api/agent/telegram/${secret}`;

    const setRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    const setData = await setRes.json() as { ok?: boolean; description?: string };
    if (!setData.ok) {
      return NextResponse.json({ error: setData.description ?? "Không thể đăng ký webhook" }, { status: 400 });
    }

    registerBot({
      channel:       "telegram",
      secret,
      token,
      botUsername:   me.result.username,
      walletId,
      walletAddress,
      createdAt:     Date.now(),
    });

    // Auto-link this personal bot's wallet so handleImageMessage recognizes it
    if (!getUser("telegram", walletId)) {
      linkUser({
        channel:        "telegram",
        userId:         walletId,
        username:       me.result.username,
        circleWalletId: walletId,
        walletAddress,
        linkedAt:       Date.now(),
        totalAnalyses:  0,
        totalSpentUSDC: 0,
      });
    }

    return NextResponse.json({ ok: true, botUsername: me.result.username });
  } catch (err) {
    console.error("[telegram-bots POST]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// DELETE { walletId } — disconnect bot, remove webhook
export async function DELETE(req: NextRequest) {
  try {
    const { walletId } = await req.json() as { walletId?: string };
    if (!walletId) return NextResponse.json({ error: "Thiếu walletId" }, { status: 400 });

    const bot = removeBot("telegram", walletId);
    if (bot) {
      await fetch(`https://api.telegram.org/bot${bot.token}/deleteWebhook`).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram-bots DELETE]", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
