import type { MintProfile } from "@tarani/shared";

export const BASE_PROFILE: MintProfile = {
  mint: "HoNeYy4S3p5N1RfRy7Sw1FZuYxnDpQpqxXJEUmwwHZGv",
  programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  supply: "1000000000",
  decimals: 6,
  extensions: [],
  authorities: {
    mint: { kind: "mint", address: null, isRenounced: true },
    freeze: { kind: "freeze", address: null, isRenounced: true },
    update: { kind: "update", address: null, isRenounced: true },
  },
  metadata: {
    name: "Test Token",
    symbol: "TST",
    uri: "https://example.com/meta.json",
    quality: "complete",
    hasOnChainName: true,
    hasOnChainSymbol: true,
    decimals: 6,
  },
  warnings: [],
  fetchedAt: "2026-05-28T12:00:00.000Z",
};

export function withExtensions(
  kinds: string[],
  params: Record<string, Record<string, unknown>> = {},
): MintProfile {
  return {
    ...BASE_PROFILE,
    extensions: kinds.map((kind) => ({
      kind: kind as MintProfile["extensions"][number]["kind"],
      rawKind: kind,
      parameters: params[kind] ?? {},
      raw: {},
    })),
  };
}

export function withMetadata(overrides: Partial<MintProfile["metadata"]>): MintProfile {
  return { ...BASE_PROFILE, metadata: { ...BASE_PROFILE.metadata, ...overrides } };
}
