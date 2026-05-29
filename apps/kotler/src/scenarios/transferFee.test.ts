import { describe, expect, it } from "vitest";
import { transferFeeScenario } from "./transferFee";
import { BASE_PROFILE, withExtensions } from "./testHelpers";

describe("transferFee heuristic", () => {
  const run = (profile = BASE_PROFILE) => transferFeeScenario.heuristic({ profile });

  it("returns success for a token with no fee config", () => {
    const result = run();
    expect(result.kind).toBe("transfer_fee");
    expect(result.outcome).toBe("success");
  });

  it("returns warning when transferFeeConfig is present", () => {
    const result = run(
      withExtensions(["transferFeeConfig"], {
        transferFeeConfig: { transferFeeBasisPoints: 100, maximumFee: "1000000" },
      }),
    );
    expect(result.outcome).toBe("warning");
    expect(result.summary).toContain("100 bps");
    expect(result.summary).toContain("1000000");
  });

  it("shows 0% fee when basis points are 0", () => {
    const result = run(
      withExtensions(["transferFeeConfig"], {
        transferFeeConfig: { transferFeeBasisPoints: 0, maximumFee: "0" },
      }),
    );
    expect(result.outcome).toBe("warning");
    expect(result.summary).toContain("0 bps");
  });

  it("returns blocked for nonTransferable token", () => {
    const result = run(withExtensions(["nonTransferable"]));
    expect(result.outcome).toBe("blocked");
    expect(result.failureCode).toBe("NON_TRANSFERABLE");
  });
});
