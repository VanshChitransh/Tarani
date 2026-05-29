import { describe, expect, it } from "vitest";
import type { PrelaunchConfig } from "@tarani/shared";
import { buildPrelaunchProfile, PRELAUNCH_MINT_SENTINEL } from "./profileBuilder";

const baseConfig: PrelaunchConfig = {
  extensions: [],
  decimals: 6,
  authorities: { mintRenounced: false, freezeRenounced: false, updateRenounced: false },
};

describe("buildPrelaunchProfile", () => {
  it("builds a profile with the specified decimals", () => {
    const profile = buildPrelaunchProfile({ ...baseConfig, decimals: 9 });
    expect(profile.decimals).toBe(9);
    expect(profile.metadata.decimals).toBe(9);
  });

  it("marks authorities as renounced when config says so", () => {
    const profile = buildPrelaunchProfile({
      ...baseConfig,
      authorities: { mintRenounced: true, freezeRenounced: true, updateRenounced: true },
    });
    expect(profile.authorities.mint.address).toBeNull();
    expect(profile.authorities.mint.isRenounced).toBe(true);
    expect(profile.authorities.freeze.address).toBeNull();
    expect(profile.authorities.update.address).toBeNull();
  });

  it("sets placeholder address when authority is not renounced", () => {
    const profile = buildPrelaunchProfile(baseConfig);
    expect(profile.authorities.mint.address).toBe("prelaunch-authority-placeholder");
    expect(profile.authorities.mint.isRenounced).toBe(false);
  });

  it("includes all specified extensions", () => {
    const profile = buildPrelaunchProfile({
      ...baseConfig,
      extensions: [
        { kind: "nonTransferable" },
        { kind: "transferFeeConfig", parameters: { feeBasisPoints: 100 } },
      ],
    });
    expect(profile.extensions).toHaveLength(2);
    expect(profile.extensions[0]?.kind).toBe("nonTransferable");
    expect(profile.extensions[1]?.kind).toBe("transferFeeConfig");
    expect(profile.extensions[1]?.parameters).toEqual({ feeBasisPoints: 100 });
  });

  it("sets metadata.quality to complete when both name and symbol are provided", () => {
    const profile = buildPrelaunchProfile({ ...baseConfig, name: "My Token", symbol: "MTK" });
    expect(profile.metadata.quality).toBe("complete");
    expect(profile.metadata.hasOnChainName).toBe(true);
    expect(profile.metadata.hasOnChainSymbol).toBe(true);
  });

  it("sets metadata.quality to missing when neither name nor symbol is provided", () => {
    const profile = buildPrelaunchProfile(baseConfig);
    expect(profile.metadata.quality).toBe("missing");
    expect(profile.metadata.hasOnChainName).toBe(false);
    expect(profile.metadata.hasOnChainSymbol).toBe(false);
  });

  it("uses the sentinel string as the mint value, not a real Solana address", () => {
    const profile = buildPrelaunchProfile(baseConfig);
    expect(profile.mint).toBe(PRELAUNCH_MINT_SENTINEL);
    expect(profile.mint).not.toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
  });
});
