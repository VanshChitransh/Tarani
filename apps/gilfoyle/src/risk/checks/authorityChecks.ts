import type { MintProfile, RiskFinding } from "@tarani/shared";
import type { RiskCheck } from "../types";

function checkMintAuthorityLive(profile: MintProfile): RiskFinding | null {
  if (profile.authorities.mint.isRenounced) return null;
  return {
    id: "mint-authority-live",
    category: "authority",
    severity: "high",
    title: "Mint authority is live",
    description:
      "The mint authority has not been renounced. The issuer can inflate the token supply at any time. " +
      "This is a significant trust risk for holders and may affect exchange listing eligibility.",
  };
}

function checkFreezeAuthorityActive(profile: MintProfile): RiskFinding | null {
  if (profile.authorities.freeze.isRenounced) return null;
  return {
    id: "freeze-authority-active",
    category: "authority",
    severity: "medium",
    title: "Freeze authority is active",
    description:
      "The freeze authority has not been renounced. The issuer can freeze any token account at any time, " +
      "preventing holders from transferring or selling their tokens.",
  };
}

function checkPermanentDelegatePresentAndActive(profile: MintProfile): RiskFinding | null {
  const ext = profile.extensions.find((e) => e.kind === "permanentDelegate");
  if (!ext) return null;
  const delegate = ext.parameters["delegate"];
  if (!delegate || typeof delegate !== "string") return null;
  return {
    id: "permanent-delegate-present",
    category: "authority",
    severity: "high",
    title: "Permanent delegate is set",
    description:
      "A permanent delegate can transfer or burn tokens from any account without the owner's signature. " +
      "This is one of the highest-risk extensions for token holders and may block listings on major venues.",
  };
}

function checkUpdateAuthorityLive(profile: MintProfile): RiskFinding | null {
  if (profile.authorities.update.isRenounced) return null;
  return {
    id: "update-authority-live",
    category: "authority",
    severity: "medium",
    title: "Update authority is live",
    description:
      "The update authority has not been renounced. Whoever holds it can rewrite the token's metadata — " +
      "name, symbol, and image — at any time. This enables post-launch impersonation or a silent rebrand. " +
      "Renounce it once metadata is final, or hold it in a multisig.",
  };
}

function checkMetadataAuthorityLive(profile: MintProfile): RiskFinding | null {
  const metadata = profile.authorities.metadata;
  // Optional authority: absent means there is nothing to renounce, not a risk.
  if (!metadata || metadata.isRenounced) return null;
  return {
    id: "metadata-authority-live",
    category: "authority",
    severity: "medium",
    title: "Metadata authority is live",
    description:
      "The Token-2022 metadata authority can change the on-chain name, symbol, and URI. Until it is " +
      "renounced, the token's identity is mutable and could be altered to impersonate another asset. " +
      "Renounce it to make metadata immutable, or assign it to a multisig.",
  };
}

export const authorityChecks: RiskCheck[] = [
  checkMintAuthorityLive,
  checkFreezeAuthorityActive,
  checkPermanentDelegatePresentAndActive,
  checkUpdateAuthorityLive,
  checkMetadataAuthorityLive,
];
