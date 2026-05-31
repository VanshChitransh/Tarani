import type { DetectedExtension, ExtensionKind, ParserWarning } from "@tarani/shared";
import { EXTENSION_KINDS } from "@tarani/shared";
import type { HeliusMintExtensions } from "../helius/types";

const SNAKE_TO_CAMEL: Record<string, ExtensionKind> = {
  transfer_fee_config: "transferFeeConfig",
  transfer_hook: "transferHook",
  default_account_state: "defaultAccountState",
  permanent_delegate: "permanentDelegate",
  non_transferable: "nonTransferable",
  interest_bearing_config: "interestBearingConfig",
  cpi_guard: "cpiGuard",
  memo_transfer: "memoTransfer",
  confidential_transfer_mint: "confidentialTransferMint",
  confidential_transfer_fee_config: "confidentialTransferFeeConfig",
  metadata_pointer: "metadataPointer",
  token_metadata: "tokenMetadata",
  metadata: "tokenMetadata", // Helius emits the TokenMetadata extension as `metadata`
  group_pointer: "groupPointer",
  token_group: "tokenGroup",
  group_member_pointer: "groupMemberPointer",
  token_group_member: "tokenGroupMember",
  mint_close_authority: "mintCloseAuthority",
  scaled_ui_amount_config: "scaledUiAmountConfig",
  pausable: "pausable",
  pausable_config: "pausable", // Helius emits the Pausable extension as `pausable_config`
};

const KNOWN_KINDS = new Set<string>(EXTENSION_KINDS);

export interface NormalizeExtensionsOutput {
  extensions: DetectedExtension[];
  warnings: ParserWarning[];
}

export function normalizeExtensions(
  mintExtensions: HeliusMintExtensions | undefined,
): NormalizeExtensionsOutput {
  const warnings: ParserWarning[] = [];
  if (!mintExtensions) {
    return { extensions: [], warnings };
  }

  const detected: DetectedExtension[] = [];
  for (const [rawKind, raw] of Object.entries(mintExtensions)) {
    const mapped = SNAKE_TO_CAMEL[rawKind];
    let kind: ExtensionKind;
    if (mapped && KNOWN_KINDS.has(mapped)) {
      kind = mapped;
    } else {
      kind = "unknown";
      warnings.push({
        code: "UNKNOWN_EXTENSION",
        message: `Encountered unknown Token-2022 extension: ${rawKind}`,
        path: `mint_extensions.${rawKind}`,
      });
    }

    const parameters = isPlainObject(raw) ? (raw as Record<string, unknown>) : {};
    detected.push({ kind, rawKind, parameters, raw });
  }

  detected.sort((a, b) => a.rawKind.localeCompare(b.rawKind));
  return { extensions: detected, warnings };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
