import type { MintProfile, ParserWarning } from "@tarani/shared";
import type { HeliusAsset } from "../helius/types";
import { normalizeAuthorities } from "./normalizeAuthorities";
import { normalizeExtensions } from "./normalizeExtensions";
import { normalizeMetadata } from "./normalizeMetadata";

const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const TOKEN_LEGACY_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

export function parseMintProfile(asset: HeliusAsset): MintProfile {
  const warnings: ParserWarning[] = [];

  const programId = readProgramId(asset, warnings);
  const supply = readSupply(asset, warnings);
  const decimals = asset.token_info?.decimals ?? 0;

  const ext = normalizeExtensions(asset.mint_extensions);
  warnings.push(...ext.warnings);

  const auth = normalizeAuthorities(asset);
  warnings.push(...auth.warnings);

  const meta = normalizeMetadata(asset);
  warnings.push(...meta.warnings);

  return {
    mint: asset.id,
    programId,
    supply,
    decimals,
    extensions: ext.extensions,
    authorities: auth.authorities,
    metadata: meta.metadata,
    warnings,
    fetchedAt: new Date().toISOString(),
  };
}

function readProgramId(asset: HeliusAsset, warnings: ParserWarning[]): string {
  const raw = asset.token_info?.token_program;
  if (raw === TOKEN_2022_PROGRAM_ID || raw === TOKEN_LEGACY_PROGRAM_ID) {
    return raw;
  }
  if (typeof raw === "string" && raw.length > 0) {
    warnings.push({
      code: "UNRECOGNIZED_PROGRAM_ID",
      message: `Token program ID is not Token or Token-2022: ${raw}`,
      path: "token_info.token_program",
    });
    return raw;
  }
  warnings.push({
    code: "UNRECOGNIZED_PROGRAM_ID",
    message: "Token program ID missing; defaulting to Token-2022",
    path: "token_info.token_program",
  });
  return TOKEN_2022_PROGRAM_ID;
}

function readSupply(asset: HeliusAsset, warnings: ParserWarning[]): string {
  const raw = asset.token_info?.supply;
  if (typeof raw === "string" && /^\d+$/.test(raw)) return raw;
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
    return Math.trunc(raw).toString();
  }
  warnings.push({
    code: "MISSING_SUPPLY",
    message: "Supply missing or invalid; defaulting to '0'",
    path: "token_info.supply",
  });
  return "0";
}
