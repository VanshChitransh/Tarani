import type { MintProfile, VenueCompatibilityResult, RiskFinding } from "@tarani/shared";
import type { RiskCheck } from "../types";

const DEX_VENUES = ["jupiter", "raydium", "orca"] as const;

function checkBlockedOnAllDexes(
  _profile: MintProfile,
  compatibility: VenueCompatibilityResult[],
): RiskFinding | null {
  const dexResults = compatibility.filter((r) =>
    (DEX_VENUES as readonly string[]).includes(r.venue),
  );
  if (dexResults.length === 0) return null;
  if (!dexResults.every((r) => r.status === "blocked")) return null;
  return {
    id: "blocked-on-all-dexes",
    category: "compatibility",
    severity: "critical",
    title: "Token is blocked on all major DEXes",
    description:
      "Jupiter, Raydium, and Orca have all blocked this token's extension configuration. " +
      "The token cannot be traded on any major decentralized exchange. Review your extension " +
      "combination — this is likely caused by an unsupported or incompatible extension pair.",
    affectedVenues: dexResults.map((r) => r.venue),
  };
}

function checkBlockedOnMajorDex(
  _profile: MintProfile,
  compatibility: VenueCompatibilityResult[],
): RiskFinding | null {
  const dexResults = compatibility.filter((r) =>
    (DEX_VENUES as readonly string[]).includes(r.venue),
  );
  const blockedDexes = dexResults.filter((r) => r.status === "blocked");
  if (blockedDexes.length === 0) return null;
  // Don't double-fire with blocked-on-all-dexes
  if (blockedDexes.length === dexResults.length) return null;
  return {
    id: "blocked-on-major-dex",
    category: "compatibility",
    severity: "high",
    title: `Token is blocked on ${blockedDexes.length} major DEX${blockedDexes.length > 1 ? "es" : ""}`,
    description:
      `${blockedDexes.map((r) => r.venue).join(" and ")} ${blockedDexes.length > 1 ? "have" : "has"} blocked this token's extension configuration from their standard pool paths. ` +
      "Significant market access is reduced. Consider whether the blocking extension is required for your use case.",
    affectedVenues: blockedDexes.map((r) => r.venue),
  };
}

function checkConditionalVenues(
  _profile: MintProfile,
  compatibility: VenueCompatibilityResult[],
): RiskFinding | null {
  const conditional = compatibility.filter((r) => r.status === "conditional");
  if (conditional.length === 0) return null;
  return {
    id: "conditional-orca",
    category: "compatibility",
    severity: "medium",
    title: `${conditional.length} venue${conditional.length > 1 ? "s require" : " requires"} extra steps`,
    description:
      `${conditional.map((r) => r.venue).join(", ")} will only support this token after additional setup steps, ` +
      "such as applying for a TokenBadge or using a permissioned pool. " +
      "Complete these steps before directing users to these venues.",
    affectedVenues: conditional.map((r) => r.venue),
  };
}

function checkAllVenuesUnknown(
  _profile: MintProfile,
  compatibility: VenueCompatibilityResult[],
): RiskFinding | null {
  if (compatibility.length === 0) return null;
  if (!compatibility.every((r) => r.status === "unknown")) return null;
  return {
    id: "all-venues-unknown",
    category: "compatibility",
    severity: "info",
    title: "No compatibility data available",
    description:
      "None of the venues returned a definitive compatibility result for this token's extension configuration. " +
      "This is common for tokens with unusual or very new extensions. Manual verification is recommended.",
  };
}

export const compatibilityChecks: RiskCheck[] = [
  checkBlockedOnAllDexes,
  checkBlockedOnMajorDex,
  checkConditionalVenues,
  checkAllVenuesUnknown,
];
