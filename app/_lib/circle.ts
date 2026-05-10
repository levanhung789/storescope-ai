// Circle Wallets integration — client-safe types & constants
// API calls happen via /api/circle/* routes (server-side only)

export const CIRCLE_BLOCKCHAIN = "ARC-TESTNET" as const;
export const CIRCLE_STORAGE_KEY = "storescope-circle-session";

export type CircleSession = {
  walletId: string;
  walletAddress: string;
  walletSetId: string;
  userId: string;
};

export type CircleBalance = {
  usdc: string;      // formatted, e.g. "10.50"
  usdcRaw: string;   // raw amount in minor units
};

export type CircleTransferResult = {
  txId: string;
  txHash: string | null;
  state: string;
  amount: string;
};

// localStorage helpers
export function saveCircleSession(session: CircleSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CIRCLE_STORAGE_KEY, JSON.stringify(session));
}

export function loadCircleSession(): CircleSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CIRCLE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCircleSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CIRCLE_STORAGE_KEY);
}

// Format USDC amount (6 decimals on ARC)
export function formatUsdc(raw: string): string {
  const n = Number(raw) / 1_000_000;
  return n.toFixed(2);
}
