import { describe, expect, it } from "vitest";
import type { VenueCompatibilityResult } from "@tarani/shared";
import { diffCompatibility } from "./diffEngine";

function result(
  venue: VenueCompatibilityResult["venue"],
  status: VenueCompatibilityResult["status"],
): VenueCompatibilityResult {
  return {
    venue,
    status,
    confidence: "high",
    evidence: [],
    checkedAt: new Date().toISOString(),
  };
}

describe("diffCompatibility", () => {
  it("returns empty array when baseline equals current", () => {
    const snap = [result("jupiter", "supported"), result("raydium", "partial")];
    expect(diffCompatibility(snap, snap)).toEqual([]);
  });

  it("detects degraded status (supported → blocked)", () => {
    const baseline = [result("jupiter", "supported")];
    const current = [result("jupiter", "blocked")];
    const diffs = diffCompatibility(baseline, current);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({
      venue: "jupiter",
      kind: "degraded",
      from: "supported",
      to: "blocked",
    });
  });

  it("detects improved status (blocked → partial)", () => {
    const baseline = [result("raydium", "blocked")];
    const current = [result("raydium", "partial")];
    const diffs = diffCompatibility(baseline, current);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({
      venue: "raydium",
      kind: "improved",
      from: "blocked",
      to: "partial",
    });
  });

  it("detects degraded status for conditional → unknown (rank 1 → 0)", () => {
    const baseline = [result("orca", "conditional")];
    const current = [result("orca", "unknown")];
    const diffs = diffCompatibility(baseline, current);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({
      venue: "orca",
      kind: "degraded",
      from: "conditional",
      to: "unknown",
    });
  });

  it("handles multiple venues with mixed changes in one call", () => {
    const baseline = [
      result("jupiter", "supported"),
      result("raydium", "blocked"),
      result("orca", "partial"),
    ];
    const current = [
      result("jupiter", "blocked"),
      result("raydium", "supported"),
      result("orca", "partial"),
    ];
    const diffs = diffCompatibility(baseline, current);
    expect(diffs).toHaveLength(2);
    expect(diffs.find((d) => d.venue === "jupiter")).toMatchObject({ kind: "degraded" });
    expect(diffs.find((d) => d.venue === "raydium")).toMatchObject({ kind: "improved" });
  });

  it("ignores venues present in current but absent from baseline (new venue)", () => {
    const baseline = [result("jupiter", "supported")];
    const current = [result("jupiter", "supported"), result("raydium", "partial")];
    expect(diffCompatibility(baseline, current)).toEqual([]);
  });

  it("emits changed for venues present in baseline but missing from current", () => {
    const baseline = [result("jupiter", "supported"), result("raydium", "partial")];
    const current = [result("jupiter", "supported")];
    const diffs = diffCompatibility(baseline, current);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ venue: "raydium", kind: "changed" });
  });

  it("detectedAt on every result is a valid ISO 8601 datetime string", () => {
    const baseline = [result("jupiter", "supported")];
    const current = [result("jupiter", "blocked")];
    const diffs = diffCompatibility(baseline, current);
    expect(diffs).toHaveLength(1);
    expect(() => new Date(diffs[0]!.detectedAt).toISOString()).not.toThrow();
  });
});
