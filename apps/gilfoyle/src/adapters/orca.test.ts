import { describe, expect, it } from "vitest";
import { venueCompatibilityResultSchema } from "@tarani/shared";
import type { MintProfile } from "@tarani/shared";
import type { VenueRule } from "../rules";
import { orcaAdapter } from "./orca";

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

describe("orcaAdapter", () => {
  it("has venue id 'orca'", () => {
    expect(orcaAdapter.venue).toBe("orca");
  });

  it("returns a VenueCompatibilityResult for a matching profile", () => {
    const result = orcaAdapter.evaluate({ profile: baseProfile, rule: baseRule });
    expect(result.venue).toBe("orca");
    expect(result.status).toBe("conditional");
    expect(result.source).toBe("heuristic");
  });

  it("output validates against venueCompatibilityResultSchema", () => {
    const result = orcaAdapter.evaluate({ profile: baseProfile, rule: baseRule });
    expect(venueCompatibilityResultSchema.safeParse(result).success).toBe(true);
  });

  it("returns unknown when profile has no matching extensions", () => {
    const profile = { ...baseProfile, extensions: [] };
    const result = orcaAdapter.evaluate({ profile, rule: baseRule });
    expect(result.status).toBe("unknown");
  });
});
