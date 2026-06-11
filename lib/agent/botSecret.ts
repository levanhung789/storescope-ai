// Stateless personal-bot webhook secret — encodes (encrypted) bot config into the
// webhook URL itself, so the route works even if in-memory registries are wiped
// between serverless cold starts/instances.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import type { Channel } from "./channelStore";

const KEY = createHash("sha256")
  .update(process.env.CIRCLE_ENTITY_SECRET ?? "storescope-ai-dev-fallback")
  .digest();

export interface PersonalBotPayload {
  channel:       Channel;
  token:         string;
  walletId:      string;
  walletAddress: string;
  botUsername:   string;
}

export function encodeBotSecret(payload: PersonalBotPayload): string {
  const iv     = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const enc    = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag    = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decodeBotSecret(secret: string): PersonalBotPayload | null {
  try {
    const buf = Buffer.from(secret, "base64url");
    const iv  = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return JSON.parse(dec.toString("utf8")) as PersonalBotPayload;
  } catch {
    return null;
  }
}
