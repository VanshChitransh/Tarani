import { beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { initDb } from "./db";
import type { DbDriver } from "./db";
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

beforeEach(() => {
  const db = new Database(":memory:") as unknown as DbDriver;
  initDb(db);
  configure(db);
});

// ── addMint / getMint ──────────────────────────────────────────────────────────

describe("addMint / getMint", () => {
  const MINT = "So11111111111111111111111111111111111111112";

  it("addMint returns a MonitorRecord with correct mint and non-empty subscriptionId", () => {
    const record = addMint(MINT);
    expect(record.mint).toBe(MINT);
    expect(record.subscriptionId.length).toBeGreaterThan(0);
    expect(record.lastCheckedAt).toBeNull();
  });

  it("getMint returns null for an unknown mint address", () => {
    expect(getMint("unknownmintaddressunknownmintaddressunknown")).toBeNull();
  });

  it("addMint twice with same mint is idempotent — returns existing record", () => {
    const first = addMint(MINT);
    const second = addMint(MINT);
    expect(second.subscriptionId).toBe(first.subscriptionId);
    expect(second.addedAt).toBe(first.addedAt);
  });
});

// ── removeMint / listMints ────────────────────────────────────────────────────

describe("removeMint / listMints", () => {
  const MINT_A = "So11111111111111111111111111111111111111112";
  const MINT_B = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

  it("removeMint removes the record — subsequent getMint returns null", () => {
    addMint(MINT_A);
    removeMint(MINT_A);
    expect(getMint(MINT_A)).toBeNull();
  });

  it("listMints returns all added mints in insertion order", () => {
    addMint(MINT_A);
    addMint(MINT_B);
    const mints = listMints();
    expect(mints.map((m) => m.mint)).toEqual([MINT_A, MINT_B]);
  });

  it("listMints returns empty array when no mints added", () => {
    expect(listMints()).toEqual([]);
  });
});

// ── saveSnapshot / getLatestSnapshot ─────────────────────────────────────────

describe("saveSnapshot / getLatestSnapshot", () => {
  const MINT = "So11111111111111111111111111111111111111112";

  it("getLatestSnapshot returns null before any snapshot is saved", () => {
    expect(getLatestSnapshot(MINT)).toBeNull();
  });

  it("saveSnapshot + getLatestSnapshot round-trips correctly", () => {
    const snapshot = {
      mint: MINT,
      capturedAt: new Date().toISOString(),
      results: [],
    };
    saveSnapshot(MINT, snapshot);
    const retrieved = getLatestSnapshot(MINT);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.mint).toBe(MINT);
    expect(retrieved!.capturedAt).toBe(snapshot.capturedAt);
  });

  it("multiple saveSnapshot calls — getLatestSnapshot returns most recent by capturedAt", () => {
    const older = { mint: MINT, capturedAt: "2024-01-01T00:00:00.000Z", results: [] };
    const newer = { mint: MINT, capturedAt: "2025-01-01T00:00:00.000Z", results: [] };
    saveSnapshot(MINT, older);
    saveSnapshot(MINT, newer);
    const latest = getLatestSnapshot(MINT);
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

  it("getLatestDiff returns null before any diff is saved", () => {
    expect(getLatestDiff(MINT)).toBeNull();
  });

  it("saveDiff + getLatestDiff round-trips correctly", () => {
    saveDiff(MINT, [diff]);
    const retrieved = getLatestDiff(MINT);
    expect(retrieved).not.toBeNull();
    expect(retrieved).toHaveLength(1);
    expect(retrieved![0]).toMatchObject({ venue: "jupiter", kind: "degraded" });
  });
});

// ── addWebhook / listWebhooks / removeWebhook ────────────────────────────────

describe("addWebhook / listWebhooks / removeWebhook", () => {
  it("addWebhook returns an AlertWebhook with a valid UUID id and active: true", () => {
    const wh = addWebhook("https://example.com/hook");
    expect(wh.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(wh.url).toBe("https://example.com/hook");
    expect(wh.active).toBe(true);
  });

  it("listWebhooks returns only active webhooks", () => {
    addWebhook("https://a.com/hook");
    addWebhook("https://b.com/hook");
    const hooks = listWebhooks();
    expect(hooks).toHaveLength(2);
    expect(hooks.every((h) => h.active)).toBe(true);
  });

  it("removeWebhook removes the record — subsequent listWebhooks excludes it", () => {
    const wh = addWebhook("https://example.com/hook");
    removeWebhook(wh.id);
    const hooks = listWebhooks();
    expect(hooks.find((h) => h.id === wh.id)).toBeUndefined();
  });
});
