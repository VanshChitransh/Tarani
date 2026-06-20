import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { realMintFixtures } from "@tarani/test-fixtures";
import type { HeliusAsset } from "./helius";
import {
  parseMintProfile,
  runCompatibilityEngine,
  scoreRisk,
  generateRecommendations,
  __resetOrcaCache,
} from "./index";

/**
 * End-to-end integration across the full analysis pipeline — the path
 * /api/analyze actually runs: Helius asset -> profile -> compatibility ->
 * risk -> recommendations. Network probes are forced offline so every adapter
 * degrades to its heuristic fallback, keeping the test deterministic.
 */
describe("analysis pipeline (fixture -> profile -> compatibility -> risk -> recommendations)", () => {
  beforeEach(() => {
    __resetOrcaCache();
    // Force all venue probes offline -> each adapter falls back to heuristics.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    __resetOrcaCache();
  });

  it("flows a real mint through every stage without throwing", async () => {
    const profile = parseMintProfile(realMintFixtures.usdc as unknown as HeliusAsset);
    const compatibility = await runCompatibilityEngine(profile);
    const risks = scoreRisk(profile, compatibility);
    const recommendations = generateRecommendations(risks, compatibility);

    // Profile parsed.
    expect(profile.mint).toBe(realMintFixtures.usdc.id);

    // Every known venue is represented, each as a well-formed result.
    expect(compatibility.length).toBeGreaterThanOrEqual(5);
    for (const r of compatibility) {
      expect(["supported", "partial", "blocked", "conditional", "unknown"]).toContain(r.status);
      expect(["probe", "heuristic", "override"]).toContain(r.source);
      expect(["high", "medium", "low"]).toContain(r.confidence);
      // Probes are offline, so every verdict here is heuristic-sourced.
      expect(r.source).toBe("heuristic");
    }

    expect(Array.isArray(risks)).toBe(true);
    expect(Array.isArray(recommendations)).toBe(true);
  });

  it("only emits recommendations for risks that have a remediation", async () => {
    const profile = parseMintProfile(realMintFixtures.pyusd as unknown as HeliusAsset);
    const compatibility = await runCompatibilityEngine(profile);
    const risks = scoreRisk(profile, compatibility);
    const recommendations = generateRecommendations(risks, compatibility);

    const riskIds = new Set(risks.map((r) => r.id));
    for (const rec of recommendations) {
      // Each recommendation traces back to a real risk finding from this run.
      expect(rec.riskIds.every((id) => riskIds.has(id))).toBe(true);
    }
  });
});
