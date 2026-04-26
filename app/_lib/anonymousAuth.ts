// ── Anonymous Identity Generator ─────────────────────────────────────────────

const ADJECTIVES = [
  "Swift", "Bold", "Neon", "Cosmic", "Silent", "Rapid", "Bright", "Sharp",
  "Dark", "Iron", "Silver", "Ghost", "Phantom", "Cipher", "Vortex", "Echo",
  "Nova", "Flux", "Zenith", "Apex", "Ember", "Frost", "Storm", "Blaze",
];

const NOUNS = [
  "Analyst", "Surveyor", "Auditor", "Scout", "Ranger", "Observer",
  "Tracker", "Mapper", "Inspector", "Advisor", "Strategist", "Agent",
  "Operator", "Planner", "Director", "Specialist", "Consultant", "Expert",
];

const AVATAR_COLORS = [
  "#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626",
  "#7c3aed", "#0891b2", "#9333ea", "#16a34a", "#ea580c",
];

export interface AnonUser {
  id: string;          // unique session ID
  displayName: string; // e.g. "SwiftAnalyst#7F2A"
  avatarColor: string;
  avatarInitials: string;
  createdAt: string;
  isAnonymous: true;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomHex(len = 4): string {
  return Math.random().toString(16).slice(2, 2 + len).toUpperCase();
}

export function generateAnonUser(): AnonUser {
  const adj   = pickRandom(ADJECTIVES);
  const noun  = pickRandom(NOUNS);
  const code  = randomHex(4);
  const displayName = `${adj}${noun}#${code}`;
  const color = pickRandom(AVATAR_COLORS);

  return {
    id: `anon_${Date.now()}_${randomHex(8)}`,
    displayName,
    avatarColor: color,
    avatarInitials: (adj[0] + noun[0]).toUpperCase(),
    createdAt: new Date().toISOString(),
    isAnonymous: true,
  };
}

// ── localStorage helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = "storescope-anon-session";

export function saveAnonUser(user: AnonUser): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch { /* ignore */ }
}

export function loadAnonUser(): AnonUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.isAnonymous) return parsed as AnonUser;
    return null;
  } catch { return null; }
}

export function clearAnonUser(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
