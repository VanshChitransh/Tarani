import type { RiskFinding, VenueCompatibilityResult, Recommendation } from "@tarani/shared";
import { REMEDIATIONS } from "./remediations";

export function generateRecommendations(
  risks: RiskFinding[],
  _compatibility: VenueCompatibilityResult[],
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const risk of risks) {
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
