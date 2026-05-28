import type { MintProfile, VenueCompatibilityResult, VenueId } from "@tarani/shared";
import type { VenueRule } from "../rules";

export interface AdapterInput {
  profile: MintProfile;
  rule: VenueRule;
}

export interface VenueAdapter {
  readonly venue: VenueId;
  evaluate(input: AdapterInput): VenueCompatibilityResult;
}
