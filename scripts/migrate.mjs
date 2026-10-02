// BLESSED TEMPLATE — scripts/migrate.mjs
// Deploy-time, append-only, transactional, and DATA-PRESERVING.
//
// CONFIGURE ONLY MIGRATIONS. On every refine/build pass, read the existing file
// and APPEND entries. Never edit/delete/reorder an already-shipped id. Customer
// rows are durable: destructive statements are forbidden.
import pg from "pg";
import { createHash } from "node:crypto";

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn("[migrate] DATABASE_URL unset — skipping");
  process.exit(0);
}

// ── CONFIGURE ME ────────────────────────────────────────────────────────────
const MIGRATIONS = [
  {
    id: "0001_initial_schema",
    statements: [
      `DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('user', 'admin');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `CREATE TABLE IF NOT EXISTS users (
         id BIGSERIAL PRIMARY KEY,
         email TEXT UNIQUE NOT NULL,
         password_hash TEXT NOT NULL,
         role public.app_role NOT NULL DEFAULT 'user',
         created_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`,
      `CREATE TABLE IF NOT EXISTS invites (
         id BIGSERIAL PRIMARY KEY,
         token_hash TEXT UNIQUE NOT NULL,
         role public.app_role NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         expires_at TIMESTAMPTZ NOT NULL,
         used_at TIMESTAMPTZ,
         used_by BIGINT REFERENCES users(id),
         revoked_at TIMESTAMPTZ
       )`,
      `CREATE TABLE IF NOT EXISTS _zavi_audit (
         id BIGSERIAL PRIMARY KEY,
         at TIMESTAMPTZ NOT NULL DEFAULT now(),
         event TEXT NOT NULL,
         actor_user_id BIGINT,
         target_user_id BIGINT,
         detail JSONB
       )`,
    ],
  },
  {
    id: "0002_evently_schema",
    statements: [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
      `CREATE TABLE IF NOT EXISTS events (
         id BIGSERIAL PRIMARY KEY,
         organizer_id BIGINT NOT NULL REFERENCES users(id),
         title TEXT NOT NULL,
         banner_url TEXT,
         category TEXT NOT NULL CHECK (category IN ('technology','business','music','design','education')),
         starts_at TIMESTAMPTZ NOT NULL,
         location TEXT NOT NULL,
         description TEXT NOT NULL DEFAULT '',
         capacity INTEGER NOT NULL CHECK (capacity > 0),
         price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
         status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
         is_featured BOOLEAN NOT NULL DEFAULT false,
         is_sample BOOLEAN NOT NULL DEFAULT false,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`,
      `CREATE INDEX IF NOT EXISTS events_status_starts_idx ON events(status, starts_at)`,
      `CREATE INDEX IF NOT EXISTS events_organizer_idx ON events(organizer_id)`,
      `CREATE TABLE IF NOT EXISTS registrations (
         id BIGSERIAL PRIMARY KEY,
         event_id BIGINT NOT NULL REFERENCES events(id),
         user_id BIGINT NOT NULL REFERENCES users(id),
         attendee_name TEXT NOT NULL,
         attendee_email TEXT NOT NULL,
         attendee_phone TEXT NOT NULL,
         registration_code TEXT UNIQUE NOT NULL,
         status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         UNIQUE (event_id, user_id)
       )`,
      `CREATE INDEX IF NOT EXISTS registrations_user_idx ON registrations(user_id)`,
    ],
  },
  {
    id: "0003_sample_events",
    statements: [
      `INSERT INTO users (email, password_hash, name)
       VALUES ('studio@evently.example', '!', 'Evently Studio')
       ON CONFLICT (email) DO NOTHING`,
      `INSERT INTO events (organizer_id, title, category, starts_at, location, description, capacity, price_cents, status, is_featured, is_sample)
       SELECT u.id, v.title, v.category, date_trunc('day', now()) + v.day_offset * interval '1 day' + v.minute_of_day * interval '1 minute',
              v.location, v.description, v.capacity, v.price_cents, 'published', v.is_featured, true
       FROM users u
       CROSS JOIN (VALUES
         ('Future of AI Summit 2026', 'technology', 14, 540, 'Moscone West, San Francisco, CA', 'A full day of keynotes and hands-on sessions on applied AI, from product teams shipping language models in production to researchers working on evaluation and safety. Includes lunch, an expo floor, and an evening reception.', 400, 14900, true),
         ('Frontend Builders Night', 'technology', 6, 1110, 'The Assembly, Austin, TX', 'Lightning talks on React, Next.js, and modern CSS, followed by pizza and conversation with local frontend engineers. All experience levels welcome.', 120, 0, false),
         ('Cloud Security Bootcamp', 'technology', 23, 600, 'Pier 27, Seattle, WA', 'An intensive, hands-on workshop covering identity, secrets management, and incident response for teams running on the major cloud providers. Bring a laptop.', 60, 29900, false),
         ('Founders Breakfast: Raising Your Seed Round', 'business', 9, 480, '115 W 18th St, New York, NY', 'An intimate breakfast with three recently funded founders and two seed investors. Candid stories on pitching, pricing a round, and choosing partners.', 80, 2500, true),
         ('Small Business Growth Forum', 'business', 30, 780, 'Chicago Cultural Center, Chicago, IL', 'Practical sessions on local marketing, hiring your first employees, and managing cash flow, led by owners who have grown neighborhood businesses into regional brands.', 250, 0, false),
         ('Sunset Sessions: Live Jazz on the Rooftop', 'music', 11, 1170, 'Rooftop Terrace, Downtown Los Angeles, CA', 'An evening of live jazz from a rotating quartet as the sun goes down over the city. Small plates and drinks available. Seating is first come, first served.', 150, 3500, true),
         ('Indie Songwriters Showcase', 'music', 18, 1200, 'The Basement East, Nashville, TN', 'Six emerging songwriters share new material in an intimate, acoustic in-the-round format. Hosted by a local radio presenter.', 200, 1800, false),
         ('Open-Air Classical Evening', 'music', 35, 1140, 'Millennium Park, Chicago, IL', 'The city chamber orchestra performs Dvorak and Vivaldi under the stars. Bring a blanket and a picnic. Free for everyone.', 1000, 0, false),
         ('Design Systems Conference', 'design', 25, 570, 'SVA Theatre, New York, NY', 'Two tracks of talks on building, scaling, and governing design systems, with case studies from product teams and a tokens deep dive workshop.', 350, 19900, false),
         ('UX Portfolio Review Night', 'design', 8, 1080, 'Mission Loft, San Francisco, CA', 'Get one-on-one feedback on your UX portfolio from senior designers and hiring managers. Short sessions, practical advice, friendly crowd.', 40, 0, false),
         ('Teaching with AI: Educators Workshop', 'education', 15, 600, 'Boston Public Library, Boston, MA', 'A practical workshop for K-12 and university educators on using AI tools responsibly in lesson planning, feedback, and assessment.', 100, 0, false),
         ('Data Science Crash Course for Beginners', 'education', 21, 540, 'Denver Central Library, Denver, CO', 'Learn the fundamentals of data analysis with Python in one focused day: cleaning data, making charts, and telling a clear story with numbers.', 50, 4900, false)
       ) AS v(title, category, day_offset, minute_of_day, location, description, capacity, price_cents, is_featured)
       WHERE u.email = 'studio@evently.example'
         AND NOT EXISTS (SELECT 1 FROM events)`,
    ],
  },
  {
    id: "0004_uploaded_images",
    statements: [
      `CREATE TABLE IF NOT EXISTS images (
         id BIGSERIAL PRIMARY KEY,
         owner_id BIGINT NOT NULL REFERENCES users(id),
         content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg','image/png','image/webp','image/gif')),
         data BYTEA NOT NULL,
         byte_size INTEGER NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`,
      `CREATE INDEX IF NOT EXISTS images_owner_idx ON images(owner_id)`,
    ],
  },
];
// ── end CONFIGURE ME ────────────────────────────────────────────────────────

const pool = new pg.Pool({ connectionString: url });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const TRANSIENT_MSG =
  /ECONNREFUSED|ETIMEDOUT|timeout|terminating connection|endpoint has been disabled|Connection terminated/i;

// SQLSTATEs a managed Postgres (Neon/Render) can emit spuriously while the
// compute is waking from scale-to-zero or being replaced — the connection is
// accepted but the backend is not fully ready. 42501 (insufficient_privilege)
// belongs here for a specific, observed reason: on a waking Neon compute an
// unqualified CREATE can transiently fail name resolution and report
// `permission denied for schema pg_catalog` even though the role owns the DB
// and has CREATE on public. Retrying is safe — a GENUINE privilege problem
// still exhausts the bound and exits non-zero, so fail-loud is preserved.
const TRANSIENT_CODES = new Set(["08000", "08003", "08006", "53300", "57P01", "57P02", "57P03", "42501"]);

const isTransient = (e) => TRANSIENT_CODES.has(e?.code) || TRANSIENT_MSG.test(e?.message || "");

// Bounded retry for connect and the transactional schema step. A failed schema
// attempt rolls back before retrying, so customer rows and migration bookkeeping
// remain atomic.
async function withRetry(label, fn) {
  for (let i = 1; i <= 10; i++) {
    try {
      return await fn();
    } catch (error) {
      if (!isTransient(error) || i === 10) throw error;
      console.warn(`[migrate] ${label} attempt ${i}/10 failed (transient ${error?.code || "?"}) — retrying`);
      await sleep(Math.min(3000, 300 * i));
    }
  }
}

const connectWithRetry = () => withRetry("connect", () => pool.query("SELECT 1"));

function assertSafeMigration(migration) {
  if (!migration || typeof migration.id !== "string" || !/^[a-z0-9_]+$/i.test(migration.id)) {
    throw new Error("migration ids must be non-empty alphanumeric/underscore strings");
  }
  if (!Array.isArray(migration.statements) || migration.statements.length === 0) {
    throw new Error(`migration ${migration.id} has no statements`);
  }
  const destructive = /\b(DROP\s+(TABLE|COLUMN|SCHEMA|DATABASE)|TRUNCATE|DELETE\s+FROM|CASCADE)\b/i;
  for (const statement of migration.statements) {
    if (typeof statement !== "string" || destructive.test(statement)) {
      throw new Error(`migration ${migration.id} contains destructive SQL`);
    }
  }
}

function checksum(migration) {
  return createHash("sha256").update(JSON.stringify(migration.statements)).digest("hex");
}

try {
  await connectWithRetry();
  await withRetry("schema", async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(72494611)");
      await client.query(
        `CREATE TABLE IF NOT EXISTS _schema_migrations (
           id TEXT PRIMARY KEY,
           checksum TEXT NOT NULL,
           applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
         )`,
      );
      const appliedResult = await client.query("SELECT id, checksum FROM _schema_migrations");
      const applied = new Map(appliedResult.rows.map((row) => [row.id, row.checksum]));
      const seen = new Set();
      for (const migration of MIGRATIONS) {
        assertSafeMigration(migration);
        if (seen.has(migration.id)) throw new Error(`duplicate migration id: ${migration.id}`);
        seen.add(migration.id);
        const digest = checksum(migration);
        if (applied.has(migration.id)) {
          if (applied.get(migration.id) !== digest) {
            throw new Error(`applied migration ${migration.id} was edited; append a new migration instead`);
          }
          continue;
        }
        for (const statement of migration.statements) await client.query(statement);
        await client.query("INSERT INTO _schema_migrations (id, checksum) VALUES ($1, $2)", [migration.id, digest]);
        console.log(`[migrate] applied ${migration.id}`);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  });
} catch (error) {
  console.error("[migrate] FAILED", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
