import { beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { initDb } from "./db";
import { createBetterSqlite3Driver } from "./better-sqlite3-adapter";
import { configure, checkRateLimit } from "./store";

beforeEach(async () => {
  const driver = createBetterSqlite3Driver(new Database(":memory:"));
  const db = await initDb(driver);
  configure(db);
});

describe("checkRateLimit (atomic check-and-insert)", () => {
  it("allows up to the limit, then rejects", async () => {
    expect(await checkRateLimit("k", 2, 60_000)).toBe(true);
    expect(await checkRateLimit("k", 2, 60_000)).toBe(true);
    expect(await checkRateLimit("k", 2, 60_000)).toBe(false);
  });

  it("isolates buckets by key", async () => {
    expect(await checkRateLimit("a", 1, 60_000)).toBe(true);
    expect(await checkRateLimit("b", 1, 60_000)).toBe(true);
    expect(await checkRateLimit("a", 1, 60_000)).toBe(false);
  });

  it("does not over-admit when many requests race the same bucket", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => checkRateLimit("c", 2, 60_000)),
    );
    expect(results.filter(Boolean)).toHaveLength(2);
  });
});
