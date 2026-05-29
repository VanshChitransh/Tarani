import type { MintProfile, PrelaunchConfig } from "@tarani/shared";

const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const PLACEHOLDER_AUTHORITY = "prelaunch-authority-placeholder";
export const PRELAUNCH_MINT_SENTINEL = "prelaunch-synthetic-mint";

export function buildPrelaunchProfile(config: PrelaunchConfig): MintProfile {
  const { extensions, decimals, authorities, name, symbol } = config;

  const hasName = !!name;
  const hasSymbol = !!symbol;
  const quality = hasName && hasSymbol ? "complete" : hasName || hasSymbol ? "partial" : "missing";

  return {
    mint: PRELAUNCH_MINT_SENTINEL,
    programId: TOKEN_2022_PROGRAM_ID,
    supply: "0",
    decimals,
    extensions: extensions.map((e) => ({
      kind: e.kind,
      rawKind: e.kind,
      parameters: e.parameters ?? {},
      raw: {},
    })),
    authorities: {
      mint: {
        kind: "mint",
        address: authorities.mintRenounced ? null : PLACEHOLDER_AUTHORITY,
        isRenounced: authorities.mintRenounced,
      },
      freeze: {
        kind: "freeze",
        address: authorities.freezeRenounced ? null : PLACEHOLDER_AUTHORITY,
        isRenounced: authorities.freezeRenounced,
      },
      update: {
        kind: "update",
        address: authorities.updateRenounced ? null : PLACEHOLDER_AUTHORITY,
        isRenounced: authorities.updateRenounced,
      },
    },
    metadata: {
      name,
      symbol,
      uri: "",
      decimals,
      quality,
      hasOnChainName: hasName,
      hasOnChainSymbol: hasSymbol,
    },
    warnings: [],
    fetchedAt: new Date().toISOString(),
  };
}
