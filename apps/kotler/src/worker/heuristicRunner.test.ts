import { describe, expect, it } from "vitest";
import { runHeuristic } from "./heuristicRunner";
import { BASE_PROFILE, withExtensions } from "../scenarios/testHelpers";
import type { ScenarioKind } from "@tarani/shared";

const ALL_SCENARIOS: ScenarioKind[] = [
  "transfer",
  "transfer_hook",
  "transfer_fee",
  "memo_required",
  "metadata_check",
];

describe("runHeuristic", () => {
  it("returns one result per requested scenario", () => {
    const results = runHeuristic(BASE_PROFILE, ALL_SCENARIOS);
    expect(results).toHaveLength(ALL_SCENARIOS.length);
  });

  it("each result kind matches the requested scenario kind", () => {
    const results = runHeuristic(BASE_PROFILE, ALL_SCENARIOS);
    ALL_SCENARIOS.forEach((kind, i) => {
      expect(results[i].kind).toBe(kind);
    });
  });

  it("returns empty array for empty scenario list", () => {
    expect(runHeuristic(BASE_PROFILE, [])).toEqual([]);
  });

  it("surfaces an explicit error result for an unregistered scenario kind", () => {
    const results = runHeuristic(BASE_PROFILE, ["totally_unknown_kind" as ScenarioKind]);
    expect(results).toHaveLength(1);
    expect(results[0].outcome).toBe("error");
    expect(results[0].failureCode).toBe("NOT_IMPLEMENTED");
  });

  it("runs a subset of scenarios when only some are requested", () => {
    const results = runHeuristic(BASE_PROFILE, ["transfer", "metadata_check"]);
    expect(results).toHaveLength(2);
    expect(results[0].kind).toBe("transfer");
    expect(results[1].kind).toBe("metadata_check");
  });

  it("all results have unique ids", () => {
    const results = runHeuristic(BASE_PROFILE, ALL_SCENARIOS);
    const ids = results.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("nonTransferable token blocks transfer and memo_required", () => {
    const profile = withExtensions(["nonTransferable"]);
    const results = runHeuristic(profile, ["transfer", "memo_required", "metadata_check"]);
    const byKind = Object.fromEntries(results.map((r) => [r.kind, r]));
    expect(byKind["transfer"].outcome).toBe("blocked");
    expect(byKind["memo_required"].outcome).toBe("blocked");
    expect(byKind["metadata_check"].outcome).toBe("success");
  });

  it("all results have non-negative durationMs", () => {
    const results = runHeuristic(BASE_PROFILE, ALL_SCENARIOS);
    for (const r of results) {
      expect(r.durationMs).toBeGreaterThanOrEqual(0);
    }
  });
});
