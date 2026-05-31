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
    mint TEXT NOT NULL UNIQUE,
    added_at TEXT NOT NULL,
    last_checked_at TEXT
  );

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

  CREATE TABLE IF NOT EXISTS report_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mint TEXT NOT NULL,
    report_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_report_history_mint
    ON report_history (mint, created_at DESC);

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
  await db.exec(CREATE_TABLES_SQL);
  return db;
}
