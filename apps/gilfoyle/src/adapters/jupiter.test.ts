import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { venueCompatibilityResultSchema } from "@tarani/shared";
import type { MintProfile } from "@tarani/shared";
import type { VenueRule } from "../rules";
import { jupiterAdapter, probeJupiterRoute } from "./jupiter";

const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

const baseProfile: MintProfile = {
  mint: "HoNeYy4S3p5N1RfRy7Sw1FZuYxnDpQpqxXJEUmwwHZGv",
  programId: TOKEN_2022,
  supply: "1000000000",
  decimals: 9,
  extensions: [{ kind: "transferHook", rawKind: "transfer_hook", parameters: {}, raw: {} }],
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
  venue: "jupiter",
  version: "0.2.0",
  last_updated: "2026-05-29",
  features: [
    {
      id: "transferHook",
      status: "blocked",
      confidence: "high",
      evidence: ["https://docs.jup.ag/blocked"],
      notes: ["Transfer hooks block Jupiter's swap path"],
    },
  ],
  notes: [],
};

beforeEach(() => {
  // Default: probe unreachable -> "unknown" -> adapter falls back to the heuristic verdict.
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("jupiterAdapter", () => {
  it("has venue id 'jupiter'", () => {
    expect(jupiterAdapter.venue).toBe("jupiter");
  });

  it("returns a VenueCompatibilityResult for a matching profile", async () => {
    const result = await jupiterAdapter.evaluate({ profile: baseProfile, rule: baseRule });
    expect(result.venue).toBe("jupiter");
    expect(result.status).toBe("blocked");
    expect(["heuristic", "probe"]).toContain(result.source);
  });

  it("output validates against venueCompatibilityResultSchema", async () => {
    const result = await jupiterAdapter.evaluate({ profile: baseProfile, rule: baseRule });
    expect(venueCompatibilityResultSchema.safeParse(result).success).toBe(true);
  });

  // A live swap route is ground truth: it overrides the rule's "blocked" verdict (the C1 fix).
  it("upgrades blocked -> supported when the probe finds a route", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ outAmount: "123" })));
    const result = await jupiterAdapter.evaluate({ profile: baseProfile, rule: baseRule });
    expect(result.status).toBe("supported");
    expect(result.source).toBe("probe");
    expect(result.evidence.some((e) => e.kind === "probe")).toBe(true);
  });

  it("returns supported when profile has no extensions and the probe is unavailable", async () => {
    const profile = { ...baseProfile, extensions: [] };
    const result = await jupiterAdapter.evaluate({ profile, rule: baseRule });
    expect(result.status).toBe("supported");
  });

  it("downgrades supported -> partial when the probe finds no route", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({})));
    const profile = { ...baseProfile, extensions: [] };
    const result = await jupiterAdapter.evaluate({ profile, rule: baseRule });
    expect(result.status).toBe("partial");
    expect(result.source).toBe("probe");
  });
});

describe("probeJupiterRoute", () => {
  const MINT = "HoNeYy4S3p5N1RfRy7Sw1FZuYxnDpQpqxXJEUmwwHZGv";

  it("returns route_available when a quote has an outAmount", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ outAmount: "123" })));
    expect(await probeJupiterRoute(MINT)).toBe("route_available");
  });

  it("returns no_route when the quote has no outAmount", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({})));
    expect(await probeJupiterRoute(MINT)).toBe("no_route");
  });

  it("returns no_route on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 400 })));
    expect(await probeJupiterRoute(MINT)).toBe("no_route");
  });

  it("returns unknown on a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    expect(await probeJupiterRoute(MINT)).toBe("unknown");
  });
});
