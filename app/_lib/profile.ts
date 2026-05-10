// Account profile — client-safe, stored in localStorage

export const PROFILE_KEY = "storescope-profile";

export type UserProfile = {
  email: string;       // from Circle session userId or anon
  username: string;
  passwordHash: string; // simple hash for demo
  createdAt: string;
  updatedAt: string;
};

// Simple deterministic hash (demo only — not for production auth)
export function hashPassword(password: string): string {
  let h = 0;
  for (let i = 0; i < password.length; i++) {
    h = (Math.imul(31, h) + password.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, "0");
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_KEY);
}
