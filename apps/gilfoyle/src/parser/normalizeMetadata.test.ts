import { describe, expect, it } from "vitest";
import type { HeliusAsset } from "../helius/types";
import { normalizeMetadata } from "./normalizeMetadata";

function asset(overrides: Partial<HeliusAsset>): HeliusAsset {
  return {
    interface: "FungibleToken",
    id: "MintAddr1111111111111111111111111111111111",
    token_info: { decimals: 6 },
    ...overrides,
  } as HeliusAsset;
}

describe("normalizeMetadata — on-chain TokenMetadata detection (S1 regression)", () => {
  it("reads on-chain name/symbol from the Helius 'metadata' key (real DAS shape)", () => {
    const { metadata } = normalizeMetadata(
      asset({
        mint_extensions: {
          metadata: { name: "PayPal USD", symbol: "PYUSD", uri: "https://x/y.json" },
        },
      }),
    );
    expect(metadata.hasOnChainName).toBe(true);
    expect(metadata.hasOnChainSymbol).toBe(true);
    expect(metadata.name).toBe("PayPal USD");
    expect(metadata.symbol).toBe("PYUSD");
    expect(metadata.quality).toBe("complete");
  });

  it("still reads the legacy 'token_metadata' key as a fallback", () => {
    const { metadata } = normalizeMetadata(
      asset({
        mint_extensions: {
          token_metadata: { name: "Solayer USD", symbol: "sUSD", uri: "https://x/y.json" },
        },
      }),
    );
    expect(metadata.hasOnChainName).toBe(true);
    expect(metadata.hasOnChainSymbol).toBe(true);
    expect(metadata.name).toBe("Solayer USD");
  });

  it("treats an empty on-chain name/symbol as absent and falls back to off-chain", () => {
    const { metadata } = normalizeMetadata(
      asset({
        mint_extensions: { metadata: { name: "", symbol: "", uri: "" } },
        content: { metadata: { name: "Off Chain", symbol: "OC" }, json_uri: "https://x/y.json" },
      }),
    );
    expect(metadata.hasOnChainName).toBe(false);
    expect(metadata.hasOnChainSymbol).toBe(false);
    expect(metadata.name).toBe("Off Chain");
    expect(metadata.symbol).toBe("OC");
  });

  it("hasOnChainName/Symbol are false for a legacy mint with no metadata extension", () => {
    const { metadata } = normalizeMetadata(
      asset({ content: { metadata: { name: "USD Coin", symbol: "USDC" } } }),
    );
    expect(metadata.hasOnChainName).toBe(false);
    expect(metadata.hasOnChainSymbol).toBe(false);
    expect(metadata.name).toBe("USD Coin");
  });
});
