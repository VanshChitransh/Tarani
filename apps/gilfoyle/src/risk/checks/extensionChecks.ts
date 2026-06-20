import type { MintProfile, RiskFinding } from "@tarani/shared";
import { readTransferFeeConfig } from "../../parser";
import type { RiskCheck } from "../types";

function hasExt(profile: MintProfile, kind: string): boolean {
  return profile.extensions.some((e) => e.kind === kind);
}

// The transfer-hook extension slot can exist with NO hook program wired in
// (programId null) — e.g. xStocks mints. An unconfigured hook is a no-op, so
// hook-specific risk findings should only fire when a real program is set.
function hookProgramId(profile: MintProfile): string | null {
  const ext = profile.extensions.find((e) => e.kind === "transferHook");
  if (!ext) return null;
  const pid = ext.parameters["program_id"] ?? ext.parameters["programId"];
  return typeof pid === "string" && pid.length > 0 ? pid : null;
}

function hasConfiguredHook(profile: MintProfile): boolean {
  return hookProgramId(profile) !== null;
}

// Ground truth for which extension combinations the Token-2022 program actually
// rejects at mint initialization lives in
// ExtensionType::check_for_invalid_mint_extension_combinations
// (github.com/solana-program/token-2022 interface/src/extension/mod.rs).
// The ONLY unconditional mutual exclusion there is ScaledUiAmount + InterestBearing.
// Everything else commonly described as "incompatible" actually coexists on-chain —
// the extensions are either inert, or first-class supported — so those are downgraded
// from the previous (false-positive) CRITICAL flags to accurate severities.

// --- The one TRUE incompatibility enforced by the program ---

function checkScaledUiWithInterestBearing(profile: MintProfile): RiskFinding | null {
  if (!hasExt(profile, "scaledUiAmountConfig") || !hasExt(profile, "interestBearingConfig"))
    return null;
  return {
    id: "incompatible-scaled-ui-interest-bearing",
    category: "extension",
    severity: "critical",
    title: "ScaledUiAmount and InterestBearing cannot coexist",
    description:
      "These two extensions are mutually exclusive — the Token-2022 program rejects any mint that carries both " +
      "with TokenError::InvalidExtensionCombination at initialization. Both rescale displayed amounts, so only one " +
      "may be used. A mint with both can never be created; remove one before deploying.",
  };
}

// Confidential transfers + transfer fees are SUPPORTED together, but the program
// requires the co-requisite ConfidentialTransferFeeConfig extension. Omitting it is a
// real init failure; including it is fully functional (fees withheld as ElGamal ciphertext).
function checkConfidentialFeeRequiresFeeConfig(profile: MintProfile): RiskFinding | null {
  if (!hasExt(profile, "confidentialTransferMint") || !hasExt(profile, "transferFeeConfig"))
    return null;
  if (hasExt(profile, "confidentialTransferFeeConfig")) return null; // correctly configured — no risk
  return {
    id: "confidential-fee-missing-fee-config",
    category: "extension",
    severity: "critical",
    title: "ConfidentialTransfer + TransferFee requires ConfidentialTransferFeeConfig",
    description:
      "A mint that enables both ConfidentialTransfer and TransferFee must also include the " +
      "ConfidentialTransferFeeConfig extension, or mint initialization fails with " +
      "TokenError::InvalidExtensionCombination. Add ConfidentialTransferFeeConfig — fees on confidential " +
      "transfers are then computed and withheld as encrypted (ElGamal) amounts and work correctly.",
  };
}

// --- Combinations that are NOT incompatible (coexist on-chain) ---
// Previously flagged CRITICAL "incompatible / transaction failures" — that was wrong.

function checkNonTransferableWithHook(profile: MintProfile): RiskFinding | null {
  // Only meaningful when a real hook program is wired in; an unconfigured hook is
  // covered by checkTransferHookUnconfigured instead.
  if (!hasExt(profile, "nonTransferable") || !hasConfiguredHook(profile)) return null;
  return {
    id: "non-transferable-hook-inert",
    category: "extension",
    severity: "low",
    title: "TransferHook is inert on a NonTransferable mint",
    description:
      "NonTransferable and TransferHook coexist fine (the program does not reject this pair at init), but the hook " +
      "can never run: every transfer on a non-transferable mint is rejected before the hook is invoked. The hook is " +
      "dead weight, and every token account still pays for a forced TransferHookAccount. If the token is meant to be " +
      "soulbound, drop the TransferHook; if the hook logic is required, NonTransferable is the wrong primitive.",
  };
}

function checkNonTransferableWithFee(profile: MintProfile): RiskFinding | null {
  if (!hasExt(profile, "nonTransferable") || !hasExt(profile, "transferFeeConfig")) return null;
  return {
    id: "non-transferable-fee-inert",
    category: "extension",
    severity: "low",
    title: "TransferFeeConfig is redundant on a NonTransferable mint",
    description:
      "These extensions are not incompatible and the mint initializes fine, but the transfer fee can never be " +
      "collected: a non-transferable mint blocks every transfer, so the fee path never runs and the withheld amount " +
      "stays zero forever. Harmless but pointless — drop TransferFeeConfig for a soulbound token, or use a different " +
      "primitive if you actually need a fee.",
  };
}

function checkConfidentialTransferWithHook(profile: MintProfile): RiskFinding | null {
  // Only meaningful when a real hook program is wired in (an unconfigured hook is never invoked).
  if (!hasExt(profile, "confidentialTransferMint") || !hasConfiguredHook(profile)) return null;
  return {
    id: "confidential-hook-amount-blind",
    category: "extension",
    severity: "info",
    title: "Transfer hook is amount-blind on confidential transfers",
    description:
      "ConfidentialTransfer and TransferHook are a supported, well-defined combination — not undefined behavior. " +
      "The program still invokes the hook on confidential transfers, but passes amount = u64::MAX because the real " +
      "amount is encrypted. Gating hooks (allowlist / KYC / freeze) keep working; any hook that enforces per-transfer " +
      "limits or amount-based accounting is blinded on confidential transfers and could be silently bypassed.",
  };
}

function checkConfidentialTransferWithDelegate(profile: MintProfile): RiskFinding | null {
  if (!hasExt(profile, "confidentialTransferMint") || !hasExt(profile, "permanentDelegate"))
    return null;
  return {
    id: "confidential-delegate-public-only",
    category: "extension",
    severity: "low",
    title: "PermanentDelegate reaches only the public balance, not confidential balances",
    description:
      "ConfidentialTransfer and PermanentDelegate coexist fine. Contrary to a common misconception, the permanent " +
      "delegate cannot touch confidential (encrypted) balances — moving those requires the holder's ElGamal keys, " +
      "which the delegate never has. The delegate can only seize or burn the PUBLIC balance (funds before deposit " +
      "into, or after withdrawal from, the confidential balance). Disclose this bounded clawback power to holders.",
  };
}

function checkTransferHookUnconfigured(profile: MintProfile): RiskFinding | null {
  if (!hasExt(profile, "transferHook")) return null;
  if (hasConfiguredHook(profile)) return null; // a real program is set — handled elsewhere
  return {
    id: "transfer-hook-unconfigured",
    category: "extension",
    severity: "info",
    title: "TransferHook extension present but no hook program is set",
    description:
      "This mint enables the TransferHook extension, but its programId is null — so no custom transfer logic " +
      "runs and the hook is currently a no-op. Venue restrictions that exist because of transfer hooks may not " +
      "actually bite while it stays unconfigured. If you intend custom transfer behavior, set the hook program; " +
      "otherwise the extension adds per-account overhead for nothing.",
  };
}

// Reads the CURRENT (newer) transfer fee rate in basis points from the parsed
// extension via the shared reader (single source of truth, also used by the
// kotler simulator). Returns undefined when the rate cannot be determined so
// callers can stay conservative.
function activeTransferFeeBps(profile: MintProfile): number | undefined {
  const ext = profile.extensions.find((e) => e.kind === "transferFeeConfig");
  return readTransferFeeConfig(ext).basisPoints;
}

// A transfer-fee extension only hurts trade efficiency when a fee is ACTUALLY
// charged. Many regulated stablecoins (PYUSD, USDG, AUSD, USYC…) carry the
// extension with a 0 bps rate — no fee is withheld, so the old unconditional
// "reduces trade efficiency" MEDIUM was a false positive. Fire MEDIUM only when
// the active rate is non-zero (or unknown); when it is provably 0, emit an INFO
// note about the dormant fee authority instead.
function checkTransferFeePresence(profile: MintProfile): RiskFinding | null {
  if (!hasExt(profile, "transferFeeConfig")) return null;
  const bps = activeTransferFeeBps(profile);

  if (bps === 0) {
    return {
      id: "transfer-fee-inactive",
      category: "extension",
      severity: "info",
      title: "Transfer-fee extension present but currently 0%",
      description:
        "This mint carries the TransferFeeConfig extension, but the current transfer fee is 0 basis points, so no " +
        "amount is withheld on transfers today and trade efficiency is unaffected. However, the fee-config authority " +
        "can raise the rate at any time (up to the configured maximum). Disclose the fee authority and that a fee " +
        "could be enabled, so integrators and holders are not surprised by a future change.",
    };
  }

  const rate =
    bps !== undefined ? `a ${(bps / 100).toString()}% (${bps} bps) transfer fee` : "a transfer fee";
  return {
    id: "transfer-fee-presence",
    category: "extension",
    severity: "medium",
    title: "Transfer fee reduces trade efficiency",
    description:
      `The transfer fee extension withholds ${rate} on every transfer. DEX aggregators may route ` +
      "around this token or present users with unexpected slippage. Ensure the fee rate is visible " +
      "in your token metadata and documentation.",
  };
}

export const extensionChecks: RiskCheck[] = [
  // Real, program-enforced incompatibilities
  checkScaledUiWithInterestBearing,
  checkConfidentialFeeRequiresFeeConfig,
  // Coexisting combinations (informational / low — corrected from prior false-positive CRITICALs)
  checkNonTransferableWithHook,
  checkNonTransferableWithFee,
  checkConfidentialTransferWithHook,
  checkConfidentialTransferWithDelegate,
  // Standalone extension notes
  checkTransferHookUnconfigured,
  checkTransferFeePresence,
];
