import { describe, expect, it } from "vitest";
import { selectScenarios } from "./runSimulation";
import { BASE_PROFILE, withExtensions } from "../scenarios/testHelpers";

describe("selectScenarios", () => {
  it("runs the baseline and no extension-specific scenarios for a plain mint", () => {
    const s = selectScenarios(BASE_PROFILE);
    expect(s).toEqual(
      expect.arrayContaining([
        "transfer",
        "associated_token_create",
        "metadata_check",
        "freeze_check",
      ]),
    );
    expect(s).not.toContain("transfer_fee");
    expect(s).not.toContain("transfer_hook");
    expect(s).not.toContain("memo_required");
  });

  it("adds transfer_fee only when transferFeeConfig is present", () => {
    expect(selectScenarios(withExtensions(["transferFeeConfig"]))).toContain("transfer_fee");
  });

  it("adds transfer_hook and memo_required by detected extension", () => {
    const s = selectScenarios(withExtensions(["transferHook", "memoTransfer"]));
    expect(s).toContain("transfer_hook");
    expect(s).toContain("memo_required");
  });
});
