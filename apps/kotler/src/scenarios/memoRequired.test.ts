import { describe, expect, it } from "vitest";
import { memoRequiredScenario } from "./memoRequired";
import { BASE_PROFILE, withExtensions } from "./testHelpers";

describe("memoRequired heuristic", () => {
  const run = (profile = BASE_PROFILE) => memoRequiredScenario.heuristic({ profile });

  it("returns success when no memoTransfer extension", () => {
    const result = run();
    expect(result.kind).toBe("memo_required");
    expect(result.outcome).toBe("success");
  });

  it("returns warning when memoTransfer extension is present", () => {
    const result = run(withExtensions(["memoTransfer"]));
    expect(result.outcome).toBe("warning");
    expect(result.summary.toLowerCase()).toContain("memo");
  });

  it("returns blocked for nonTransferable token", () => {
    const result = run(withExtensions(["nonTransferable"]));
    expect(result.outcome).toBe("blocked");
    expect(result.failureCode).toBe("NON_TRANSFERABLE");
  });

  it("nonTransferable takes precedence over memoTransfer", () => {
    const result = run(withExtensions(["nonTransferable", "memoTransfer"]));
    expect(result.outcome).toBe("blocked");
  });
});
