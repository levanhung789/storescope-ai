import { NextRequest, NextResponse } from "next/server";
import { getChannelStats, getAllUsers, getMessages, linkUser, type Channel } from "../../../../lib/agent/channelStore";
import { handleImageMessage } from "../../../../lib/agent/channelHandler";

// GET — stats + messages
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "stats";
  const channel = req.nextUrl.searchParams.get("channel") as Channel | undefined;

  if (type === "messages") {
    return NextResponse.json({ messages: getMessages(channel, 100) });
  }
  if (type === "users") {
    return NextResponse.json({ users: getAllUsers() });
  }
  return NextResponse.json({
    stats: getChannelStats(),
    webhooks: {
      telegram: `${getBase()}/api/agent/telegram`,
      zalo:     `${getBase()}/api/agent/zalo`,
      webchat:  `${getBase()}/api/agent/channels`,
    },
    configured: {
      telegram: !!process.env.TELEGRAM_BOT_TOKEN,
      zalo:     !!process.env.ZALO_OA_TOKEN,
    },
  });
}

// POST — webchat message OR link user
export async function POST(req: NextRequest) {
  const body = await req.json() as Record<string, unknown>;
  const action = body.action as string;

  // ── Link user ──────────────────────────────────────────────────────────────
  if (action === "link") {
    const { channel, userId, walletId, walletAddress, username } = body as {
      channel: Channel; userId: string; walletId: string; walletAddress: string; username?: string;
    };
    linkUser({ channel, userId, username, circleWalletId: walletId, walletAddress, linkedAt: Date.now(), totalAnalyses: 0, totalSpentUSDC: 0 });
    return NextResponse.json({ success: true });
  }

  // ── Webchat image analysis ─────────────────────────────────────────────────
  if (action === "analyze") {
    const { userId, username, imageBase64, mimeType } = body as {
      userId: string; username?: string; imageBase64: string; mimeType?: string;
    };
    const response = await handleImageMessage("webchat", userId, username, imageBase64, mimeType ?? "image/jpeg");
    return NextResponse.json(response);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

function getBase() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
