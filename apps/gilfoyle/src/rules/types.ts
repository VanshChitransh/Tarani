import type { CompatibilityStatus, ConfidenceLevel, VenueId } from "@tarani/shared";

export interface VenueRuleFeature {
  id: string;
  scope?: string;
  status: CompatibilityStatus;
  confidence?: ConfidenceLevel;
  evidence?: string[];
  notes?: string[];
}

export interface VenueRule {
  venue: VenueId;
  version: string;
  last_updated: string;
  features: VenueRuleFeature[];
  notes: string[];
}
