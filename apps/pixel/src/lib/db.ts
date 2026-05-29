import Database from "better-sqlite3";
import path from "path";
import { initDb, configure } from "@tarani/monitor-store";

const DB_PATH =
  process.env.MONITOR_DB_PATH ?? path.join(process.env.TMPDIR ?? "/tmp", "tarani-monitor.db");

let initialized = false;

export function ensureDb(): void {
  if (initialized) return;
  const sqliteDb = new Database(DB_PATH);
  const db = initDb(sqliteDb as unknown as import("@tarani/monitor-store").DbDriver);
  configure(db);
  initialized = true;
}
