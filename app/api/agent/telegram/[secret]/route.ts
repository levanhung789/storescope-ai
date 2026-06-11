// Personal Telegram Bot Webhook — one bot per user, registered via /api/agent/telegram-bots
import { NextRequest, NextResponse } from "next/server";
import { handleTelegramUpdate } from "../../../../../lib/agent/telegramHandler";
import { getBotBySecret } from "../../../../../lib/agent/channelStore";

export async function POST(req: NextRequest, { params }: { params: Promise<{ secret: string }> }) {
  try {
    const { secret } = await params;
    const bot = getBotBySecret("telegram", secret);
    if (!bot) return NextResponse.json({ ok: true });

    const update = await req.json();
    await handleTelegramUpdate(bot.token, update, {
      mode:          "personal",
      walletId:      bot.walletId,
      walletAddress: bot.walletAddress,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Telegram personal webhook]", err);
    return NextResponse.json({ ok: true }); // always 200 to avoid Telegram retries
  }
}
