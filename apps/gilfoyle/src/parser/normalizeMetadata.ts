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
  const ext = asset.mint_extensions?.["token_metadata"];
  if (!ext || typeof ext !== "object") return undefined;
  const obj = ext as Record<string, unknown>;
  return {
    name: typeof obj.name === "string" ? obj.name : undefined,
    symbol: typeof obj.symbol === "string" ? obj.symbol : undefined,
    uri: typeof obj.uri === "string" ? obj.uri : undefined,
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
