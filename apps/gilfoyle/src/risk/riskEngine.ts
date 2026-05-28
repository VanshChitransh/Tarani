import type { MintProfile, VenueCompatibilityResult, RiskFinding } from "@tarani/shared";
import type { RiskCheck } from "./types";
import { authorityChecks } from "./checks/authorityChecks";
import { extensionChecks } from "./checks/extensionChecks";
import { compatibilityChecks } from "./checks/compatibilityChecks";
import { metadataChecks } from "./checks/metadataChecks";

const SEVERITY_ORDER: Record<RiskFinding["severity"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const CATEGORY_ORDER: Record<RiskFinding["category"], number> = {
  authority: 0,
  extension: 1,
  compatibility: 2,
  metadata: 3,
  supply: 4,
  ownership: 5,
  liquidity: 6,
};

function deduplicateById(findings: RiskFinding[]): RiskFinding[] {
  const seen = new Map<string, RiskFinding>();
  for (const f of findings) {
    seen.set(f.id, f);
  }
  return [...seen.values()];
}

export function scoreRisk(
  profile: MintProfile,
  compatibility: VenueCompatibilityResult[],
): RiskFinding[] {
  const allChecks: RiskCheck[] = [
    ...authorityChecks,
    ...extensionChecks,
    ...compatibilityChecks,
    ...metadataChecks,
  ];

  const findings = allChecks
    .map((check) => check(profile, compatibility))
    .filter((f): f is RiskFinding => f !== null);

  const deduplicated = deduplicateById(findings);

  deduplicated.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category],
  );

  return deduplicated;
}
