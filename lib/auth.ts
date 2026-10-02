// ─────────────────────────────────────────────────────────────────────────────
// BLESSED TEMPLATE — lib/auth.ts  (shared helpers for the signup/login/logout routes)
//
// Configured for Evently: landing paths, a display `name` on signup, and a
// validated same-site `next` path so "Register now" returns the visitor to the
// registration form after they sign up or log in.
//
//   • Cookie is httpOnly + Secure + SameSite=Lax, signed via lib/session.ts.
//   • REDIRECT BASELINE: a RELATIVE `Location`, never new URL(path, req.url).
//   • CROSS-SITE POSTs (login CSRF) get a plain 403 before any other work.
//   • GENERIC failures + constant-cost bcrypt compare (no user enumeration).
//   • THROTTLE: per-IP + per-email sliding window, in-process. WATCH-TRIGGER: this
//     Map lives in ONE process; when the site runs >1 instance, move it to a DB table.
//   • ?error=<code> only, mapped to fixed copy by authErrorMessage().
//   • ROLES: users.role is 'user' | 'admin' (DB default 'user'). Only redeemInvite()
//     grants a role. Gate admin-only surfaces with requireAdmin*().
// ─────────────────────────────────────────────────────────────────────────────
import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { notFound, redirect as goTo } from "next/navigation";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query, withTransaction } from "@/lib/db";
import { readSession } from "@/lib/session";

export const AFTER_LOGIN = "/events";
export const LOGIN_PAGE = "/login";
export const SIGNUP_PAGE = "/signup";

const COOKIE = "session";
const COOKIE_ATTRS = "Path=/; HttpOnly; Secure; SameSite=Lax";
const MAX_AGE_S = 60 * 60 * 24 * 7;
export const BCRYPT_ROUNDS = 12;

/** 303 with a RELATIVE Location — the browser resolves it against the public origin. */
export function redirect(path: string): NextResponse {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

const ERRORS = {
  too_many: "Too many attempts. Wait a few minutes and try again.",
  bad_input: "Enter your name, a valid email and a password of at least 8 characters.",
  exists: "Couldn't create that account. If you already have one, sign in.",
  invalid: "Invalid email or password.",
  server: "Something went wrong. Try again.",
  invite: "This invite link has expired or was already used. Ask the site owner for a new one.",
} as const;
export type AuthError = keyof typeof ERRORS;

/** Fixed copy for a ?error= code; null for anything else (never echo the URL). */
export function authErrorMessage(code: string | undefined): string | null {
  return typeof code === "string" && Object.prototype.hasOwnProperty.call(ERRORS, code) ? ERRORS[code as AuthError] : null;
}

/** Only an in-app path ("/events/3/register") is allowed as a post-auth target:
 *  never "//host", a scheme, or backslashes (open-redirect guard). */
export function safeNext(next: string | undefined | null): string {
  if (typeof next !== "string") return "";
  if (!/^\/[A-Za-z0-9\-_/?=&.%]*$/.test(next) || next.startsWith("//")) return "";
  return next.slice(0, 200);
}

/** Keeps a well-formed invite / next path on the redirect so a failed attempt can retry. */
export function redirectWithError(page: string, code: AuthError, invite = "", next = ""): NextResponse {
  const q = new URLSearchParams({ error: code });
  if (isInviteToken(invite)) q.set("invite", invite);
  const n = safeNext(next);
  if (n) q.set("next", n);
  return redirect(`${page}?${q}`);
}

export function redirectWithSession(path: string, token: string): NextResponse {
  const res = redirect(path);
  res.headers.append("Set-Cookie", `${COOKIE}=${token}; ${COOKIE_ATTRS}; Max-Age=${MAX_AGE_S}`);
  return res;
}

export function redirectClearingSession(path: string): NextResponse {
  const res = redirect(path);
  res.headers.append("Set-Cookie", `${COOKIE}=; ${COOKIE_ATTRS}; Max-Age=0`);
  return res;
}

/** Credentials from a form POST. Never throws. Any other field (e.g. a posted
 *  "role") is ignored. */
export async function readCredentials(
  req: Request,
): Promise<{ email: string; password: string; invite: string; name: string; next: string }> {
  try {
    const form = await req.formData();
    return {
      email: String(form.get("email") ?? "").trim().toLowerCase().slice(0, 254),
      password: String(form.get("password") ?? "").slice(0, 200),
      invite: String(form.get("invite") ?? "").slice(0, 200),
      name: String(form.get("name") ?? "").trim().slice(0, 80),
      next: safeNext(String(form.get("next") ?? "")),
    };
  } catch {
    return { email: "", password: "", invite: "", name: "", next: "" };
  }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Client IP for the per-IP throttle: the LAST X-Forwarded-For hop. */
export function clientIp(req: Request): string {
  const hops = (req.headers.get("x-forwarded-for") ?? "").split(",").map((h) => h.trim()).filter(Boolean);
  return hops[hops.length - 1] || req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Login-CSRF guard. No Origin and no Sec-Fetch-Site = allow (old clients). */
export function isCrossSiteRequest(req: Request): boolean {
  if (req.headers.get("sec-fetch-site") === "cross-site") return true;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].trim();
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

export function forbidden(): NextResponse {
  return new NextResponse("Forbidden", { status: 403 });
}

// ── throttle: sliding window, bounded ────────────────────────────────────────
const WINDOW_MS = 15 * 60 * 1000;
export const LIMITS = { ip: 30, email: 10 } as const;
const MAX_KEYS = 10_000;
const attempts = new Map<string, number[]>();

export function tooManyAttempts(keys: Array<{ key: string; limit: number }>, now = Date.now()): boolean {
  let blocked = false;
  for (const { key, limit } of keys) {
    const recent = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    attempts.delete(key);
    attempts.set(key, recent);
    if (recent.length > limit) blocked = true;
  }
  while (attempts.size > MAX_KEYS) {
    const oldest = attempts.keys().next().value;
    if (oldest === undefined) break;
    attempts.delete(oldest);
  }
  return blocked;
}

let dummyHash: string | null = null;
export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  if (hash) return bcrypt.compare(password, hash);
  dummyHash ??= await bcrypt.hash("not-a-real-password", BCRYPT_ROUNDS);
  await bcrypt.compare(password, dummyHash);
  return false;
}

export type Role = "user" | "admin";
export type SiteUser = { id: number; email: string; role: Role; name: string; avatar_url: string | null };

/** The logged-in user, or null. Role is re-read from the DB on EVERY request. */
export async function currentUser(): Promise<SiteUser | null> {
  const sess = readSession(cookies().get(COOKIE)?.value);
  if (!sess) return null;
  const r = await query<SiteUser>("SELECT id, email, role, name, avatar_url FROM users WHERE id = $1", [sess.uid]);
  return r.rows[0] ?? null;
}

/** Signed-in PAGE: signed out -> /login (or `page`) ?next=<path>. */
export async function requireUserPage(next: string, page: string = LOGIN_PAGE): Promise<SiteUser> {
  const user = await currentUser();
  if (!user) {
    const n = safeNext(next);
    goTo(n ? `${page}?next=${encodeURIComponent(n)}` : page);
  }
  return user;
}

/** Admin-only PAGE (server component): signed out -> /login; not admin -> 404. */
export async function requireAdminPage(): Promise<SiteUser> {
  const user = await currentUser();
  if (!user) goTo(LOGIN_PAGE);
  if (user.role !== "admin") notFound();
  return user;
}

/** Admin-only ROUTE HANDLER. */
export async function requireAdminRoute(): Promise<
  { user: SiteUser; error: null } | { user: null; error: NextResponse }
> {
  const user = await currentUser();
  if (!user) return { user: null, error: new NextResponse("Unauthorized", { status: 401 }) };
  if (user.role !== "admin") return { user: null, error: forbidden() };
  return { user, error: null };
}

/** Admin-only SERVER ACTION: call first; throws unless the caller is an admin. */
export async function requireAdminAction(): Promise<SiteUser> {
  const user = await currentUser();
  if (user?.role !== "admin") throw new Error("Forbidden");
  return user;
}

// ── invites: the ONLY way a role is granted ─────────────────────────────────
const INVITE_TOKEN = /^[A-Za-z0-9_-]{20,128}$/;
export function isInviteToken(t: string | undefined): t is string {
  return typeof t === "string" && INVITE_TOKEN.test(t);
}

export async function redeemInvite(token: string, userId: number): Promise<Role | null> {
  if (!isInviteToken(token)) return null;
  const hash = createHash("sha256").update(token).digest("hex");
  return withTransaction(async (c) => {
    const inv = await c.query<{ role: Role }>(
      "UPDATE invites SET used_at = now(), used_by = $2 WHERE token_hash = $1 AND used_at IS NULL AND revoked_at IS NULL AND expires_at > now() RETURNING role",
      [hash, userId],
    );
    const role = inv.rows[0]?.role;
    if (!role) return null;
    await c.query("UPDATE users SET role = $1 WHERE id = $2 AND role = 'user'", [role, userId]);
    await c.query(
      "INSERT INTO _zavi_audit (event, target_user_id, detail) VALUES ('invite_redeemed', $1, $2)",
      [userId, JSON.stringify({ role })],
    );
    return role;
  });
}

/** Where signup/login lands: the validated `next` path (or AFTER_LOGIN), with
 *  ?error=invite when an invite was sent but could not be redeemed. Never throws. */
export async function landingAfterAuth(invite: string, userId: number, next = ""): Promise<string> {
  const target = safeNext(next) || AFTER_LOGIN;
  if (!invite) return target;
  try {
    if (await redeemInvite(invite, userId)) return target;
  } catch (e) {
    console.error("[invite] redeem failed", (e as { code?: string })?.code ?? "unknown");
  }
  return `${AFTER_LOGIN}?error=invite`;
}
