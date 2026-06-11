// Personal Telegram Bot Webhook — one bot per user, registered via /api/agent/telegram-bots
// Stateless: the bot's token + wallet info are encoded into [secret] itself, so this
// route works even if the in-memory bot/channel registries were reset (cold start).
import { NextRequest, NextResponse } from "next/server";
import { handleTelegramUpdate } from "../../../../../lib/agent/telegramHandler";
import { decodeBotSecret } from "../../../../../lib/agent/botSecret";
import { getUser, linkUser } from "../../../../../lib/agent/channelStore";

export async function POST(req: NextRequest, { params }: { params: Promise<{ secret: string }> }) {
  try {
    const { secret } = await params;
    const bot = decodeBotSecret(secret);
    if (!bot) return NextResponse.json({ ok: true });

    // Self-heal: re-establish the wallet link if the in-memory store was reset
    if (!getUser("telegram", bot.walletId)) {
      linkUser({
        channel:        "telegram",
        userId:         bot.walletId,
        username:       bot.botUsername,
        circleWalletId: bot.walletId,
        walletAddress:  bot.walletAddress,
        linkedAt:       Date.now(),
        totalAnalyses:  0,
        totalSpentUSDC: 0,
      });
    }

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
