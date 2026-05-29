export interface PreparedStatement {
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
  run(...params: unknown[]): unknown;
}

export interface DbDriver {
  prepare(sql: string): PreparedStatement;
  exec(sql: string): void;
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
`;

export function initDb(db: DbDriver): DbDriver {
  db.exec(CREATE_TABLES_SQL);
  return db;
}
