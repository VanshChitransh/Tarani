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

  it("builds a venue-aware recommendation for conditional-venues (DEX affected → Orca link + per-venue text)", () => {
    const risks: RiskFinding[] = [
      {
        id: "conditional-venues",
        category: "compatibility",
        severity: "medium",
        title: "x",
        description: "y",
        affectedVenues: ["orca", "phantom"],
      },
    ];
    const recs = generateRecommendations(risks, []);
    expect(recs).toHaveLength(1);
    expect(recs[0].riskIds).toEqual(["conditional-venues"]);
    expect(recs[0].links).toContain(
      "https://dev.orca.so/Architecture%20Overview/TokenExtensions%20Support/",
    );
    expect(recs[0].description).toMatch(/Orca/);
    expect(recs[0].description).toMatch(/Phantom/);
  });

  it("conditional-venues for WALLET-ONLY conditionals omits the Orca TokenBadge link/text", () => {
    const risks: RiskFinding[] = [
      {
        id: "conditional-venues",
        category: "compatibility",
        severity: "low",
        title: "x",
        description: "y",
        affectedVenues: ["phantom", "solflare"],
      },
    ];
    const recs = generateRecommendations(risks, []);
    expect(recs).toHaveLength(1);
    expect(recs[0].links).not.toContain(
      "https://dev.orca.so/Architecture%20Overview/TokenExtensions%20Support/",
    );
    expect(recs[0].description).not.toMatch(/TokenBadge/);
    expect(recs[0].description).toMatch(/Phantom/);
    expect(recs[0].description).toMatch(/Solflare/);
  });
});
