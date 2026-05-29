import type { CompatibilityDiff, CompatibilitySnapshot, MonitorRecord } from "@tarani/shared";
import { randomUUID } from "crypto";
import type { DbDriver } from "./db.js";

const MAX_MINTS = parseInt(process.env.MAX_MONITORED_MINTS ?? "100", 10);

let _db: DbDriver | null = null;

export function configure(db: DbDriver): void {
  _db = db;
}

function db(): DbDriver {
  if (!_db) throw new Error("monitor-store: call configure(db) before using store functions");
  return _db;
}

type MintRow = {
  subscription_id: string;
  mint: string;
  added_at: string;
  last_checked_at: string | null;
};

function rowToRecord(row: MintRow): MonitorRecord {
  return {
    subscriptionId: row.subscription_id,
    mint: row.mint,
    addedAt: row.added_at,
    lastCheckedAt: row.last_checked_at,
  };
}

export function addMint(mint: string, subscriptionId?: string): MonitorRecord {
  const d = db();

  const existing = getMint(mint);
  if (existing) return existing;

  const count = (d.prepare("SELECT COUNT(*) as n FROM monitored_mints").get() as { n: number }).n;
  if (count >= MAX_MINTS) throw new Error("MAX_MONITORED_MINTS_EXCEEDED");

  const id = subscriptionId ?? randomUUID();
  const addedAt = new Date().toISOString();

  d.prepare(
    "INSERT INTO monitored_mints (subscription_id, mint, added_at, last_checked_at) VALUES (?, ?, ?, NULL)",
  ).run(id, mint, addedAt);

  return { subscriptionId: id, mint, addedAt, lastCheckedAt: null };
}

export function removeMint(mint: string): void {
  db().prepare("DELETE FROM monitored_mints WHERE mint = ?").run(mint);
}

export function getMint(mint: string): MonitorRecord | null {
  const row = db().prepare("SELECT * FROM monitored_mints WHERE mint = ?").get(mint) as
    | MintRow
    | undefined;
  return row ? rowToRecord(row) : null;
}

export function listMints(): MonitorRecord[] {
  const rows = db()
    .prepare("SELECT * FROM monitored_mints ORDER BY added_at ASC")
    .all() as MintRow[];
  return rows.map(rowToRecord);
}

export function updateLastChecked(mint: string, checkedAt: string): void {
  db()
    .prepare("UPDATE monitored_mints SET last_checked_at = ? WHERE mint = ?")
    .run(checkedAt, mint);
}

export function saveSnapshot(mint: string, snapshot: CompatibilitySnapshot): void {
  db()
    .prepare(
      "INSERT INTO compatibility_snapshots (mint, captured_at, results_json) VALUES (?, ?, ?)",
    )
    .run(mint, snapshot.capturedAt, JSON.stringify(snapshot.results));
}

export function getLatestSnapshot(mint: string): CompatibilitySnapshot | null {
  const row = db()
    .prepare(
      "SELECT * FROM compatibility_snapshots WHERE mint = ? ORDER BY captured_at DESC LIMIT 1",
    )
    .get(mint) as { mint: string; captured_at: string; results_json: string } | undefined;

  if (!row) return null;
  return {
    mint: row.mint,
    capturedAt: row.captured_at,
    results: JSON.parse(row.results_json),
  };
}

export function saveDiff(mint: string, diffs: CompatibilityDiff[]): void {
  const detectedAt = diffs[0]?.detectedAt ?? new Date().toISOString();
  db()
    .prepare("INSERT INTO compatibility_diffs (mint, detected_at, diffs_json) VALUES (?, ?, ?)")
    .run(mint, detectedAt, JSON.stringify(diffs));
}

export function getLatestDiff(mint: string): CompatibilityDiff[] | null {
  const row = db()
    .prepare("SELECT * FROM compatibility_diffs WHERE mint = ? ORDER BY detected_at DESC LIMIT 1")
    .get(mint) as { diffs_json: string } | undefined;

  if (!row) return null;
  return JSON.parse(row.diffs_json);
}
