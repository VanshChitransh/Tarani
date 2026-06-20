import { describe, expect, it } from "vitest";
import type { MintProfile, VenueCompatibilityResult } from "@tarani/shared";
import { applyOverride, OVERRIDES, type CompatibilityOverride } from "./overrides";

const baseResult: VenueCompatibilityResult = {
  venue: "raydium",
  status: "supported",
  source: "heuristic",
  confidence: "low",
  evidence: [],
  notes: [],
};

const hookedProfile = {
  extensions: [{ kind: "transferHook", rawKind: "transferHook", parameters: {}, raw: {} }],
} as unknown as MintProfile;

describe("applyOverride", () => {
  it("ships with an empty override list by default", () => {
    expect(OVERRIDES).toEqual([]);
  });

  it("returns the result unchanged when nothing matches", () => {
    expect(applyOverride(baseResult, hookedProfile, [])).toBe(baseResult);
  });

  it("forces status, sets source=override, and appends evidence on a venue match", () => {
    const overrides: CompatibilityOverride[] = [
      { venue: "raydium", status: "blocked", reason: "manual: AMM rejects this config" },
    ];
    const r = applyOverride(baseResult, hookedProfile, overrides);
    expect(r.status).toBe("blocked");
    expect(r.source).toBe("override");
    expect(r.notes).toContain("manual: AMM rejects this config");
    expect(r.evidence.at(-1)).toMatchObject({
      kind: "doc",
      reference: "Manual compatibility override",
    });
  });

  it("respects the optional extension filter (no match -> unchanged)", () => {
    const overrides: CompatibilityOverride[] = [
      {
        venue: "raydium",
        status: "blocked",
        reason: "only fee tokens",
        extension: "transferFeeConfig",
      },
    ];
    expect(applyOverride(baseResult, hookedProfile, overrides).status).toBe("supported");
  });
});
