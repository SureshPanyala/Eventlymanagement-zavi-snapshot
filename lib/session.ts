// ─────────────────────────────────────────────────────────────────────────────
// BLESSED TEMPLATE — lib/session.ts  (signed, expiring session token)
// Fail-closed SESSION_SECRET (no fallback), HMAC-SHA256, exp inside the signed
// payload, uid coerced to a number on both ends.
// ─────────────────────────────────────────────────────────────────────────────
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  // No fallback — fail closed. NEVER `process.env.SESSION_SECRET || '<default>'`.
  if (!s || s.length < 16) {
    throw new Error(
      "SESSION_SECRET is not set — refusing to sign/verify with a guessable key",
    );
  }
  return s;
}

const MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days

function sign(payloadB64: string): string {
  return createHmac("sha256", sessionSecret()).update(payloadB64).digest("base64url");
}

export function createSession(uid: number | string): string {
  const payload = { uid: Number(uid), exp: Math.floor(Date.now() / 1000) + MAX_AGE_S };
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${b64}.${sign(b64)}`;
}

export function readSession(token: string | undefined): { uid: number } | null {
  if (!token) return null;
  const [b64, mac] = token.split(".");
  if (!b64 || !mac) return null;
  const expected = sign(b64);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null; // bad signature
  const { uid, exp } = JSON.parse(Buffer.from(b64, "base64url").toString());
  if (!exp || exp < Math.floor(Date.now() / 1000)) return null; // expired
  const id = Number(uid);
  if (!Number.isInteger(id)) return null;
  return { uid: id };
}
