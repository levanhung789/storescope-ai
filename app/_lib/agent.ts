// Circle Agent Stack — Agent types & localStorage helpers

export const AGENT_KEY    = "storescope-agent-policy";
export const AGENT_LOG_KEY = "storescope-agent-log";

// Spending policy (human-defined controls)
export type AgentPolicy = {
  enabled:       boolean;
  walletId:      string;
  walletAddress: string;
  maxPerTx:      number;   // USDC max per single transaction
  maxPerDay:     number;   // USDC max per day
  autoRun:       boolean;  // auto-trigger analysis on upload
  allowlist:     string[]; // allowed destination addresses
  createdAt:     string;
  updatedAt:     string;
};

// Agent transaction log entry
export type AgentTx = {
  id:        string;
  timestamp: string;
  type:      "analysis" | "transfer" | "policy_update";
  amount:    number;
  txId:      string | null;    // Circle internal UUID
  txHash:    string | null;    // On-chain hash (for ArcScan)
  status:    "success" | "failed" | "pending";
  note:      string;
};

export function saveAgentPolicy(policy: AgentPolicy): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AGENT_KEY, JSON.stringify(policy));
}

export function loadAgentPolicy(): AgentPolicy | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AGENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearAgentPolicy(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AGENT_KEY);
}

export function loadAgentLog(): AgentTx[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AGENT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function appendAgentLog(tx: AgentTx): void {
  if (typeof window === "undefined") return;
  const logs = loadAgentLog();
  logs.unshift(tx); // newest first
  // keep last 100 entries
  localStorage.setItem(AGENT_LOG_KEY, JSON.stringify(logs.slice(0, 100)));
}

// Calculate total spent today
export function spentToday(logs: AgentTx[]): number {
  const today = new Date().toDateString();
  return logs
    .filter(t => new Date(t.timestamp).toDateString() === today && t.status === "success")
    .reduce((sum, t) => sum + t.amount, 0);
}

// Check if a transaction is within policy limits
export function withinPolicy(policy: AgentPolicy, amount: number, logs: AgentTx[]): {
  allowed: boolean;
  reason?: string;
} {
  if (!policy.enabled) return { allowed: false, reason: "Agent is disabled" };
  if (amount > policy.maxPerTx) return { allowed: false, reason: `Exceeds per-tx limit ($${policy.maxPerTx} USDC)` };
  const todaySpent = spentToday(logs);
  if (todaySpent + amount > policy.maxPerDay) {
    return { allowed: false, reason: `Daily limit reached ($${policy.maxPerDay} USDC/day, spent $${todaySpent.toFixed(3)})` };
  }
  return { allowed: true };
}
