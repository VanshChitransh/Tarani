import type { MetadataProfile, MetadataQuality, ParserWarning } from "@tarani/shared";
import type { HeliusAsset } from "../helius/types";

export interface NormalizeMetadataOutput {
  metadata: MetadataProfile;
  warnings: ParserWarning[];
}

export function normalizeMetadata(asset: HeliusAsset): NormalizeMetadataOutput {
  const warnings: ParserWarning[] = [];

  const onChainTokenMetadata = readTokenMetadataExtension(asset);
  const offChainMetadata = asset.content?.metadata;

  const name = onChainTokenMetadata?.name ?? offChainMetadata?.name ?? undefined;
  const symbol =
    onChainTokenMetadata?.symbol ??
    offChainMetadata?.symbol ??
    asset.token_info?.symbol ??
    undefined;
  const uri = onChainTokenMetadata?.uri ?? asset.content?.json_uri ?? undefined;

  const hasOnChainName =
    typeof onChainTokenMetadata?.name === "string" && onChainTokenMetadata.name.length > 0;
  const hasOnChainSymbol =
    typeof onChainTokenMetadata?.symbol === "string" && onChainTokenMetadata.symbol.length > 0;

  if (!name) {
    warnings.push({
      code: "MISSING_METADATA_NAME",
      message: "Mint has no resolvable name",
      path: "content.metadata.name",
    });
  }
  if (!symbol) {
    warnings.push({
      code: "MISSING_METADATA_SYMBOL",
      message: "Mint has no resolvable symbol",
      path: "content.metadata.symbol",
    });
  }
  if (!uri) {
    warnings.push({
      code: "MISSING_METADATA_URI",
      message: "Mint has no metadata URI",
      path: "content.json_uri",
    });
  }

  const decimals = asset.token_info?.decimals;
  if (decimals === undefined || decimals === null) {
    warnings.push({
      code: "MISSING_DECIMALS",
      message: "Mint has no decimals; defaulting to 0",
      path: "token_info.decimals",
    });
  }

  const quality = computeQuality(name, symbol, uri);

  const metadata: MetadataProfile = {
    decimals: decimals ?? 0,
    quality,
    hasOnChainName,
    hasOnChainSymbol,
  };
  if (name !== undefined) metadata.name = name;
  if (symbol !== undefined) metadata.symbol = symbol;
  if (uri !== undefined) metadata.uri = uri;

  return { metadata, warnings };
}

function readTokenMetadataExtension(asset: HeliusAsset) {
  // Helius DAS emits the on-chain TokenMetadata extension under the key
  // `metadata` (see normalizeExtensions' SNAKE_TO_CAMEL). Older/raw shapes use
  // `token_metadata`. Read both so on-chain name/symbol are detected regardless
  // of which key the upstream provider used — the previous `token_metadata`-only
  // read missed every real mint and forced hasOnChainName/Symbol to false.
  const ext = asset.mint_extensions?.["metadata"] ?? asset.mint_extensions?.["token_metadata"];
  if (!ext || typeof ext !== "object") return undefined;
  const obj = ext as Record<string, unknown>;
  // Treat empty strings as absent so a blank on-chain field still falls back to
  // off-chain metadata, and hasOnChain* stays false when the field is empty.
  const str = (v: unknown) => (typeof v === "string" && v.length > 0 ? v : undefined);
  return {
    name: str(obj.name),
    symbol: str(obj.symbol),
    uri: str(obj.uri),
  };
}

function computeQuality(
  name: string | undefined,
  symbol: string | undefined,
  uri: string | undefined,
): MetadataQuality {
  const present = [name, symbol, uri].filter(Boolean).length;
  if (present === 3) return "complete";
  if (present === 0) return "missing";
  return "partial";
}
