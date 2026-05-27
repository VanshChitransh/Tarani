import type { AuthorityProfile, AuthorityRecord, ParserWarning } from "@tarani/shared";
import type { HeliusAsset } from "../helius/types";

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export interface NormalizeAuthoritiesOutput {
  authorities: AuthorityProfile;
  warnings: ParserWarning[];
}

export function normalizeAuthorities(asset: HeliusAsset): NormalizeAuthoritiesOutput {
  const warnings: ParserWarning[] = [];

  const mintAddress = takeAddress(
    asset.token_info?.mint_authority,
    warnings,
    "token_info.mint_authority",
  );
  const freezeAddress = takeAddress(
    asset.token_info?.freeze_authority,
    warnings,
    "token_info.freeze_authority",
  );

  const updateAddress = extractFromAuthorityList(asset, "full");
  const metadataAddress =
    readExtensionAuthority(asset, "token_metadata") ??
    readExtensionAuthority(asset, "metadata_pointer") ??
    extractFromAuthorityList(asset, "metadata");

  const authorities: AuthorityProfile = {
    mint: toRecord("mint", mintAddress),
    freeze: toRecord("freeze", freezeAddress),
    update: toRecord("update", updateAddress),
  };
  if (metadataAddress !== undefined) {
    authorities.metadata = toRecord("metadata", metadataAddress);
  }

  return { authorities, warnings };
}

function toRecord(kind: AuthorityRecord["kind"], address: string | null): AuthorityRecord {
  return { kind, address, isRenounced: address === null };
}

function takeAddress(
  value: string | undefined,
  warnings: ParserWarning[],
  path: string,
): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (!BASE58_RE.test(value)) {
    warnings.push({
      code: "INVALID_AUTHORITY_FORMAT",
      message: `Authority address failed base58 shape check`,
      path,
    });
    return null;
  }
  return value;
}

function extractFromAuthorityList(asset: HeliusAsset, scope: string): string | null {
  const entries = asset.authorities ?? [];
  const match = entries.find((entry) => entry.scopes?.includes(scope));
  if (!match) return null;
  return BASE58_RE.test(match.address) ? match.address : null;
}

function readExtensionAuthority(asset: HeliusAsset, rawKind: string): string | null | undefined {
  const ext = asset.mint_extensions?.[rawKind];
  if (!ext || typeof ext !== "object") return undefined;
  const authority = (ext as { authority?: unknown }).authority;
  if (typeof authority !== "string") return undefined;
  return BASE58_RE.test(authority) ? authority : null;
}
