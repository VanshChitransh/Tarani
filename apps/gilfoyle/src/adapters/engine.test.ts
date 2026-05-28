import { describe, expect, it } from "vitest";
import { VENUE_IDS, venueCompatibilityResultSchema } from "@tarani/shared";
import type { MintProfile } from "@tarani/shared";
import { runCompatibilityEngine } from "./engine";

const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

const fixtureProfile: MintProfile = {
  mint: "HoNeYy4S3p5N1RfRy7Sw1FZuYxnDpQpqxXJEUmwwHZGv",
  programId: TOKEN_2022,
  supply: "10000000000000000000",
  decimals: 9,
  extensions: [
    { kind: "transferHook", rawKind: "transfer_hook", parameters: {}, raw: {} },
    { kind: "metadataPointer", rawKind: "metadata_pointer", parameters: {}, raw: {} },
  ],
  authorities: {
    mint: { kind: "mint", address: null, isRenounced: true },
    freeze: { kind: "freeze", address: null, isRenounced: true },
    update: { kind: "update", address: null, isRenounced: true },
  },
  metadata: {
    name: "Hivemapper",
    symbol: "HONEY",
    uri: "https://example.com/metadata/honey.json",
    decimals: 9,
    quality: "complete",
    hasOnChainName: true,
    hasOnChainSymbol: true,
  },
  warnings: [],
  fetchedAt: new Date().toISOString(),
};

describe("runCompatibilityEngine", () => {
  it("returns exactly 5 results", () => {
    const results = runCompatibilityEngine(fixtureProfile);
    expect(results).toHaveLength(5);
  });

  it("results are in VENUE_IDS order", () => {
    const results = runCompatibilityEngine(fixtureProfile);
    const venues = results.map((r) => r.venue);
    expect(venues).toEqual([...VENUE_IDS]);
  });

  it("every result validates against venueCompatibilityResultSchema", () => {
    const results = runCompatibilityEngine(fixtureProfile);
    for (const result of results) {
      const parsed = venueCompatibilityResultSchema.safeParse(result);
      expect(parsed.success, `${result.venue} failed schema validation`).toBe(true);
    }
  });

  it("every result has source heuristic", () => {
    const results = runCompatibilityEngine(fixtureProfile);
    for (const result of results) {
      expect(result.source).toBe("heuristic");
    }
  });
});
