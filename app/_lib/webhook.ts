/**
 * Circle Gateway Webhook — types & in-memory deduplication
 */

export type GatewayEventType =
  | "gateway.deposit.finalized"
  | "gateway.mint.finalized"
  | "gateway.mint.forwarded";

export interface GatewayEventData {
  id:            string;
  walletId?:     string;
  chain?:        string;
  token?:        string;
  tokenId?:      string;
  amount?:       string;
  txHash?:       string;
  blockNumber?:  number;
  status?:       string;
  fromAddress?:  string;
  toAddress?:    string;
  recipient?:    string;
  createDate?:   string;
  finalizedDate?: string;
}

export interface GatewayWebhookPayload {
  notificationId: string;
  timestamp:      string;
  eventType:      GatewayEventType;
  data:           GatewayEventData;
}

// In-memory dedup store — keeps last 2000 notification IDs
// (resets on server restart — acceptable for demo/testnet)
const processedIds = new Set<string>();
const MAX_IDS = 2000;

export function isDuplicate(notificationId: string): boolean {
  return processedIds.has(notificationId);
}

export function markProcessed(notificationId: string): void {
  if (processedIds.size >= MAX_IDS) {
    // Remove oldest 500 entries
    const arr = Array.from(processedIds);
    arr.slice(0, 500).forEach(id => processedIds.delete(id));
  }
  processedIds.add(notificationId);
}

// In-memory event log (last 50 webhook events for admin dashboard)
export interface WebhookLogEntry {
  notificationId: string;
  eventType:      GatewayEventType;
  amount?:        string;
  txHash?:        string;
  walletId?:      string;
  status:         "processed" | "duplicate" | "error";
  receivedAt:     string;
  error?:         string;
}

const eventLog: WebhookLogEntry[] = [];

export function logWebhookEvent(entry: WebhookLogEntry): void {
  eventLog.unshift(entry);
  if (eventLog.length > 50) eventLog.length = 50;
}

export function getWebhookLog(): WebhookLogEntry[] {
  return [...eventLog];
}
