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

  it("reports a dormant 0 bps fee as success (no fee withheld today)", () => {
    const result = run(
      withExtensions(["transferFeeConfig"], {
        transferFeeConfig: { transferFeeBasisPoints: 0, maximumFee: "0" },
      }),
    );
    expect(result.outcome).toBe("success");
    expect(result.summary).toContain("0 bps");
  });

  it("reads the rate from the nested newer_transfer_fee shape (real Helius DAS)", () => {
    const result = run(
      withExtensions(["transferFeeConfig"], {
        transferFeeConfig: {
          newer_transfer_fee: { transfer_fee_basis_points: 269, maximum_fee: "5000" },
        },
      }),
    );
    expect(result.outcome).toBe("warning");
    expect(result.summary).toContain("269 bps");
    expect(result.summary).toContain("2.69%");
  });

  it("returns blocked for nonTransferable token", () => {
    const result = run(withExtensions(["nonTransferable"]));
    expect(result.outcome).toBe("blocked");
    expect(result.failureCode).toBe("NON_TRANSFERABLE");
  });
});
