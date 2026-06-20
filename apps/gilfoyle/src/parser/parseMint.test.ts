import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mintProfileSchema } from "@tarani/shared";
import { allMintFixtures } from "@tarani/test-fixtures";
import type { HeliusAsset } from "../helius/types";
import { parseMintProfile } from "./parseMint";

const FROZEN_NOW = new Date("2026-05-28T12:00:00.000Z");

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FROZEN_NOW);
});

afterAll(() => {
  vi.useRealTimers();
});

describe("parseMintProfile snapshots", () => {
  for (const [name, fixture] of Object.entries(allMintFixtures)) {
    it(`matches snapshot for ${name}`, () => {
      const profile = parseMintProfile(fixture as unknown as HeliusAsset);
      expect(profile).toMatchSnapshot();
    });
  }
});

describe("parseMintProfile schema validation", () => {
  for (const [name, fixture] of Object.entries(allMintFixtures)) {
    it(`output conforms to mintProfileSchema for ${name}`, () => {
      const profile = parseMintProfile(fixture as unknown as HeliusAsset);
      const result = mintProfileSchema.safeParse(profile);
      if (!result.success) {
        throw new Error(
          `Schema validation failed for ${name}: ${JSON.stringify(result.error.issues, null, 2)}`,
        );
      }
      expect(result.success).toBe(true);
    });
  }
});

describe("parseMintProfile warning emission", () => {
  it("emits MISSING_METADATA_* warnings for the minimal-metadata synthetic", () => {
    const profile = parseMintProfile(allMintFixtures.minimalMetadata as unknown as HeliusAsset);
    const codes = profile.warnings.map((w) => w.code);
    expect(codes).toContain("MISSING_METADATA_NAME");
    expect(codes).toContain("MISSING_METADATA_SYMBOL");
    expect(codes).toContain("MISSING_METADATA_URI");
  });

  it("emits UNKNOWN_EXTENSION warnings for the unknown-extension synthetic", () => {
    const profile = parseMintProfile(allMintFixtures.unknownExtension as unknown as HeliusAsset);
    const unknownWarnings = profile.warnings.filter((w) => w.code === "UNKNOWN_EXTENSION");
    expect(unknownWarnings).toHaveLength(2);
    const unknowns = profile.extensions.filter((e) => e.kind === "unknown");
    expect(unknowns.map((e) => e.rawKind).sort()).toEqual([
      "alien_extension_42",
      "quantum_resistant_signer",
    ]);
  });
});

describe("parseMintProfile determinism", () => {
  it("returns deterministically ordered extensions", () => {
    const a = parseMintProfile(allMintFixtures.pyusd as unknown as HeliusAsset);
    const b = parseMintProfile(allMintFixtures.pyusd as unknown as HeliusAsset);
    expect(a.extensions.map((e) => e.rawKind)).toEqual(b.extensions.map((e) => e.rawKind));
    const sorted = [...a.extensions.map((e) => e.rawKind)].sort();
    expect(a.extensions.map((e) => e.rawKind)).toEqual(sorted);
  });
});
