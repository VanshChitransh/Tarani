import type { MintProfile, VenueCompatibilityResult, RiskFinding } from "@tarani/shared";
import type { RiskCheck } from "../types";
import { DEX_VENUES, isDexVenue, isWalletVenue } from "../venueGuidance";

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

// A venue verdict of `conditional` means different things at different venues:
// a DEX (Orca/Raydium/Jupiter) needs a TokenBadge / allowlisted pool / order-type
// caveat, whereas a wallet (Phantom/Solflare) merely shows a warning before an
// otherwise-successful send. The previous check lumped all of them under one
// Orca-specific "apply for a TokenBadge" message — wrong for wallet conditionals
// and even for tokens where Orca is fully supported. This builds an accurate,
// venue-aware finding from each conditional venue's own guidance; the matching
// recommendation (see recommendationEngine) is likewise built per-venue.
function checkConditionalVenues(
  _profile: MintProfile,
  compatibility: VenueCompatibilityResult[],
): RiskFinding | null {
  const conditional = compatibility.filter((r) => r.status === "conditional");
  if (conditional.length === 0) return null;

  const venues = conditional.map((r) => r.venue);
  const dexVenues = venues.filter((v) => isDexVenue(v));
  const walletVenues = venues.filter((v) => isWalletVenue(v));
  const otherVenues = venues.filter((v) => !isDexVenue(v) && !isWalletVenue(v));

  const clauses: string[] = [];
  if (dexVenues.length > 0) {
    clauses.push(
      `${dexVenues.join(", ")} require venue-specific listing steps before this token trades there ` +
        "(e.g. an Orca TokenBadge, a Raydium-allowlisted CPMM/CLMM pool, or Jupiter order-type limits)",
    );
  }
  if (walletVenues.length > 0) {
    clauses.push(
      `${walletVenues.join(", ")} will display a warning to users (e.g. for a permanent delegate or freeze) ` +
        "but still allow sends — disclose this behavior to holders",
    );
  }
  if (otherVenues.length > 0) {
    clauses.push(`${otherVenues.join(", ")} render the token only partially`);
  }

  // A DEX listing requirement is a real market-access blocker (medium); a
  // wallet-only warning is informational-but-actionable (low).
  const severity: RiskFinding["severity"] = dexVenues.length > 0 ? "medium" : "low";

  return {
    id: "conditional-venues",
    category: "compatibility",
    severity,
    title: `${venues.length} venue${venues.length > 1 ? "s need" : " needs"} extra steps or show a warning`,
    description: `${clauses.join(". ")}. Address each venue's requirement before directing users there.`,
    affectedVenues: venues,
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
