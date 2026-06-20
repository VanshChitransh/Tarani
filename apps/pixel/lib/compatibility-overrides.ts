import type { CompatibilityStatus, ConfidenceLevel, VenueId } from "@tarani/shared";

export interface CompatibilityOverride {
  venue: VenueId;
  featureId: string;
  status: CompatibilityStatus;
  source: "override";
  confidence: ConfidenceLevel;
  reason: string;
  caveat?: string;
}

// Keyed by `${venue}.${featureId}` — looked up at render time to supplement
// heuristic-source results with human-authored caveats and remediation text.
// Day 2: scaffold only. Day 6 probe evidence will populate this with verified entries.
export const COMPATIBILITY_OVERRIDES: Record<string, CompatibilityOverride> = {};

export function getOverride(venue: VenueId, featureId: string): CompatibilityOverride | undefined {
  return COMPATIBILITY_OVERRIDES[`${venue}.${featureId}`];
}
