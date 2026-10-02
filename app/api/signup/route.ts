// BLESSED TEMPLATE — app/api/signup/route.ts (POST). Uses lib/auth.ts.
// Duplicate email = Postgres unique violation 23505 on INSERT. Inserts only
// (email, password_hash, name): the role is the DB default 'user'.
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { createSession } from "@/lib/session";
import {
  BCRYPT_ROUNDS,
  LIMITS,
  SIGNUP_PAGE,
  clientIp,
  forbidden,
  isCrossSiteRequest,
  isValidEmail,
  landingAfterAuth,
  readCredentials,
  redirectWithError,
  redirectWithSession,
  tooManyAttempts,
} from "@/lib/auth";

export async function POST(req: Request): Promise<NextResponse> {
  if (isCrossSiteRequest(req)) return forbidden();
  const { email, password, invite, name, next } = await readCredentials(req);
  if (tooManyAttempts([{ key: `signup:ip:${clientIp(req)}`, limit: LIMITS.ip }])) {
    return redirectWithError(SIGNUP_PAGE, "too_many", invite, next);
  }
  if (!name || !isValidEmail(email) || password.length < 8) {
    return redirectWithError(SIGNUP_PAGE, "bad_input", invite, next);
  }
  let id: number;
  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const inserted = await query<{ id: number }>(
      "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id",
      [email, passwordHash, name],
    );
    id = inserted.rows[0].id;
  } catch (e) {
    if ((e as { code?: string })?.code === "23505") return redirectWithError(SIGNUP_PAGE, "exists", invite, next);
    console.error("[signup] failed", (e as { code?: string })?.code ?? "unknown");
    return redirectWithError(SIGNUP_PAGE, "server", invite, next);
  }
  return redirectWithSession(await landingAfterAuth(invite, id, next), createSession(id));
}
