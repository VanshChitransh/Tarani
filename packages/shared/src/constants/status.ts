export const COMPATIBILITY_STATUS_VALUES = [
  "supported",
  "partial",
  "blocked",
  "conditional",
  "unknown",
] as const;

export const CONFIDENCE_LEVEL_VALUES = ["high", "medium", "low"] as const;

export const RISK_SEVERITY_VALUES = ["info", "low", "medium", "high", "critical"] as const;

export const METADATA_QUALITY_VALUES = ["complete", "partial", "missing"] as const;

export const SCENARIO_OUTCOME_VALUES = ["success", "blocked", "warning", "error"] as const;

export const API_ERROR_CODE_VALUES = [
  "BAD_REQUEST",
  "NOT_FOUND",
  "UPSTREAM_TIMEOUT",
  "UPSTREAM_ERROR",
  "RATE_LIMITED",
  "INTERNAL",
] as const;
