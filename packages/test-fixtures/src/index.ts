import pyusd from "../mints/real/pyusd.json" with { type: "json" };
import usdc from "../mints/real/usdc.json" with { type: "json" };
import transferHookToken from "../mints/real/transfer-hook-token.json" with { type: "json" };
import minimalMetadata from "../mints/synthetic/minimal-metadata.json" with { type: "json" };
import unknownExtension from "../mints/synthetic/unknown-extension.json" with { type: "json" };

export const realMintFixtures = {
  pyusd,
  usdc,
  transferHookToken,
} as const;

export const syntheticMintFixtures = {
  minimalMetadata,
  unknownExtension,
} as const;

export type RealMintFixtureName = keyof typeof realMintFixtures;
export type SyntheticMintFixtureName = keyof typeof syntheticMintFixtures;

export const allMintFixtures = {
  ...realMintFixtures,
  ...syntheticMintFixtures,
} as const;

export type MintFixtureName = keyof typeof allMintFixtures;

/**
 * Look up a bundled mint fixture by its on-chain address (the Helius asset `id`).
 * Returns the raw Helius-asset-shaped JSON, or null if no fixture matches.
 * Used by the DEMO_MODE fallback so the app can serve a believable report when
 * the live RPC is unavailable during a demo.
 */
export function findMintFixtureByAddress(address: string): unknown | null {
  for (const fixture of Object.values(allMintFixtures)) {
    if ((fixture as { id?: string }).id === address) return fixture;
  }
  return null;
}
