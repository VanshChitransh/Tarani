import { describe, expect, it } from "vitest";
import { venueCompatibilityResultSchema } from "@tarani/shared";
import type { MintProfile } from "@tarani/shared";
import type { VenueRule } from "../rules";
import { solflareAdapter } from "./solflare";

const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

const baseProfile: MintProfile = {
  mint: "HoNeYy4S3p5N1RfRy7Sw1FZuYxnDpQpqxXJEUmwwHZGv",
  programId: TOKEN_2022,
  supply: "1000000000",
  decimals: 9,
  extensions: [
    { kind: "permanentDelegate", rawKind: "permanent_delegate", parameters: {}, raw: {} },
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
  venue: "solflare",
  version: "0.2.0",
  last_updated: "2026-05-29",
  features: [
    {
      id: "permanentDelegate",
      status: "conditional",
      confidence: "medium",
      evidence: ["https://solflare.com/blog/token-extensions-support"],
      notes: ["Permanent delegate triggers a warning banner in Solflare UI"],
    },
  ],
  notes: [],
};

describe("solflareAdapter", () => {
  it("has venue id 'solflare'", async () => {
    expect(solflareAdapter.venue).toBe("solflare");
  });

  it("returns a VenueCompatibilityResult for a matching profile", async () => {
    const result = await solflareAdapter.evaluate({ profile: baseProfile, rule: baseRule });
    expect(result.venue).toBe("solflare");
    expect(result.status).toBe("conditional");
    expect(result.source).toBe("heuristic");
  });

  it("output validates against venueCompatibilityResultSchema", async () => {
    const result = await solflareAdapter.evaluate({ profile: baseProfile, rule: baseRule });
    expect(venueCompatibilityResultSchema.safeParse(result).success).toBe(true);
  });

  it("returns supported when profile has no extensions", async () => {
    const profile = { ...baseProfile, extensions: [] };
    const result = await solflareAdapter.evaluate({ profile, rule: baseRule });
    expect(result.status).toBe("supported");
  });
});
