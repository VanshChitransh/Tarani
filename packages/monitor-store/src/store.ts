import type {
  AlertWebhook,
  AnalyzeReport,
  CompatibilityDiff,
  CompatibilitySnapshot,
  MonitorRecord,
} from "@tarani/shared";
import { randomUUID } from "crypto";
import type { DbDriver } from "./db";

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

export async function addMint(mint: string, subscriptionId?: string): Promise<MonitorRecord> {
  const d = db();

  const existing = await getMint(mint);
  if (existing) return existing;

  const countRow = (await d.prepare("SELECT COUNT(*) as n FROM monitored_mints").get()) as {
    n: number;
  };
  if (countRow.n >= MAX_MINTS) throw new Error("MAX_MONITORED_MINTS_EXCEEDED");

  const id = subscriptionId ?? randomUUID();
  const addedAt = new Date().toISOString();

  await d
    .prepare(
      "INSERT INTO monitored_mints (subscription_id, mint, added_at, last_checked_at) VALUES (?, ?, ?, NULL)",
    )
    .run(id, mint, addedAt);

  return { subscriptionId: id, mint, addedAt, lastCheckedAt: null };
}

export async function removeMint(mint: string): Promise<void> {
  await db().prepare("DELETE FROM monitored_mints WHERE mint = ?").run(mint);
}

export async function getMint(mint: string): Promise<MonitorRecord | null> {
  const row = (await db().prepare("SELECT * FROM monitored_mints WHERE mint = ?").get(mint)) as
    | MintRow
    | undefined;
  return row ? rowToRecord(row) : null;
}

export async function listMints(): Promise<MonitorRecord[]> {
  const rows = (await db()
    .prepare("SELECT * FROM monitored_mints ORDER BY added_at ASC")
    .all()) as MintRow[];
  return rows.map(rowToRecord);
}

export async function updateLastChecked(mint: string, checkedAt: string): Promise<void> {
  await db()
    .prepare("UPDATE monitored_mints SET last_checked_at = ? WHERE mint = ?")
    .run(checkedAt, mint);
}

export async function saveSnapshot(mint: string, snapshot: CompatibilitySnapshot): Promise<void> {
  await db()
    .prepare(
      "INSERT INTO compatibility_snapshots (mint, captured_at, results_json) VALUES (?, ?, ?)",
    )
    .run(mint, snapshot.capturedAt, JSON.stringify(snapshot.results));
}

export async function getLatestSnapshot(mint: string): Promise<CompatibilitySnapshot | null> {
  const row = (await db()
    .prepare(
      "SELECT * FROM compatibility_snapshots WHERE mint = ? ORDER BY captured_at DESC LIMIT 1",
    )
    .get(mint)) as { mint: string; captured_at: string; results_json: string } | undefined;

  if (!row) return null;
  return {
    mint: row.mint,
    capturedAt: row.captured_at,
    results: JSON.parse(row.results_json),
  };
}

export async function saveDiff(mint: string, diffs: CompatibilityDiff[]): Promise<void> {
  const detectedAt = diffs[0]?.detectedAt ?? new Date().toISOString();
  await db()
    .prepare("INSERT INTO compatibility_diffs (mint, detected_at, diffs_json) VALUES (?, ?, ?)")
    .run(mint, detectedAt, JSON.stringify(diffs));
}

export async function getLatestDiff(mint: string): Promise<CompatibilityDiff[] | null> {
  const row = (await db()
    .prepare("SELECT * FROM compatibility_diffs WHERE mint = ? ORDER BY detected_at DESC LIMIT 1")
    .get(mint)) as { diffs_json: string } | undefined;

  if (!row) return null;
  return JSON.parse(row.diffs_json);
}

export type ReportHistoryEntry = {
  report: AnalyzeReport;
  createdAt: string;
};

type ReportRow = { mint: string; report_json: string; created_at: string };

function rowToReportEntry(row: ReportRow): ReportHistoryEntry {
  return {
    report: JSON.parse(row.report_json),
    createdAt: row.created_at,
  };
}

export async function saveReport(
  mint: string,
  report: AnalyzeReport,
  createdAt: string,
): Promise<void> {
  await db()
    .prepare("INSERT INTO report_history (mint, report_json, created_at) VALUES (?, ?, ?)")
    .run(mint, JSON.stringify(report), createdAt);
}

export async function getLatestReport(mint: string): Promise<ReportHistoryEntry | null> {
  const row = (await db()
    .prepare("SELECT * FROM report_history WHERE mint = ? ORDER BY created_at DESC LIMIT 1")
    .get(mint)) as ReportRow | undefined;

  return row ? rowToReportEntry(row) : null;
}

export async function getReportHistory(mint: string, limit = 10): Promise<ReportHistoryEntry[]> {
  const rows = (await db()
    .prepare("SELECT * FROM report_history WHERE mint = ? ORDER BY created_at DESC LIMIT ?")
    .all(mint, limit)) as ReportRow[];

  return rows.map(rowToReportEntry);
}

type WebhookRow = { id: string; url: string; added_at: string; active: number };

function rowToWebhook(row: WebhookRow): AlertWebhook {
  return {
    id: row.id,
    url: row.url,
    addedAt: row.added_at,
    active: row.active === 1,
  };
}

export async function addWebhook(url: string): Promise<AlertWebhook> {
  const id = randomUUID();
  const addedAt = new Date().toISOString();
  await db()
    .prepare("INSERT INTO alert_webhooks (id, url, added_at, active) VALUES (?, ?, ?, 1)")
    .run(id, url, addedAt);
  return { id, url, addedAt, active: true };
}

export async function listWebhooks(): Promise<AlertWebhook[]> {
  const rows = (await db()
    .prepare("SELECT * FROM alert_webhooks WHERE active = 1 ORDER BY added_at ASC")
    .all()) as WebhookRow[];
  return rows.map(rowToWebhook);
}

export async function removeWebhook(id: string): Promise<void> {
  await db().prepare("DELETE FROM alert_webhooks WHERE id = ?").run(id);
}

/**
 * Sliding-window rate limit backed by the shared DB, so the count survives
 * across serverless instances (every Vercel cold start shares the same Turso row set).
 * Returns true if the request is allowed, false if the limit is exceeded.
 */
export async function checkRateLimit(
  bucketKey: string,
  maxRequests: number,
  windowMs: number,
): Promise<boolean> {
  const d = db();
  const now = Date.now();
  const cutoff = now - windowMs;

  // Drop hits that have aged out of this key's window.
  await d
    .prepare("DELETE FROM rate_limit_hits WHERE bucket_key = ? AND ts < ?")
    .run(bucketKey, cutoff);

  const countRow = (await d
    .prepare("SELECT COUNT(*) as n FROM rate_limit_hits WHERE bucket_key = ? AND ts >= ?")
    .get(bucketKey, cutoff)) as { n: number };

  if (countRow.n >= maxRequests) return false;

  await d.prepare("INSERT INTO rate_limit_hits (bucket_key, ts) VALUES (?, ?)").run(bucketKey, now);
  return true;
}
