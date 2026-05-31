export interface PreparedStatement {
  get(...params: unknown[]): Promise<unknown>;
  all(...params: unknown[]): Promise<unknown[]>;
  run(...params: unknown[]): Promise<unknown>;
}

export interface DbDriver {
  prepare(sql: string): PreparedStatement;
  exec(sql: string): Promise<void>;
}

const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS monitored_mints (
    subscription_id TEXT PRIMARY KEY,
    subscriber_id TEXT NOT NULL,
    mint TEXT NOT NULL,
    added_at TEXT NOT NULL,
    last_checked_at TEXT,
    UNIQUE(subscriber_id, mint)
  );

  CREATE INDEX IF NOT EXISTS idx_monitored_subscriber
    ON monitored_mints (subscriber_id);
  CREATE INDEX IF NOT EXISTS idx_monitored_mint
    ON monitored_mints (mint);

  CREATE TABLE IF NOT EXISTS compatibility_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mint TEXT NOT NULL,
    captured_at TEXT NOT NULL,
    results_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS compatibility_diffs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mint TEXT NOT NULL,
    detected_at TEXT NOT NULL,
    diffs_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alert_webhooks (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    added_at TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS rate_limit_hits (
    bucket_key TEXT NOT NULL,
    ts INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_rate_limit_hits_key
    ON rate_limit_hits (bucket_key, ts);

  CREATE TABLE IF NOT EXISTS auth_nonces (
    nonce TEXT PRIMARY KEY,
    issued_at INTEGER NOT NULL
  );
`;

export async function initDb(db: DbDriver): Promise<DbDriver> {
  await migrateMonitoredMints(db);
  await db.exec(CREATE_TABLES_SQL);
  return db;
}

/**
 * Migrate the pre-auth global `monitored_mints` table (no owner) to the
 * per-subscriber schema. SQLite can't drop the old `mint UNIQUE` constraint via
 * ALTER, so when the legacy shape is detected we drop the table and let
 * CREATE_TABLES_SQL recreate it scoped. The legacy global rows are intentionally
 * discarded — they had no owner to attribute them to.
 */
async function migrateMonitoredMints(db: DbDriver): Promise<void> {
  let cols: Array<{ name?: string }> = [];
  try {
    cols = (await db.prepare("PRAGMA table_info(monitored_mints)").all()) as Array<{
      name?: string;
    }>;
  } catch {
    return; // table absent or PRAGMA unsupported — CREATE_TABLES_SQL will handle it
  }
  if (cols.length > 0 && !cols.some((c) => c.name === "subscriber_id")) {
    await db.exec("DROP TABLE IF EXISTS monitored_mints;");
  }
}
