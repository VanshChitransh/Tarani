import { createTursoDriver, initDb, configure } from "@tarani/monitor-store";
import { runRecheckLoop } from "./recheckLoop";
import { runFreshnessLoop } from "./freshnessLoop";

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN ?? "";
const INTERVAL_MS = parseInt(process.env.SENTINEL_INTERVAL_MS ?? "60000", 10);
const FRESHNESS_INTERVAL_MS = parseInt(
  process.env.SENTINEL_FRESHNESS_INTERVAL_MS ?? "86400000",
  10,
);

if (!TURSO_URL) throw new Error("TURSO_DATABASE_URL is not set");

console.log("[sentinel] Starting...");

const driver = createTursoDriver(TURSO_URL, TURSO_TOKEN);
const db = await initDb(driver);
configure(db);

runRecheckLoop(INTERVAL_MS);
runFreshnessLoop(FRESHNESS_INTERVAL_MS);
