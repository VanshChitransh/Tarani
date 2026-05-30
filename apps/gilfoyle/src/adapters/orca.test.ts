import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { venueCompatibilityResultSchema } from "@tarani/shared";
import type { MintProfile } from "@tarani/shared";
import type { VenueRule } from "../rules";
import { orcaAdapter, probeOrcaPool, runOrcaCompatibility, __resetOrcaCache } from "./orca";

const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const MINT = "HoNeYy4S3p5N1RfRy7Sw1FZuYxnDpQpqxXJEUmwwHZGv";

const baseProfile: MintProfile = {
  mint: MINT,
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
  venue: "orca",
  version: "0.2.0",
  last_updated: "2026-05-29",
  features: [
    {
      id: "transferHook",
      status: "conditional",
      confidence: "medium",
      evidence: ["https://orca-so.gitbook.io/orca-developer-portal/"],
      notes: ["Transfer hook tokens require whirlpool-specific setup"],
    },
  ],
  notes: [],
};

function stubFetch(impl: () => Response | Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(impl));
}

beforeEach(() => {
  __resetOrcaCache();
  // Default: probe fails (network error) so adapter falls back to heuristic.
  stubFetch(() => {
    throw new Error("network down");
  });
});

afterEach(() => {
  __resetOrcaCache();
  vi.unstubAllGlobals();
});

describe("orcaAdapter", () => {
  it("has venue id 'orca'", () => {
    expect(orcaAdapter.venue).toBe("orca");
  });

  it("returns a heuristic VenueCompatibilityResult when the probe is unavailable", async () => {
    const result = await orcaAdapter.evaluate({ profile: baseProfile, rule: baseRule });
    expect(result.venue).toBe("orca");
    expect(result.status).toBe("conditional");
    expect(result.source).toBe("heuristic");
  });

  it("output validates against venueCompatibilityResultSchema", async () => {
    const result = await orcaAdapter.evaluate({ profile: baseProfile, rule: baseRule });
    expect(venueCompatibilityResultSchema.safeParse(result).success).toBe(true);
  });

  it("returns supported when profile has no extensions", async () => {
    const profile = { ...baseProfile, extensions: [] };
    const result = await runOrcaCompatibility({ profile, rule: baseRule }, { skipProbe: true });
    expect(result.status).toBe("supported");
  });

  it("upgrades conditional -> supported with probe evidence when a live pool exists", async () => {
    stubFetch(() =>
      Response.json({
        whirlpools: [{ tokenA: { mint: MINT }, tokenB: { mint: "OTHER" } }],
      }),
    );
    const result = await orcaAdapter.evaluate({ profile: baseProfile, rule: baseRule });
    expect(result.status).toBe("supported");
    expect(result.source).toBe("probe");
    expect(result.evidence.some((e) => e.kind === "probe")).toBe(true);
  });

  it("stays conditional but attaches probe evidence when no pool exists", async () => {
    stubFetch(() => Response.json({ whirlpools: [] }));
    const result = await orcaAdapter.evaluate({ profile: baseProfile, rule: baseRule });
    expect(result.status).toBe("conditional");
    expect(result.source).toBe("probe");
    expect(result.evidence.some((e) => e.kind === "probe")).toBe(true);
  });
});

describe("probeOrcaPool", () => {
  it("returns pool_exists when the mint appears in a whirlpool", async () => {
    stubFetch(() => Response.json({ whirlpools: [{ tokenB: { mint: MINT } }] }));
    expect(await probeOrcaPool(MINT)).toBe("pool_exists");
  });

  it("returns no_pool when the mint is absent", async () => {
    stubFetch(() => Response.json({ whirlpools: [{ tokenA: { mint: "X" } }] }));
    expect(await probeOrcaPool(MINT)).toBe("no_pool");
  });

  it("returns unknown on a non-ok response", async () => {
    stubFetch(() => new Response(null, { status: 500 }));
    expect(await probeOrcaPool(MINT)).toBe("unknown");
  });

  it("returns unknown on a network error", async () => {
    stubFetch(() => {
      throw new Error("boom");
    });
    expect(await probeOrcaPool(MINT)).toBe("unknown");
  });

  it("caches the whirlpool list across calls (one fetch for repeated probes)", async () => {
    const fetchSpy = vi
      .fn()
      .mockImplementation(() => Response.json({ whirlpools: [{ tokenA: { mint: MINT } }] }));
    vi.stubGlobal("fetch", fetchSpy);
    await probeOrcaPool(MINT);
    await probeOrcaPool("SOME_OTHER_MINT");
    await probeOrcaPool(MINT);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
