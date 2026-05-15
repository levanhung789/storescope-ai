/**
 * POST /api/webhooks/gateway
 * Circle Gateway Webhook Handler
 *
 * Receives real-time notifications when USDC deposits/mints finalize.
 * Replaces manual balance polling with push-based event handling.
 *
 * Setup:
 *  1. Register this URL at console.circle.com → Developer → Subscriptions
 *  2. URL: https://storescope-ai.vercel.app/api/webhooks/gateway
 *  3. Types: gateway.* (all gateway events)
 */
import { NextRequest, NextResponse } from "next/server";
import { createVerify } from "crypto";
import {
  isDuplicate, markProcessed, logWebhookEvent,
  type GatewayWebhookPayload,
} from "../../../_lib/webhook";

// ── Circle public key cache ────────────────────────────────────────────────
let cachedKeys: Record<string, string> = {};
let cacheTime  = 0;

async function getCirclePublicKey(keyId: string): Promise<string | null> {
  const now = Date.now();
  // Refresh cache every hour
  if (now - cacheTime > 3_600_000) {
    try {
      const res  = await fetch("https://api.circle.com/v1/notifications/keys", {
        headers: { Authorization: `Bearer ${process.env.CIRCLE_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const json = await res.json() as { keys?: { keyId: string; publicKey: string }[] };
        cachedKeys  = {};
        for (const k of json.keys ?? []) cachedKeys[k.keyId] = k.publicKey;
        cacheTime   = now;
      }
    } catch { /* use cached */ }
  }
  return cachedKeys[keyId] ?? null;
}

// ── Signature verification ─────────────────────────────────────────────────
function verifySignature(
  timestamp: string,
  body:      string,
  signature: string,
  pubKey:    string,
): boolean {
  try {
    const message  = `${timestamp}.${body}`;
    const verifier = createVerify("SHA256");
    verifier.update(message);
    return verifier.verify(pubKey, Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

// ── Event handlers ─────────────────────────────────────────────────────────
async function onDepositFinalized(data: GatewayWebhookPayload["data"]) {
  console.log(`[Gateway] Deposit finalized: ${data.amount} USDC from ${data.fromAddress}`);
  console.log(`[Gateway] TX: ${data.txHash} · Wallet: ${data.walletId}`);

  // Auto-trigger analysis if wallet is registered service wallet
  const serviceWallet = process.env.SERVICE_WALLET?.toLowerCase();
  const toAddr        = data.toAddress?.toLowerCase();

  if (serviceWallet && toAddr === serviceWallet) {
    console.log(`[Gateway] Service wallet received ${data.amount} USDC — updating balance cache`);
    // Future: trigger pending analysis queue
  }
}

async function onMintFinalized(data: GatewayWebhookPayload["data"]) {
  console.log(`[Gateway] Mint finalized: ${data.amount} USDC → ${data.recipient}`);
  console.log(`[Gateway] TX: ${data.txHash} · Chain: ${data.chain}`);
}

async function onMintForwarded(data: GatewayWebhookPayload["data"]) {
  console.log(`[Gateway] Mint forwarded: ${data.amount} USDC`);
}

// ── POST handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody  = await req.text();
  const signature = req.headers.get("x-circle-signature")   ?? "";
  const keyId     = req.headers.get("x-circle-key-id")      ?? "";
  const timestamp = req.headers.get("x-circle-timestamp")   ?? "";

  // ── 1. Parse payload ────────────────────────────────────────────────────
  let payload: GatewayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as GatewayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { notificationId, eventType, data } = payload;

  // ── 2. Signature verification (skip if no keys configured) ──────────────
  if (signature && keyId && timestamp) {
    const pubKey = await getCirclePublicKey(keyId);
    if (pubKey) {
      const valid = verifySignature(timestamp, rawBody, signature, pubKey);
      if (!valid) {
        logWebhookEvent({
          notificationId, eventType, status: "error",
          receivedAt: new Date().toISOString(),
          error: "Invalid signature",
        });
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }
    // If pubKey not found, log warning but continue (key might not be cached yet)
  }

  // ── 3. Deduplication ───────────────────────────────────────────────────
  if (isDuplicate(notificationId)) {
    logWebhookEvent({
      notificationId, eventType,
      amount: data.amount, txHash: data.txHash, walletId: data.walletId,
      status: "duplicate", receivedAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, skipped: true, reason: "duplicate" });
  }

  // ── 4. Handle event ────────────────────────────────────────────────────
  try {
    if (eventType === "gateway.deposit.finalized") await onDepositFinalized(data);
    else if (eventType === "gateway.mint.finalized")   await onMintFinalized(data);
    else if (eventType === "gateway.mint.forwarded")   await onMintForwarded(data);
    else console.log(`[Gateway] Unknown event type: ${eventType}`);

    markProcessed(notificationId);
    logWebhookEvent({
      notificationId, eventType,
      amount: data.amount, txHash: data.txHash, walletId: data.walletId,
      status: "processed", receivedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, notificationId });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logWebhookEvent({
      notificationId, eventType,
      amount: data.amount, txHash: data.txHash,
      status: "error", receivedAt: new Date().toISOString(), error: msg,
    });
    // Return 500 so Circle retries
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── HEAD handler — Circle tests endpoint connectivity with HEAD ────────────
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

// ── GET handler — returns 200 for Circle connectivity check, admin log with token ──
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  // Without token: return 200 OK (Circle uses GET to verify endpoint)
  if (token !== (process.env.ADMIN_TOKEN ?? "storescope-admin-2026")) {
    return NextResponse.json({ ok: true, service: "StoreScope AI Gateway Webhook" }, { status: 200 });
  }
  const { getWebhookLog } = await import("../../../_lib/webhook");
  return NextResponse.json({
    endpoint:    "/api/webhooks/gateway",
    status:      "live",
    publicUrl:   "https://storescope-ai.vercel.app/api/webhooks/gateway",
    supportedEvents: ["gateway.deposit.finalized", "gateway.mint.finalized", "gateway.mint.forwarded"],
    recentEvents: getWebhookLog(),
  });
}
