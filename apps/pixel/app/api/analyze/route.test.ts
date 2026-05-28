import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeResponseSchema, VENUE_IDS } from "@tarani/shared";
import { HeliusClient, HeliusClientError } from "@tarani/gilfoyle";
import type { HeliusAsset } from "@tarani/gilfoyle";
import { allMintFixtures } from "@tarani/test-fixtures";
import { POST } from "./route";

const FIXTURE_MINT = "HoNeYy4S3p5N1RfRy7Sw1FZuYxnDpQpqxXJEUmwwHZGv";
const transferHookAsset = allMintFixtures.transferHookToken as unknown as HeliusAsset;

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("SOLANA_RPC_URL", "http://helius.invalid");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// --- happy path ---

describe("POST /api/analyze — success", () => {
  it("returns ok:true with profile and 7 compatibility results", async () => {
    vi.spyOn(HeliusClient.prototype, "fetchMintAsset").mockResolvedValue(transferHookAsset);

    const res = await POST(makeRequest({ mint: FIXTURE_MINT }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.profile.mint).toBe(FIXTURE_MINT);
    expect(body.data.compatibility).toHaveLength(7);
    expect(body.data.compatibility.map((r: { venue: string }) => r.venue)).toEqual([...VENUE_IDS]);
    expect(Array.isArray(body.data.risks)).toBe(true);
    expect(body.data.risks.length).toBeGreaterThan(0);
    expect(Array.isArray(body.data.recommendations)).toBe(true);
    expect(typeof body.data.generatedAt).toBe("string");
  });

  it("response validates against analyzeResponseSchema", async () => {
    vi.spyOn(HeliusClient.prototype, "fetchMintAsset").mockResolvedValue(transferHookAsset);

    const res = await POST(makeRequest({ mint: FIXTURE_MINT }));
    const body = await res.json();

    const parsed = analyzeResponseSchema.safeParse(body);
    expect(parsed.success, JSON.stringify(parsed)).toBe(true);
  });
});

// --- error paths ---

describe("POST /api/analyze — errors", () => {
  it("returns 400 BAD_REQUEST for a mint shorter than 32 chars", async () => {
    const res = await POST(makeRequest({ mint: "tooshort" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("returns 400 BAD_REQUEST for missing mint field", async () => {
    const res = await POST(makeRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("returns 404 NOT_FOUND when Helius reports mint not found", async () => {
    vi.spyOn(HeliusClient.prototype, "fetchMintAsset").mockRejectedValue(
      new HeliusClientError("NOT_FOUND", `Mint not found: ${FIXTURE_MINT}`),
    );

    const res = await POST(makeRequest({ mint: FIXTURE_MINT }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 503 UPSTREAM_TIMEOUT when Helius times out", async () => {
    vi.spyOn(HeliusClient.prototype, "fetchMintAsset").mockRejectedValue(
      new HeliusClientError("UPSTREAM_TIMEOUT", "Helius request timed out after 5000ms"),
    );

    const res = await POST(makeRequest({ mint: FIXTURE_MINT }));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("UPSTREAM_TIMEOUT");
  });

  it("returns 500 INTERNAL for unexpected errors", async () => {
    vi.spyOn(HeliusClient.prototype, "fetchMintAsset").mockRejectedValue(
      new Error("Something exploded"),
    );

    const res = await POST(makeRequest({ mint: FIXTURE_MINT }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("INTERNAL");
  });
});
