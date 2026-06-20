import type { MintProfile, VenueCompatibilityResult, RiskFinding } from "@tarani/shared";

export type RiskCheck = (
  profile: MintProfile,
  compatibility: VenueCompatibilityResult[],
) => RiskFinding | null;
