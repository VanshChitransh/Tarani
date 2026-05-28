import { describe, expect, it } from "vitest";
import type { RiskFinding } from "@tarani/shared";
import { generateRecommendations } from "./recommendationEngine";

describe("generateRecommendations", () => {
  it("returns empty array for empty risk list", () => {
    expect(generateRecommendations([], [])).toEqual([]);
  });

  it("returns at least one recommendation for mint-authority-live risk", () => {
    const risks: RiskFinding[] = [
      {
        id: "mint-authority-live",
        category: "authority",
        severity: "high",
        title: "Mint authority is live",
        description: "...",
      },
    ];
    const recs = generateRecommendations(risks, []);
    expect(recs.length).toBeGreaterThan(0);
  });

  it("recommendation riskIds contains the source risk id", () => {
    const risks: RiskFinding[] = [
      {
        id: "mint-authority-live",
        category: "authority",
        severity: "high",
        title: "Mint authority is live",
        description: "...",
      },
    ];
    const recs = generateRecommendations(risks, []);
    expect(recs[0].riskIds).toContain("mint-authority-live");
  });

  it("skips risks with no remediation entry", () => {
    const risks: RiskFinding[] = [
      {
        id: "unknown-future-risk-id",
        category: "authority",
        severity: "info",
        title: "Unknown",
        description: "...",
      },
    ];
    expect(generateRecommendations(risks, [])).toEqual([]);
  });

  it("generates one recommendation per risk that has a remediation", () => {
    const risks: RiskFinding[] = [
      {
        id: "mint-authority-live",
        category: "authority",
        severity: "high",
        title: "Mint authority is live",
        description: "...",
      },
      {
        id: "freeze-authority-active",
        category: "authority",
        severity: "medium",
        title: "Freeze authority active",
        description: "...",
      },
    ];
    const recs = generateRecommendations(risks, []);
    expect(recs).toHaveLength(2);
  });
});
