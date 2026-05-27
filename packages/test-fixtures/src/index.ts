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
