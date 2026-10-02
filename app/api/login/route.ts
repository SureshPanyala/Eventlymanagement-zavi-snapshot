// BLESSED TEMPLATE — app/api/login/route.ts (POST). Uses lib/auth.ts.
// One generic failure message; throttled per IP and per email before the DB.
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createSession } from "@/lib/session";
import {
  LIMITS,
  LOGIN_PAGE,
  clientIp,
  forbidden,
  isCrossSiteRequest,
  landingAfterAuth,
  readCredentials,
  redirectWithError,
  redirectWithSession,
  tooManyAttempts,
  verifyPassword,
} from "@/lib/auth";

export async function POST(req: Request): Promise<NextResponse> {
  if (isCrossSiteRequest(req)) return forbidden();
  const { email, password, invite, next } = await readCredentials(req);
  const throttled = tooManyAttempts([
    { key: `login:ip:${clientIp(req)}`, limit: LIMITS.ip },
    { key: `login:email:${email}`, limit: LIMITS.email },
  ]);
  if (throttled) return redirectWithError(LOGIN_PAGE, "too_many", invite, next);
  if (!email || !password) return redirectWithError(LOGIN_PAGE, "invalid", invite, next);
  let id: number;
  try {
    const found = await query<{ id: number; password_hash: string }>(
      "SELECT id, password_hash FROM users WHERE email = $1",
      [email],
    );
    const row = found.rows[0];
    const ok = await verifyPassword(password, row?.password_hash ?? null);
    if (!row || !ok) return redirectWithError(LOGIN_PAGE, "invalid", invite, next);
    id = row.id;
  } catch (e) {
    console.error("[login] failed", (e as { code?: string })?.code ?? "unknown");
    return redirectWithError(LOGIN_PAGE, "server", invite, next);
  }
  return redirectWithSession(await landingAfterAuth(invite, id, next), createSession(id));
}
