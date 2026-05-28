import type { MintProfile, RiskFinding } from "@tarani/shared";
import type { RiskCheck } from "../types";

function checkMissingMetadata(profile: MintProfile): RiskFinding | null {
  if (profile.metadata.quality !== "missing") return null;
  return {
    id: "metadata-missing",
    category: "metadata",
    severity: "high",
    title: "Token metadata is missing",
    description:
      "No name, symbol, or URI was found for this token. Wallets will display it as 'Unknown Token'. " +
      "Trust and discoverability are severely impacted — most users will not interact with unnamed tokens.",
  };
}

function checkPartialMetadata(profile: MintProfile): RiskFinding | null {
  if (profile.metadata.quality !== "partial") return null;
  return {
    id: "metadata-partial",
    category: "metadata",
    severity: "medium",
    title: "Token metadata is incomplete",
    description:
      "Some metadata fields are present but others are missing. The token may display incorrectly in " +
      "wallets and explorers. Ensure name, symbol, and a valid URI are all set before launch.",
  };
}

function checkNoOnChainName(profile: MintProfile): RiskFinding | null {
  if (profile.metadata.hasOnChainName) return null;
  if (!profile.metadata.name) return null;
  return {
    id: "no-on-chain-name",
    category: "metadata",
    severity: "low",
    title: "Token name is stored off-chain only",
    description:
      "The token name exists in off-chain metadata but is not written on-chain. The metadata authority " +
      "can change or remove it at any time without on-chain governance. Consider using the TokenMetadata " +
      "extension to make the name immutable.",
  };
}

export const metadataChecks: RiskCheck[] = [
  checkMissingMetadata,
  checkPartialMetadata,
  checkNoOnChainName,
];
