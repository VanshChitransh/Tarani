import { describe, expect, it } from "vitest";
import { REMEDIATIONS } from "./remediations";
import { generateRecommendations } from "./recommendationEngine";
import recommendationsFile from "../../rules/recommendations.json";
import type { RiskFinding } from "@tarani/shared";

describe("REMEDIATIONS loaded from recommendations.json", () => {
  it("loads every rule from the JSON file", () => {
    expect(Object.keys(REMEDIATIONS)).toHaveLength(recommendationsFile.rules.length);
  });

  it("is keyed by rule id with content matching the JSON", () => {
    for (const rule of recommendationsFile.rules) {
      const loaded = REMEDIATIONS[rule.id];
      expect(loaded).toBeDefined();
      expect(loaded.title).toBe(rule.title);
      expect(loaded.description).toBe(rule.description);
    }
  });

  it("has no duplicate ids in the source file", () => {
    const ids = recommendationsFile.rules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("drives engine output: a recommendation reflects the JSON copy", () => {
    const source = recommendationsFile.rules[0];
    const risks: RiskFinding[] = [
      {
        id: source.id,
        category: "authority",
        severity: "high",
        title: "x",
        description: "y",
      },
    ];
    const recs = generateRecommendations(risks, []);
    expect(recs[0].title).toBe(source.title);
    expect(recs[0].description).toBe(source.description);
  });
});
