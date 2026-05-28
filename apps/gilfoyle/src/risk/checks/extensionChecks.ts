import type { MintProfile, RiskFinding } from "@tarani/shared";
import type { RiskCheck } from "../types";

function hasExt(profile: MintProfile, kind: string): boolean {
  return profile.extensions.some((e) => e.kind === kind);
}

function checkNonTransferableWithHook(profile: MintProfile): RiskFinding | null {
  if (!hasExt(profile, "nonTransferable") || !hasExt(profile, "transferHook")) return null;
  return {
    id: "incompatible-non-transferable-hook",
    category: "extension",
    severity: "critical",
    title: "NonTransferable and TransferHook are incompatible",
    description:
      "NonTransferable prevents any token movement. TransferHook is only invoked during transfers. " +
      "This combination is logically invalid and will cause transaction failures. " +
      "Remove one extension before deploying — this choice is irreversible after mint creation.",
  };
}

function checkNonTransferableWithFee(profile: MintProfile): RiskFinding | null {
  if (!hasExt(profile, "nonTransferable") || !hasExt(profile, "transferFeeConfig")) return null;
  return {
    id: "incompatible-non-transferable-fee",
    category: "extension",
    severity: "critical",
    title: "NonTransferable and TransferFeeConfig are incompatible",
    description:
      "Transfer fees require tokens to move. NonTransferable makes all transfers impossible, " +
      "rendering the fee configuration unreachable. This combination will cause transaction failures.",
  };
}

function checkConfidentialTransferWithHook(profile: MintProfile): RiskFinding | null {
  if (!hasExt(profile, "confidentialTransferMint") || !hasExt(profile, "transferHook")) return null;
  return {
    id: "incompatible-confidential-hook",
    category: "extension",
    severity: "critical",
    title: "ConfidentialTransfer and TransferHook are incompatible",
    description:
      "Transfer hooks cannot read encrypted balances. The hook program cannot verify the transfer amount, " +
      "making the combination undefined behavior. Do not deploy both extensions on the same mint.",
  };
}

function checkConfidentialTransferWithFee(profile: MintProfile): RiskFinding | null {
  if (!hasExt(profile, "confidentialTransferMint") || !hasExt(profile, "transferFeeConfig"))
    return null;
  return {
    id: "incompatible-confidential-fee",
    category: "extension",
    severity: "critical",
    title: "ConfidentialTransfer and TransferFeeConfig are incompatible",
    description:
      "Fee calculation requires reading the transfer amount, which is encrypted under ConfidentialTransfer. " +
      "The fee cannot be computed, making this combination non-functional.",
  };
}

function checkConfidentialTransferWithDelegate(profile: MintProfile): RiskFinding | null {
  if (!hasExt(profile, "confidentialTransferMint") || !hasExt(profile, "permanentDelegate"))
    return null;
  return {
    id: "incompatible-confidential-delegate",
    category: "extension",
    severity: "high",
    title: "ConfidentialTransfer and PermanentDelegate is a high-risk combination",
    description:
      "A permanent delegate can move tokens whose amounts are hidden from the delegate themselves. " +
      "This creates an asymmetric trust problem — the delegate acts on balances they cannot verify.",
  };
}

function checkTransferFeePresence(profile: MintProfile): RiskFinding | null {
  if (!hasExt(profile, "transferFeeConfig")) return null;
  return {
    id: "transfer-fee-presence",
    category: "extension",
    severity: "medium",
    title: "Transfer fee reduces trade efficiency",
    description:
      "The transfer fee extension withholds a percentage of each transfer. DEX aggregators may route " +
      "around this token or present users with unexpected slippage. Ensure the fee rate is visible " +
      "in your token metadata and documentation.",
  };
}

export const extensionChecks: RiskCheck[] = [
  checkNonTransferableWithHook,
  checkNonTransferableWithFee,
  checkConfidentialTransferWithHook,
  checkConfidentialTransferWithFee,
  checkConfidentialTransferWithDelegate,
  checkTransferFeePresence,
];
