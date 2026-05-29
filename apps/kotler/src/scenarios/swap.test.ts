import { describe, expect, it } from "vitest";
import { swapScenario } from "./swap";
import { BASE_PROFILE, withExtensions } from "./testHelpers";

describe("swap heuristic", () => {
  const run = (profile = BASE_PROFILE) => swapScenario.heuristic({ profile });

  it("returns success for a plain token with no restrictions", () => {
    const result = run();
    expect(result.kind).toBe("swap");
    expect(result.outcome).toBe("success");
  });

  it("returns blocked for nonTransferable token", () => {
    const result = run(withExtensions(["nonTransferable"]));
    expect(result.outcome).toBe("blocked");
    expect(result.failureCode).toBe("NON_TRANSFERABLE");
  });

  it("returns warning for transferFeeConfig token", () => {
    const result = run(withExtensions(["transferFeeConfig"]));
    expect(result.outcome).toBe("warning");
  });

  it("returns warning for transferHook token", () => {
    const result = run(withExtensions(["transferHook"]));
    expect(result.outcome).toBe("warning");
  });

  it("returns warning for pausable token", () => {
    const result = run(withExtensions(["pausable"]));
    expect(result.outcome).toBe("warning");
  });

  it("nonTransferable takes precedence over transferFeeConfig", () => {
    const result = run(withExtensions(["nonTransferable", "transferFeeConfig"]));
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
