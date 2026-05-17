import { NextRequest, NextResponse } from "next/server";
import { setTx, pruneOld } from "../../../_lib/txStore";

// Circle sends webhook notifications for transaction state changes.
// Docs: https://developers.circle.com/developer/docs/notifications-quickstart
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Circle wraps notifications in a { notification: { ... } } envelope
    const notification = body?.notification ?? body;
    const type: string = notification?.notificationType ?? notification?.type ?? "";

    if (type === "transactions.inbound" || type === "transactions.outbound" || type.startsWith("transaction")) {
      const tx = notification?.transaction ?? notification;
      const txId: string  = tx?.id ?? "";
      const txHash: string | null = tx?.txHash ?? tx?.transactionHash ?? null;
      const state: string = tx?.state ?? "";

      if (txId && state) {
        pruneOld();
        setTx(txId, { txId, txHash, state });
        console.log(`[Circle Webhook] tx=${txId} state=${state} hash=${txHash}`);
      }
    }

    // Always return 200 so Circle doesn't retry
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Circle Webhook] parse error:", err);
    return NextResponse.json({ ok: true }); // still 200 to avoid retries
  }
}
