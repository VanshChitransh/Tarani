import { describe, expect, it } from "vitest";
import { venueCompatibilityResultSchema } from "@tarani/shared";
import type { MintProfile } from "@tarani/shared";
import type { VenueRule } from "../rules";
import { aggregateConfidence, evaluateRule, pickOverallStatus } from "./evaluator";

const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

function makeProfile(extensionKinds: string[]): MintProfile {
  return {
    mint: "HoNeYy4S3p5N1RfRy7Sw1FZuYxnDpQpqxXJEUmwwHZGv",
    programId: TOKEN_2022,
    supply: "1000000000",
    decimals: 9,
    extensions: extensionKinds.map((kind) => ({
      kind: kind as MintProfile["extensions"][number]["kind"],
      rawKind: kind,
      parameters: {},
      raw: {},
    })),
    authorities: {
      mint: { kind: "mint", address: null, isRenounced: true },
      freeze: { kind: "freeze", address: null, isRenounced: true },
      update: { kind: "update", address: null, isRenounced: true },
    },
    metadata: {
      name: "TestToken",
      symbol: "TEST",
      uri: "https://example.com/meta.json",
      decimals: 9,
      quality: "complete",
      hasOnChainName: true,
      hasOnChainSymbol: true,
    },
    warnings: [],
    fetchedAt: new Date().toISOString(),
  };
}

function makeRule(venue: VenueRule["venue"], features: VenueRule["features"]): VenueRule {
  return { venue, version: "0.2.0", last_updated: "2026-05-29", features, notes: [] };
}

// --- pickOverallStatus ---

describe("pickOverallStatus", () => {
  it("returns unknown for empty verdicts", () => {
    expect(pickOverallStatus([])).toBe("unknown");
  });

  it("returns supported when all verdicts are supported", () => {
    const v = [
      { status: "supported" as const, confidence: "high" as const, evidence: [], notes: [] },
      { status: "supported" as const, confidence: "medium" as const, evidence: [], notes: [] },
    ];
    expect(pickOverallStatus(v)).toBe("supported");
  });

  it("blocked wins over everything", () => {
    const v = [
      { status: "supported" as const, confidence: "high" as const, evidence: [], notes: [] },
      { status: "conditional" as const, confidence: "high" as const, evidence: [], notes: [] },
      { status: "blocked" as const, confidence: "high" as const, evidence: [], notes: [] },
    ];
    expect(pickOverallStatus(v)).toBe("blocked");
  });

  it("conditional wins over partial and supported", () => {
    const v = [
      { status: "supported" as const, confidence: "high" as const, evidence: [], notes: [] },
      { status: "partial" as const, confidence: "high" as const, evidence: [], notes: [] },
      { status: "conditional" as const, confidence: "high" as const, evidence: [], notes: [] },
    ];
    expect(pickOverallStatus(v)).toBe("conditional");
  });

  it("partial wins over unknown and supported", () => {
    const v = [
      { status: "unknown" as const, confidence: "low" as const, evidence: [], notes: [] },
      { status: "partial" as const, confidence: "medium" as const, evidence: [], notes: [] },
    ];
    expect(pickOverallStatus(v)).toBe("partial");
  });
});

// --- aggregateConfidence ---

describe("aggregateConfidence", () => {
  it("returns low for empty verdicts", () => {
    expect(aggregateConfidence([], "unknown")).toBe("low");
  });

  it("returns the confidence of the single status-driving verdict", () => {
    const v = [
      { status: "blocked" as const, confidence: "high" as const, evidence: [], notes: [] },
    ];
    expect(aggregateConfidence(v, "blocked")).toBe("high");
  });

  it("returns lowest confidence among drivers when there are multiple", () => {
    const v = [
      { status: "blocked" as const, confidence: "high" as const, evidence: [], notes: [] },
      { status: "blocked" as const, confidence: "low" as const, evidence: [], notes: [] },
    ];
    expect(aggregateConfidence(v, "blocked")).toBe("low");
  });

  it("ignores non-driving verdicts when picking confidence", () => {
    // overall is blocked; the supported verdict should NOT lower confidence
    const v = [
      { status: "blocked" as const, confidence: "high" as const, evidence: [], notes: [] },
      { status: "supported" as const, confidence: "low" as const, evidence: [], notes: [] },
    ];
    expect(aggregateConfidence(v, "blocked")).toBe("high");
  });
});

// --- evaluateRule ---

describe("evaluateRule", () => {
  it("returns unknown when no features match the profile's extensions", () => {
    const profile = makeProfile([]);
    const rule = makeRule("jupiter", [
      { id: "transferFeeConfig", status: "blocked", confidence: "high", evidence: [], notes: [] },
    ]);
    const result = evaluateRule(profile, rule);
    expect(result.status).toBe("unknown");
    expect(result.venue).toBe("jupiter");
    expect(result.source).toBe("heuristic");
  });

  it("returns blocked when a matching feature has status blocked", () => {
    const profile = makeProfile(["transferHook"]);
    const rule = makeRule("jupiter", [
      {
        id: "transferHook",
        status: "blocked",
        confidence: "high",
        evidence: ["https://docs.jup.ag/blocked"],
        notes: ["Blocked by Jupiter"],
      },
    ]);
    const result = evaluateRule(profile, rule);
    expect(result.status).toBe("blocked");
    expect(result.confidence).toBe("high");
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0]?.kind).toBe("doc");
    expect(result.evidence[0]?.reference).toBe("https://docs.jup.ag/blocked");
    expect(result.notes).toContain("Blocked by Jupiter");
  });

  it("output validates against venueCompatibilityResultSchema", () => {
    const profile = makeProfile(["transferHook"]);
    const rule = makeRule("orca", [
      {
        id: "transferHook",
        status: "conditional",
        confidence: "medium",
        evidence: ["https://orca.so/docs"],
        notes: [],
      },
    ]);
    const result = evaluateRule(profile, rule);
    const parsed = venueCompatibilityResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it("features without a confidence field default to low", () => {
    const profile = makeProfile(["permanentDelegate"]);
    const rule = makeRule("raydium", [
      { id: "permanentDelegate", status: "conditional", evidence: [], notes: [] },
    ]);
    const result = evaluateRule(profile, rule);
    expect(result.confidence).toBe("low");
  });
});
