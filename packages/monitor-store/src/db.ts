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
`;

export async function initDb(db: DbDriver): Promise<DbDriver> {
  await db.exec(CREATE_TABLES_SQL);
  return db;
}
