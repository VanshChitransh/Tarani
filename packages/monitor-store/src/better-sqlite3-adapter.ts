import type { DbDriver, PreparedStatement } from "./db";

type SyncStmt = {
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
  run(...params: unknown[]): unknown;
};

type SyncDb = {
  prepare(sql: string): SyncStmt;
  exec(sql: string): void;
};

export function createBetterSqlite3Driver(syncDb: SyncDb): DbDriver {
  return {
    prepare(sql: string): PreparedStatement {
      const stmt = syncDb.prepare(sql);
      return {
        get: (...params) => Promise.resolve(stmt.get(...params)),
        all: (...params) => Promise.resolve(stmt.all(...params) as unknown[]),
        run: (...params) => {
          const info = stmt.run(...params) as { changes?: number };
          return Promise.resolve(info?.changes ?? 0);
        },
      };
    },
    exec: (sql) => Promise.resolve(syncDb.exec(sql)),
  };
}
