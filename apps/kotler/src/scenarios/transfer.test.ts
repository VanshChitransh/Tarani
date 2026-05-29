import { describe, expect, it } from "vitest";
import { transferScenario } from "./transfer";
import { BASE_PROFILE, withExtensions } from "./testHelpers";

describe("transfer heuristic", () => {
  const run = (profile = BASE_PROFILE) => transferScenario.heuristic({ profile });

  it("returns success for a plain token with no restrictions", () => {
    const result = run();
    expect(result.kind).toBe("transfer");
    expect(result.outcome).toBe("success");
  });

  it("returns blocked for nonTransferable token", () => {
    const result = run(withExtensions(["nonTransferable"]));
    expect(result.outcome).toBe("blocked");
    expect(result.failureCode).toBe("NON_TRANSFERABLE");
  });

  it("returns warning for pausable token", () => {
    const result = run(withExtensions(["pausable"]));
    expect(result.outcome).toBe("warning");
  });

  it("nonTransferable takes precedence over pausable", () => {
    const result = run(withExtensions(["nonTransferable", "pausable"]));
    expect(result.outcome).toBe("blocked");
  });

  it("includes a non-empty summary", () => {
    expect(run().summary.length).toBeGreaterThan(0);
  });

  it("records a non-negative durationMs", () => {
    expect(run().durationMs).toBeGreaterThanOrEqual(0);
  });
});
