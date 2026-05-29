import { Database } from "bun:sqlite";
import path from "path";
import { initDb, configure } from "@tarani/monitor-store";
import { runRecheckLoop } from "./recheckLoop";

const DB_PATH = process.env.MONITOR_DB_PATH ?? path.join(process.cwd(), "monitor.db");
const INTERVAL_MS = parseInt(process.env.SENTINEL_INTERVAL_MS ?? "60000", 10);

console.log("[sentinel] Starting...");

const sqliteDb = new Database(DB_PATH);
const db = initDb(sqliteDb as unknown as import("@tarani/monitor-store").DbDriver);
configure(db);

runRecheckLoop(INTERVAL_MS);
