import { describe, expect, it } from "vitest";
import { wrapSolScenario } from "./wrapSol";
import { BASE_PROFILE, withExtensions } from "./testHelpers";

describe("wrap_sol heuristic", () => {
  const run = (profile = BASE_PROFILE) => wrapSolScenario.heuristic({ profile });

  it("returns success for a plain token with no restrictions", () => {
    const result = run();
    expect(result.kind).toBe("wrap_sol");
    expect(result.outcome).toBe("success");
  });

  it("returns blocked for nonTransferable token", () => {
    const result = run(withExtensions(["nonTransferable"]));
    expect(result.outcome).toBe("blocked");
    expect(result.failureCode).toBe("NON_TRANSFERABLE");
  });

  it("returns warning for transferHook token", () => {
    const result = run(withExtensions(["transferHook"]));
    expect(result.outcome).toBe("warning");
  });

  it("nonTransferable takes precedence over transferHook", () => {
    const result = run(withExtensions(["nonTransferable", "transferHook"]));
    expect(result.outcome).toBe("blocked");
    expect(result.failureCode).toBe("NON_TRANSFERABLE");
  });

  it("includes a non-empty summary", () => {
    expect(run().summary.length).toBeGreaterThan(0);
  });

  it("records a non-negative durationMs", () => {
    expect(run().durationMs).toBeGreaterThanOrEqual(0);
  });
});
