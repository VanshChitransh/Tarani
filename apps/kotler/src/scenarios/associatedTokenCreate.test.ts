import { describe, expect, it } from "vitest";
import { associatedTokenCreateScenario } from "./associatedTokenCreate";
import { BASE_PROFILE, withExtensions } from "./testHelpers";

describe("associatedTokenCreate heuristic", () => {
  it("succeeds for a plain mint", () => {
    const r = associatedTokenCreateScenario.heuristic({ profile: BASE_PROFILE });
    expect(r.kind).toBe("associated_token_create");
    expect(r.outcome).toBe("success");
  });

  it("warns when DefaultAccountState may freeze new accounts", () => {
    const r = associatedTokenCreateScenario.heuristic({
      profile: withExtensions(["defaultAccountState"]),
    });
    expect(r.outcome).toBe("warning");
  });
});
