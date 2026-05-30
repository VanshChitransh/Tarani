import { beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { initDb } from "./db";
import { createBetterSqlite3Driver } from "./better-sqlite3-adapter";
import {
  configure,
  addMint,
  getMint,
  removeMint,
  listMints,
  saveSnapshot,
  getLatestSnapshot,
  saveDiff,
  getLatestDiff,
  addWebhook,
  listWebhooks,
  removeWebhook,
} from "./store";

beforeEach(async () => {
  const driver = createBetterSqlite3Driver(new Database(":memory:"));
  const db = await initDb(driver);
  configure(db);
});

// ── addMint / getMint ──────────────────────────────────────────────────────────

describe("addMint / getMint", () => {
  const MINT = "So11111111111111111111111111111111111111112";

  it("addMint returns a MonitorRecord with correct mint and non-empty subscriptionId", async () => {
    const record = await addMint(MINT);
    expect(record.mint).toBe(MINT);
    expect(record.subscriptionId.length).toBeGreaterThan(0);
    expect(record.lastCheckedAt).toBeNull();
  });

  it("getMint returns null for an unknown mint address", async () => {
    expect(await getMint("unknownmintaddressunknownmintaddressunknown")).toBeNull();
  });

  it("addMint twice with same mint is idempotent — returns existing record", async () => {
    const first = await addMint(MINT);
    const second = await addMint(MINT);
    expect(second.subscriptionId).toBe(first.subscriptionId);
    expect(second.addedAt).toBe(first.addedAt);
  });
});

// ── removeMint / listMints ────────────────────────────────────────────────────

describe("removeMint / listMints", () => {
  const MINT_A = "So11111111111111111111111111111111111111112";
  const MINT_B = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

  it("removeMint removes the record — subsequent getMint returns null", async () => {
    await addMint(MINT_A);
    await removeMint(MINT_A);
    expect(await getMint(MINT_A)).toBeNull();
  });

  it("listMints returns all added mints in insertion order", async () => {
    await addMint(MINT_A);
    await addMint(MINT_B);
    const mints = await listMints();
    expect(mints.map((m) => m.mint)).toEqual([MINT_A, MINT_B]);
  });

  it("listMints returns empty array when no mints added", async () => {
    expect(await listMints()).toEqual([]);
  });
});

// ── saveSnapshot / getLatestSnapshot ─────────────────────────────────────────

describe("saveSnapshot / getLatestSnapshot", () => {
  const MINT = "So11111111111111111111111111111111111111112";

  it("getLatestSnapshot returns null before any snapshot is saved", async () => {
    expect(await getLatestSnapshot(MINT)).toBeNull();
  });

  it("saveSnapshot + getLatestSnapshot round-trips correctly", async () => {
    const snapshot = {
      mint: MINT,
      capturedAt: new Date().toISOString(),
      results: [],
    };
    await saveSnapshot(MINT, snapshot);
    const retrieved = await getLatestSnapshot(MINT);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.mint).toBe(MINT);
    expect(retrieved!.capturedAt).toBe(snapshot.capturedAt);
  });

  it("multiple saveSnapshot calls — getLatestSnapshot returns most recent by capturedAt", async () => {
    const older = { mint: MINT, capturedAt: "2024-01-01T00:00:00.000Z", results: [] };
    const newer = { mint: MINT, capturedAt: "2025-01-01T00:00:00.000Z", results: [] };
    await saveSnapshot(MINT, older);
    await saveSnapshot(MINT, newer);
    const latest = await getLatestSnapshot(MINT);
    expect(latest!.capturedAt).toBe(newer.capturedAt);
  });
});

// ── saveDiff / getLatestDiff ──────────────────────────────────────────────────

describe("saveDiff / getLatestDiff", () => {
  const MINT = "So11111111111111111111111111111111111111112";

  const diff = {
    venue: "jupiter" as const,
    kind: "degraded" as const,
    from: "supported" as const,
    to: "blocked" as const,
    detectedAt: new Date().toISOString(),
  };

  it("getLatestDiff returns null before any diff is saved", async () => {
    expect(await getLatestDiff(MINT)).toBeNull();
  });

  it("saveDiff + getLatestDiff round-trips correctly", async () => {
    await saveDiff(MINT, [diff]);
    const retrieved = await getLatestDiff(MINT);
    expect(retrieved).not.toBeNull();
    expect(retrieved).toHaveLength(1);
    expect(retrieved![0]).toMatchObject({ venue: "jupiter", kind: "degraded" });
  });
});

// ── addWebhook / listWebhooks / removeWebhook ────────────────────────────────

describe("addWebhook / listWebhooks / removeWebhook", () => {
  it("addWebhook returns an AlertWebhook with a valid UUID id and active: true", async () => {
    const wh = await addWebhook("https://example.com/hook");
    expect(wh.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(wh.url).toBe("https://example.com/hook");
    expect(wh.active).toBe(true);
  });

  it("listWebhooks returns only active webhooks", async () => {
    await addWebhook("https://a.com/hook");
    await addWebhook("https://b.com/hook");
    const hooks = await listWebhooks();
    expect(hooks).toHaveLength(2);
    expect(hooks.every((h) => h.active)).toBe(true);
  });

  it("removeWebhook removes the record — subsequent listWebhooks excludes it", async () => {
    const wh = await addWebhook("https://example.com/hook");
    await removeWebhook(wh.id);
    const hooks = await listWebhooks();
    expect(hooks.find((h) => h.id === wh.id)).toBeUndefined();
  });
});
