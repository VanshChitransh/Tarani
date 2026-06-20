import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { venueCompatibilityResultSchema } from "@tarani/shared";
import type { MintProfile } from "@tarani/shared";
import type { VenueRule } from "../rules";
import { raydiumAdapter, probeRaydiumPool } from "./raydium";

const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

const baseProfile: MintProfile = {
  mint: "HoNeYy4S3p5N1RfRy7Sw1FZuYxnDpQpqxXJEUmwwHZGv",
  programId: TOKEN_2022,
  supply: "1000000000",
  decimals: 9,
  extensions: [
    { kind: "transferFeeConfig", rawKind: "transfer_fee_config", parameters: {}, raw: {} },
  ],
  authorities: {
    mint: { kind: "mint", address: null, isRenounced: true },
    freeze: { kind: "freeze", address: null, isRenounced: true },
    update: { kind: "update", address: null, isRenounced: true },
  },
  metadata: {
    name: "Test",
    symbol: "TST",
    uri: "https://example.com",
    decimals: 9,
    quality: "complete",
    hasOnChainName: true,
    hasOnChainSymbol: true,
  },
  warnings: [],
  fetchedAt: new Date().toISOString(),
};

const baseRule: VenueRule = {
  venue: "raydium",
  version: "0.2.0",
  last_updated: "2026-05-29",
  features: [
    {
      id: "transferFeeConfig",
      status: "blocked",
      confidence: "high",
      evidence: ["https://docs.raydium.io/raydium/"],
      notes: ["Raydium CLMM does not support transfer-fee tokens"],
    },
  ],
  notes: [],
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 400 })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("raydiumAdapter", () => {
  it("has venue id 'raydium'", () => {
    expect(raydiumAdapter.venue).toBe("raydium");
  });

  it("returns a VenueCompatibilityResult for a matching profile", async () => {
    const result = await raydiumAdapter.evaluate({ profile: baseProfile, rule: baseRule });
    expect(result.venue).toBe("raydium");
    expect(result.status).toBe("blocked");
    expect(result.source).toBe("heuristic");
  });

  it("output validates against venueCompatibilityResultSchema", async () => {
    const result = await raydiumAdapter.evaluate({ profile: baseProfile, rule: baseRule });
    expect(venueCompatibilityResultSchema.safeParse(result).success).toBe(true);
  });

  it("returns supported when profile has no extensions", async () => {
    const profile = { ...baseProfile, extensions: [] };
    const result = await raydiumAdapter.evaluate({ profile, rule: baseRule });
    expect(result.status).toBe("supported");
  });

  // A live pool is ground truth: it overrides the rule's "blocked" verdict (the C1 fix —
  // e.g. xStocks/NVDAx trade on Raydium via permissioned pools despite the permissionless rule).
  it("upgrades blocked -> supported when a live pool exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ success: true, data: { count: 1, data: [{}] } })),
    );
    const result = await raydiumAdapter.evaluate({ profile: baseProfile, rule: baseRule });
    expect(result.status).toBe("supported");
    expect(result.source).toBe("probe");
    expect(result.evidence.some((e) => e.kind === "probe")).toBe(true);
  });
});

describe("probeRaydiumPool", () => {
  const MINT = "HoNeYy4S3p5N1RfRy7Sw1FZuYxnDpQpqxXJEUmwwHZGv";

  it("returns pool_exists when the v3 query reports a matching pool", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ success: true, data: { count: 1, data: [{}] } })),
    );
    expect(await probeRaydiumPool(MINT)).toBe("pool_exists");
  });

  it("returns no_pool when the v3 query reports zero pools", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ success: true, data: { count: 0, data: [] } })),
    );
    expect(await probeRaydiumPool(MINT)).toBe("no_pool");
  });

  it("returns unknown when the API reports failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: false })));
    expect(await probeRaydiumPool(MINT)).toBe("unknown");
  });

  it("returns unknown on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    expect(await probeRaydiumPool(MINT)).toBe("unknown");
  });

  it("returns unknown on a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    expect(await probeRaydiumPool(MINT)).toBe("unknown");
  });
});
