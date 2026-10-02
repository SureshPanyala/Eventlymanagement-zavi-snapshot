import "server-only";
import { randomInt } from "node:crypto";
import { hasDatabase, query, withTransaction } from "@/lib/db";
import type { Category } from "@/lib/categories";

export type EventRow = {
  id: number;
  organizer_id: number;
  organizer_name: string;
  title: string;
  banner_url: string | null;
  category: Category;
  starts_at: Date;
  location: string;
  description: string;
  capacity: number;
  price_cents: number;
  status: "draft" | "published";
  is_featured: boolean;
  is_sample: boolean;
  seats_taken: number;
};

const SELECT_EVENT = `
  SELECT e.id, e.organizer_id, COALESCE(NULLIF(u.name, ''), 'Evently organizer') AS organizer_name,
         e.title, e.banner_url, e.category, e.starts_at, e.location, e.description, e.capacity,
         e.price_cents, e.status, e.is_featured, e.is_sample,
         (SELECT COUNT(*)::int FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS seats_taken
  FROM events e JOIN users u ON u.id = e.organizer_id`;

// Sample events were seeded with dates 1 to 5 weeks after launch. Without this the
// home page and /events would empty out once they pass. Any sample event now in
// the past moves forward in whole 6-week steps, so the demo stays spread over the
// coming weeks. Only is_sample rows are touched; real events never move.
const SAMPLE_CYCLE_DAYS = 42;
const REFRESH_EVERY_MS = 10 * 60 * 1000;
let lastRefresh = 0;
let refreshing: Promise<void> | null = null;

async function refreshSampleDates(): Promise<void> {
  if (Date.now() - lastRefresh < REFRESH_EVERY_MS) return;
  refreshing ??= query(
    `UPDATE events
        SET starts_at = starts_at
            + (floor(extract(epoch FROM (now() - starts_at)) / ${SAMPLE_CYCLE_DAYS * 86400}) + 1) * interval '${SAMPLE_CYCLE_DAYS} days'
      WHERE is_sample = true AND starts_at < now()`,
  )
    .then(() => {
      lastRefresh = Date.now();
    })
    .catch((e) => {
      console.error("[events] sample refresh failed", (e as { code?: string })?.code ?? "unknown");
    })
    .finally(() => {
      refreshing = null;
    });
  await refreshing;
}

export type DateFilter = "any" | "today" | "week" | "month";

export type EventFilters = { q?: string; category?: Category | ""; when?: DateFilter };

/** Published, upcoming events matching the filters, soonest first. */
export async function listPublishedEvents(filters: EventFilters = {}, limit = 60): Promise<EventRow[]> {
  if (!hasDatabase()) return [];
  await refreshSampleDates();
  const where = ["e.status = 'published'", "e.starts_at >= now()"];
  const params: unknown[] = [];
  if (filters.q) {
    params.push(`%${filters.q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`);
    where.push(`(e.title ILIKE $${params.length} OR e.location ILIKE $${params.length} OR e.description ILIKE $${params.length})`);
  }
  if (filters.category) {
    params.push(filters.category);
    where.push(`e.category = $${params.length}`);
  }
  if (filters.when === "today") where.push("e.starts_at < date_trunc('day', now()) + interval '1 day'");
  if (filters.when === "week") where.push("e.starts_at < now() + interval '7 days'");
  if (filters.when === "month") where.push("e.starts_at < now() + interval '30 days'");
  params.push(limit);
  const r = await query<EventRow>(
    `${SELECT_EVENT} WHERE ${where.join(" AND ")} ORDER BY e.starts_at ASC LIMIT $${params.length}`,
    params,
  );
  return r.rows;
}

export async function listFeaturedEvents(limit = 3): Promise<EventRow[]> {
  if (!hasDatabase()) return [];
  await refreshSampleDates();
  const r = await query<EventRow>(
    `${SELECT_EVENT} WHERE e.status = 'published' AND e.starts_at >= now()
     ORDER BY e.is_featured DESC, e.starts_at ASC LIMIT $1`,
    [limit],
  );
  return r.rows;
}

export async function categoryCounts(): Promise<Record<string, number>> {
  if (!hasDatabase()) return {};
  await refreshSampleDates();
  const r = await query<{ category: string; n: number }>(
    "SELECT category, COUNT(*)::int AS n FROM events WHERE status = 'published' AND starts_at >= now() GROUP BY category",
  );
  return Object.fromEntries(r.rows.map((row) => [row.category, row.n]));
}

/** One event. Drafts are only returned to their organizer. */
export async function getEvent(id: number, viewerId: number | null): Promise<EventRow | null> {
  if (!hasDatabase() || !Number.isInteger(id) || id <= 0) return null;
  const r = await query<EventRow>(
    `${SELECT_EVENT} WHERE e.id = $1 AND (e.status = 'published' OR e.organizer_id = $2)`,
    [id, viewerId ?? 0],
  );
  return r.rows[0] ?? null;
}

/** Same category first, then the soonest other upcoming events. */
export async function relatedEvents(event: EventRow, limit = 3): Promise<EventRow[]> {
  const r = await query<EventRow>(
    `${SELECT_EVENT} WHERE e.status = 'published' AND e.starts_at >= now() AND e.id <> $1
     ORDER BY (e.category = $2) DESC, e.starts_at ASC LIMIT $3`,
    [event.id, event.category, limit],
  );
  return r.rows;
}

export async function listOrganizerEvents(userId: number): Promise<EventRow[]> {
  if (!hasDatabase()) return [];
  const r = await query<EventRow>(`${SELECT_EVENT} WHERE e.organizer_id = $1 ORDER BY e.starts_at DESC`, [userId]);
  return r.rows;
}

export type RegistrationRow = {
  id: number;
  event_id: number;
  registration_code: string;
  status: "confirmed" | "cancelled";
  attendee_name: string;
  attendee_email: string;
  created_at: Date;
  title: string;
  starts_at: Date;
  location: string;
  category: Category;
  banner_url: string | null;
};

export async function listUserRegistrations(userId: number): Promise<RegistrationRow[]> {
  if (!hasDatabase()) return [];
  const r = await query<RegistrationRow>(
    `SELECT r.id, r.event_id, r.registration_code, r.status, r.attendee_name, r.attendee_email, r.created_at,
            e.title, e.starts_at, e.location, e.category, e.banner_url
     FROM registrations r JOIN events e ON e.id = r.event_id
     WHERE r.user_id = $1 ORDER BY e.starts_at ASC`,
    [userId],
  );
  return r.rows;
}

export async function getUserRegistration(eventId: number, userId: number): Promise<RegistrationRow | null> {
  if (!hasDatabase()) return null;
  const r = await query<RegistrationRow>(
    `SELECT r.id, r.event_id, r.registration_code, r.status, r.attendee_name, r.attendee_email, r.created_at,
            e.title, e.starts_at, e.location, e.category, e.banner_url
     FROM registrations r JOIN events e ON e.id = r.event_id
     WHERE r.event_id = $1 AND r.user_id = $2`,
    [eventId, userId],
  );
  return r.rows[0] ?? null;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newRegistrationCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `EVT-${s}`;
}

export type RegisterResult =
  | { ok: true; code: string }
  | { ok: false; reason: "not_found" | "past" | "full" | "already" };

/** Register a user for a published, upcoming event. The event row is locked so
 *  two last-seat registrations cannot both succeed. */
export async function registerForEvent(
  eventId: number,
  userId: number,
  attendee: { name: string; email: string; phone: string },
): Promise<RegisterResult> {
  return withTransaction(async (c) => {
    const ev = await c.query<{ capacity: number; upcoming: boolean }>(
      "SELECT capacity, starts_at >= now() AS upcoming FROM events WHERE id = $1 AND status = 'published' FOR UPDATE",
      [eventId],
    );
    const row = ev.rows[0];
    if (!row) return { ok: false, reason: "not_found" };
    if (!row.upcoming) return { ok: false, reason: "past" };
    const existing = await c.query("SELECT 1 FROM registrations WHERE event_id = $1 AND user_id = $2", [eventId, userId]);
    if (existing.rowCount) return { ok: false, reason: "already" };
    const taken = await c.query<{ n: number }>(
      "SELECT COUNT(*)::int AS n FROM registrations WHERE event_id = $1 AND status = 'confirmed'",
      [eventId],
    );
    if (taken.rows[0].n >= row.capacity) return { ok: false, reason: "full" };
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = newRegistrationCode();
      const ins = await c.query(
        `INSERT INTO registrations (event_id, user_id, attendee_name, attendee_email, attendee_phone, registration_code)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (registration_code) DO NOTHING RETURNING id`,
        [eventId, userId, attendee.name, attendee.email, attendee.phone, code],
      );
      if (ins.rowCount) return { ok: true, code };
    }
    throw new Error("could not allocate a registration code");
  });
}

export type EventInput = {
  title: string;
  banner_url: string | null;
  category: Category;
  starts_at: string;
  location: string;
  description: string;
  capacity: number;
  price_cents: number;
  status: "draft" | "published";
};

export async function createEvent(organizerId: number, input: EventInput): Promise<number> {
  const r = await query<{ id: number }>(
    `INSERT INTO events (organizer_id, title, banner_url, category, starts_at, location, description, capacity, price_cents, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [organizerId, input.title, input.banner_url, input.category, input.starts_at, input.location, input.description, input.capacity, input.price_cents, input.status],
  );
  return r.rows[0].id;
}

/** Update an event the caller organizes. Returns false if not theirs. */
export async function updateEvent(eventId: number, organizerId: number, input: EventInput): Promise<boolean> {
  const r = await query(
    `UPDATE events SET title = $3, banner_url = $4, category = $5, starts_at = $6, location = $7, description = $8,
            capacity = $9, price_cents = $10, status = $11, updated_at = now()
     WHERE id = $1 AND organizer_id = $2`,
    [eventId, organizerId, input.title, input.banner_url, input.category, input.starts_at, input.location, input.description, input.capacity, input.price_cents, input.status],
  );
  return (r.rowCount ?? 0) > 0;
}

/** Delete an event the caller organizes, together with its registrations. */
export async function deleteEvent(eventId: number, organizerId: number): Promise<boolean> {
  return withTransaction(async (c) => {
    const own = await c.query("SELECT 1 FROM events WHERE id = $1 AND organizer_id = $2 FOR UPDATE", [eventId, organizerId]);
    if (!own.rowCount) return false;
    await c.query("DELETE FROM registrations WHERE event_id = $1", [eventId]);
    await c.query("DELETE FROM events WHERE id = $1", [eventId]);
    return true;
  });
}

/** Remove only the seeded demo events (and any registrations on them). */
export async function removeSampleEvents(): Promise<number> {
  return withTransaction(async (c) => {
    await c.query("DELETE FROM registrations WHERE event_id IN (SELECT id FROM events WHERE is_sample = true)");
    const r = await c.query("DELETE FROM events WHERE is_sample = true");
    return r.rowCount ?? 0;
  });
}
