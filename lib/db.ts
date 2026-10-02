// ─────────────────────────────────────────────────────────────────────────────
// BLESSED TEMPLATE — lib/db.ts  (Postgres client for a GENERATED app)
//
// int8 type-parser makes BIGINT ids numbers; DATABASE_URL is server-only; the
// module imports safely without DATABASE_URL (throw deferred to first query).
// ─────────────────────────────────────────────────────────────────────────────
import "server-only";
import pg from "pg";

// int8 (OID 20) → number. Registered BEFORE any pool is created / query runs.
pg.types.setTypeParser(20, (v: string | null) => (v === null ? null : Number(v)));

let _pool: pg.Pool | null = null;

/** True when a DATABASE_URL is present — guard DB reads in pages so the build
 *  (and a no-data deploy) can render an empty/error state instead of crashing. */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function pool(): pg.Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — refusing to query without a database");
  }
  if (!_pool) {
    _pool = new pg.Pool({ connectionString: url });
  }
  return _pool;
}

/** Run a parameterized query. ALWAYS use `$1, $2, …` placeholders. */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<pg.QueryResult<T>> {
  return pool().query<T>(text, params as never);
}

/** Run fn inside ONE transaction on ONE pooled client. */
export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}
