// Channel Store — links chat userIds to Circle wallets
// Telegram userId / Zalo userId → Circle walletId

export type Channel = "telegram" | "zalo" | "webchat";

export interface ChannelUser {
  channel:       Channel;
  userId:        string;   // Telegram/Zalo user ID
  username?:     string;
  circleWalletId:   string;
  walletAddress:    string;
  linkedAt:      number;
  totalAnalyses: number;
  totalSpentUSDC: number;
}

export interface ChannelMessage {
  id:         string;
  channel:    Channel;
  userId:     string;
  username?:  string;
  type:       "image" | "text" | "result";
  content:    string;       // text or base64 image
  analysisId? : string;
  cost?:      number;
  timestamp:  number;
  status:     "pending" | "analyzing" | "done" | "error" | "insufficient_funds";
}

// Global stores
const g = globalThis as typeof globalThis & {
  __channelUsers?:    Map<string, ChannelUser>;
  __channelMessages?: ChannelMessage[];
};
if (!g.__channelUsers)    g.__channelUsers    = new Map();
if (!g.__channelMessages) g.__channelMessages = [];

function userKey(channel: Channel, userId: string) { return `${channel}:${userId}`; }

// ── User management ────────────────────────────────────────────────────────────
export function linkUser(user: ChannelUser): void {
  g.__channelUsers!.set(userKey(user.channel, user.userId), user);
}

export function getUser(channel: Channel, userId: string): ChannelUser | null {
  return g.__channelUsers!.get(userKey(channel, userId)) ?? null;
}

export function updateUserStats(channel: Channel, userId: string, cost: number) {
  const u = getUser(channel, userId);
  if (!u) return;
  u.totalAnalyses++;
  u.totalSpentUSDC = Math.round((u.totalSpentUSDC + cost) * 1000) / 1000;
  g.__channelUsers!.set(userKey(channel, userId), u);
}

export function getAllUsers(): ChannelUser[] {
  return [...g.__channelUsers!.values()];
}

// ── Message history ────────────────────────────────────────────────────────────
export function addMessage(msg: Omit<ChannelMessage, "id" | "timestamp">): ChannelMessage {
  const full: ChannelMessage = {
    ...msg,
    id:        `MSG-${Date.now().toString(36).toUpperCase()}`,
    timestamp: Date.now(),
  };
  g.__channelMessages!.unshift(full);
  if (g.__channelMessages!.length > 500) g.__channelMessages!.splice(500);
  return full;
}

export function updateMessage(id: string, patch: Partial<ChannelMessage>) {
  const idx = g.__channelMessages!.findIndex(m => m.id === id);
  if (idx >= 0) Object.assign(g.__channelMessages![idx], patch);
}

export function getMessages(channel?: Channel, limit = 50): ChannelMessage[] {
  const all = g.__channelMessages!;
  return (channel ? all.filter(m => m.channel === channel) : all).slice(0, limit);
}

// ── Channel stats ──────────────────────────────────────────────────────────────
export function getChannelStats() {
  const users = getAllUsers();
  const msgs  = g.__channelMessages!;
  return {
    telegram: {
      users:    users.filter(u => u.channel === "telegram").length,
      analyses: msgs.filter(m => m.channel === "telegram" && m.type === "result").length,
    },
    zalo: {
      users:    users.filter(u => u.channel === "zalo").length,
      analyses: msgs.filter(m => m.channel === "zalo" && m.type === "result").length,
    },
    webchat: {
      users:    users.filter(u => u.channel === "webchat").length,
      analyses: msgs.filter(m => m.channel === "webchat" && m.type === "result").length,
    },
    totalRevenue: users.reduce((s, u) => s + u.totalSpentUSDC, 0),
  };
}
