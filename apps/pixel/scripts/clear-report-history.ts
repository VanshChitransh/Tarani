// One-off maintenance script: clears the report_history table from the
// production Turso DB. Run with `bun run scripts/clear-report-history.ts`
// from apps/pixel (Bun auto-loads .env.local for the Turso credentials).
//
//   --apply   actually delete + drop the table (default is a dry-run report)
import { createTursoDriver } from "@tarani/monitor-store";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN ?? "";
if (!url) throw new Error("TURSO_DATABASE_URL is not set");

const apply = process.argv.includes("--apply");
const db = createTursoDriver(url, authToken);

const exists = await db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='report_history'")
  .get();
if (!exists) {
  console.log("report_history table does not exist — nothing to do.");
  process.exit(0);
}

const before = (await db.prepare("SELECT COUNT(*) AS n FROM report_history").get()) as {
  n: number;
};
console.log(`report_history rows: ${before.n}`);

if (!apply) {
  console.log("dry-run — pass --apply to delete all rows and drop the table.");
  process.exit(0);
}

await db.exec("DELETE FROM report_history; DROP TABLE report_history;");
console.log("deleted all rows and dropped report_history.");
