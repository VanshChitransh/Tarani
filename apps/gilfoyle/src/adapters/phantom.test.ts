import { describe, expect, it } from "vitest";
import { venueCompatibilityResultSchema } from "@tarani/shared";
import type { MintProfile } from "@tarani/shared";
import type { VenueRule } from "../rules";
import { phantomAdapter } from "./phantom";

const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

const baseProfile: MintProfile = {
  mint: "HoNeYy4S3p5N1RfRy7Sw1FZuYxnDpQpqxXJEUmwwHZGv",
  programId: TOKEN_2022,
  supply: "1000000000",
  decimals: 9,
  extensions: [{ kind: "nonTransferable", rawKind: "non_transferable", parameters: {}, raw: {} }],
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
  venue: "phantom",
  version: "0.2.0",
  last_updated: "2026-05-29",
  features: [
    {
      id: "nonTransferable",
      status: "blocked",
      confidence: "high",
      evidence: ["https://phantom.app/learn/developers/tokens"],
      notes: ["Non-transferable tokens cannot be sent via Phantom"],
    },
  ],
  notes: [],
};

describe("phantomAdapter", () => {
  it("has venue id 'phantom'", async () => {
    expect(phantomAdapter.venue).toBe("phantom");
  });

  it("returns a VenueCompatibilityResult for a matching profile", async () => {
    const result = await phantomAdapter.evaluate({ profile: baseProfile, rule: baseRule });
    expect(result.venue).toBe("phantom");
    expect(result.status).toBe("blocked");
    expect(result.source).toBe("heuristic");
  });

  it("output validates against venueCompatibilityResultSchema", async () => {
    const result = await phantomAdapter.evaluate({ profile: baseProfile, rule: baseRule });
    expect(venueCompatibilityResultSchema.safeParse(result).success).toBe(true);
  });

  it("returns unknown when profile has no matching extensions", async () => {
    const profile = { ...baseProfile, extensions: [] };
    const result = await phantomAdapter.evaluate({ profile, rule: baseRule });
    expect(result.status).toBe("unknown");
  });
});
