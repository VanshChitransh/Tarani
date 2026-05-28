export const COMPATIBILITY_SOURCE_VALUES = ["probe", "heuristic", "override"] as const;

export const VENUE_IDS = [
  "jupiter",
  "raydium",
  "orca",
  "phantom",
  "solflare",
  "solscan",
  "solana-explorer",
] as const;

export const COMPATIBILITY_EVIDENCE_KINDS = ["rule", "probe", "doc"] as const;

export const EXTENSION_KINDS = [
  "transferFeeConfig",
  "transferHook",
  "defaultAccountState",
  "permanentDelegate",
  "nonTransferable",
  "interestBearingConfig",
  "cpiGuard",
  "memoTransfer",
  "confidentialTransferMint",
  "confidentialTransferFeeConfig",
  "metadataPointer",
  "tokenMetadata",
  "groupPointer",
  "tokenGroup",
  "groupMemberPointer",
  "tokenGroupMember",
  "mintCloseAuthority",
  "scaledUiAmountConfig",
  "pausable",
  "unknown",
] as const;

export const AUTHORITY_KINDS = ["mint", "freeze", "update", "metadata"] as const;

export const PARSER_WARNING_CODES = [
  "UNKNOWN_EXTENSION",
  "MISSING_METADATA_URI",
  "MISSING_METADATA_NAME",
  "MISSING_METADATA_SYMBOL",
  "INVALID_AUTHORITY_FORMAT",
  "MISSING_SUPPLY",
  "MISSING_DECIMALS",
  "UNRECOGNIZED_PROGRAM_ID",
] as const;

export const RISK_CATEGORIES = [
  "authority",
  "metadata",
  "extension",
  "supply",
  "ownership",
  "liquidity",
] as const;

export const SCENARIO_KINDS = [
  "transfer",
  "swap",
  "wrap_sol",
  "associated_token_create",
  "freeze_check",
] as const;

export const MONITOR_EVENT_KINDS = [
  "authority_change",
  "extension_added",
  "extension_removed",
  "metadata_change",
  "supply_change",
] as const;
