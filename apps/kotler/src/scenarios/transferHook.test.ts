import { describe, expect, it } from "vitest";
import { transferHookScenario } from "./transferHook";
import { BASE_PROFILE, withExtensions } from "./testHelpers";

describe("transferHook heuristic", () => {
  const run = (profile = BASE_PROFILE) => transferHookScenario.heuristic({ profile });

  it("returns success when no hook extension present", () => {
    const result = run();
    expect(result.kind).toBe("transfer_hook");
    expect(result.outcome).toBe("success");
  });

  it("returns warning when transferHook extension has a program address", () => {
    const result = run(
      withExtensions(["transferHook"], {
        transferHook: { programId: "SomeProgram111111111111111111111111111111111" },
      }),
    );
    expect(result.outcome).toBe("warning");
    expect(result.summary).toContain("SomeProgram111111111111111111111111111111111");
  });

  it("returns warning when transferHook extension has no program address set", () => {
    const result = run(withExtensions(["transferHook"], { transferHook: { programId: "" } }));
    expect(result.outcome).toBe("warning");
    expect(result.summary).toContain("no hook program is set");
  });

  it("returns blocked for nonTransferable token", () => {
    const result = run(withExtensions(["nonTransferable"]));
    expect(result.outcome).toBe("blocked");
    expect(result.failureCode).toBe("NON_TRANSFERABLE");
  });
});
