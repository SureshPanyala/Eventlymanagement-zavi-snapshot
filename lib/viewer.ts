import "server-only";
import { currentUser, type SiteUser } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";

/** The signed-in user for rendering, or null. Never throws: with no database or
 *  no session secret configured the site still renders as signed out. */
export async function viewer(): Promise<SiteUser | null> {
  if (!hasDatabase()) return null;
  try {
    return await currentUser();
  } catch (e) {
    console.error("[viewer] lookup failed", (e as { code?: string })?.code ?? "unknown");
    return null;
  }
}
