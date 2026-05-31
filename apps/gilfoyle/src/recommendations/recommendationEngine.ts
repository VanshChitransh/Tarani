import type {
  RiskFinding,
  VenueCompatibilityResult,
  Recommendation,
  VenueId,
} from "@tarani/shared";
import { REMEDIATIONS } from "./remediations";
import { VENUE_CONDITIONAL_GUIDANCE } from "../risk/venueGuidance";

const CONDITIONAL_VENUES_RISK_ID = "conditional-venues";

/**
 * Builds a recommendation for the `conditional-venues` finding that is tailored
 * to the venues that are ACTUALLY conditional for this mint. Each affected venue
 * contributes its own action and its own documentation link — so a token that is
 * conditional only on wallets never receives "apply for an Orca TokenBadge", and
 * a token conditional on Orca never receives wallet-warning advice. This replaces
 * the old static, Orca-only `conditional-orca` recommendation.
 */
function buildConditionalVenuesRecommendation(risk: RiskFinding): Recommendation | null {
  const venues = (risk.affectedVenues ?? []).filter(
    (v): v is VenueId => v in VENUE_CONDITIONAL_GUIDANCE,
  );
  if (venues.length === 0) return null;

  const lines = venues.map((v) => {
    const g = VENUE_CONDITIONAL_GUIDANCE[v];
    return `${g.label}: ${g.action}`;
  });
  // Dedupe links while preserving venue order.
  const links = [...new Set(venues.map((v) => VENUE_CONDITIONAL_GUIDANCE[v].link))];

  return {
    id: `rec-${CONDITIONAL_VENUES_RISK_ID}`,
    riskIds: [risk.id],
    title: "Resolve each conditional venue's requirement",
    description:
      "These venues do not fully support the token as-is. Complete the step specific to each one: " +
      lines.join(" "),
    links,
  };
}

export function generateRecommendations(
  risks: RiskFinding[],
  _compatibility: VenueCompatibilityResult[],
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const risk of risks) {
    // Venue-aware recommendation built from the finding's affectedVenues rather
    // than a single static template, so guidance matches the real venues.
    if (risk.id === CONDITIONAL_VENUES_RISK_ID) {
      const rec = buildConditionalVenuesRecommendation(risk);
      if (rec) recommendations.push(rec);
      continue;
    }

    const template = REMEDIATIONS[risk.id];
    if (!template) continue;

    recommendations.push({
      id: `rec-${risk.id}`,
      riskIds: [risk.id],
      title: template.title,
      description: template.description,
      links: template.links,
    });
  }

  return recommendations;
}
