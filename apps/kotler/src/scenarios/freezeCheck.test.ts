import { describe, expect, it } from "vitest";
import type { MintProfile } from "@tarani/shared";
import { freezeCheckScenario } from "./freezeCheck";
import { BASE_PROFILE, withExtensions } from "./testHelpers";

describe("freezeCheck heuristic", () => {
  it("succeeds when there is no freeze authority and no default-frozen state", () => {
    expect(freezeCheckScenario.heuristic({ profile: BASE_PROFILE }).outcome).toBe("success");
  });

  it("warns when the freeze authority is active", () => {
    const profile: MintProfile = {
      ...BASE_PROFILE,
      authorities: {
        ...BASE_PROFILE.authorities,
        freeze: {
          kind: "freeze",
          address: "Fr33zeAuth1111111111111111111111111111111111",
          isRenounced: false,
        },
      },
    };
    expect(freezeCheckScenario.heuristic({ profile }).outcome).toBe("warning");
  });

  it("flags default-frozen accounts when DefaultAccountState is present", () => {
    const r = freezeCheckScenario.heuristic({ profile: withExtensions(["defaultAccountState"]) });
    expect(r.outcome).toBe("warning");
    expect(r.failureCode).toBe("DEFAULT_FROZEN");
  });

  // When the mint has no freeze power, the live path reaches a structural
  // conclusion without a validator tx (mode "analysis") — and therefore does not
  // touch ctx.connection, so a minimal ctx is sufficient here. The freeze-power
  // path (mode "validator") requires a real validator and is exercised by the
  // live simulation run, not this unit test.
  it("live reports structural success (mode analysis) when there is no freeze power", async () => {
    const r = await freezeCheckScenario.live({
      profile: BASE_PROFILE,
    } as unknown as Parameters<typeof freezeCheckScenario.live>[0]);
    expect(r.outcome).toBe("success");
    expect(r.mode).toBe("analysis");
  });

  it("heuristic results are tagged mode analysis", () => {
    expect(freezeCheckScenario.heuristic({ profile: BASE_PROFILE }).mode).toBe("analysis");
  });
});
