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

export const authorityChecks: RiskCheck[] = [
  checkMintAuthorityLive,
  checkFreezeAuthorityActive,
  checkPermanentDelegatePresentAndActive,
];
