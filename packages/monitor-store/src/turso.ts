import { createClient, type InArgs } from "@libsql/client";
import type { DbDriver, PreparedStatement } from "./db";

export function createTursoDriver(url: string, authToken: string): DbDriver {
  const client = createClient({ url, authToken });

  return {
    prepare(sql: string): PreparedStatement {
      return {
        async get(...params: unknown[]) {
          const rs = await client.execute({ sql, args: params as InArgs });
          return rs.rows[0] ?? undefined;
        },
        async all(...params: unknown[]) {
          const rs = await client.execute({ sql, args: params as InArgs });
          return rs.rows as unknown[];
        },
        async run(...params: unknown[]) {
          await client.execute({ sql, args: params as InArgs });
        },
      };
    },
    async exec(sql: string) {
      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const stmt of statements) {
        await client.execute(stmt);
      }
    },
  };
}
