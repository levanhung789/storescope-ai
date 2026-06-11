// Telegram Bot Webhook Handler — shared StoreScope bot
// Setup: POST https://api.telegram.org/bot{TOKEN}/setWebhook?url={BASE_URL}/api/agent/telegram

import { NextRequest, NextResponse } from "next/server";
import { handleTelegramUpdate } from "../../../../lib/agent/telegramHandler";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    await handleTelegramUpdate(BOT_TOKEN, update, { mode: "shared" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Telegram webhook]", err);
    return NextResponse.json({ ok: true }); // always 200 to avoid Telegram retries
  }
}
