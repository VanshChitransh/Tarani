import { describe, expect, it } from "vitest";
import { ageInDays, classifyAge, checkRuleFreshness } from "./freshness";
import type { VenueRule } from "./types";

const NOW = new Date("2026-06-01T00:00:00Z");

function rule(venue: VenueRule["venue"], lastUpdated: string): VenueRule {
  return { venue, version: "1.0.0", last_updated: lastUpdated, features: [], notes: [] };
}

describe("ageInDays", () => {
  it("computes whole days between a date and now", () => {
    expect(ageInDays("2026-05-30", NOW)).toBe(2);
    expect(ageInDays("2026-06-01", NOW)).toBe(0);
  });

  it("treats an unparseable date as maximally stale", () => {
    expect(ageInDays("not-a-date", NOW)).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe("classifyAge", () => {
  it("classifies by threshold boundaries", () => {
    expect(classifyAge(10, 60, 120)).toBe("fresh");
    expect(classifyAge(60, 60, 120)).toBe("stale");
    expect(classifyAge(119, 60, 120)).toBe("stale");
    expect(classifyAge(120, 60, 120)).toBe("critical");
  });
});

describe("checkRuleFreshness", () => {
  const rules: Record<string, VenueRule> = {
    jupiter: rule("jupiter", "2026-05-30"), // 2d -> fresh
    raydium: rule("raydium", "2026-03-15"), // ~78d -> stale
    orca: rule("orca", "2025-12-01"), // ~182d -> critical
  };

  it("classifies each venue and aggregates counts", () => {
    const report = checkRuleFreshness({ rules, now: NOW, staleDays: 60, criticalDays: 120 });
    expect(report.venues).toHaveLength(3);
    expect(report.criticalCount).toBe(1);
    expect(report.staleCount).toBe(2); // stale + critical
    expect(report.hasStale).toBe(true);
  });

  it("sorts venues oldest-first", () => {
    const report = checkRuleFreshness({ rules, now: NOW });
    expect(report.venues[0].venue).toBe("orca");
    expect(report.venues.at(-1)?.venue).toBe("jupiter");
  });

  it("reports all fresh when every rule is recent", () => {
    const fresh = { a: rule("jupiter", "2026-05-31"), b: rule("orca", "2026-05-20") };
    const report = checkRuleFreshness({ rules: fresh, now: NOW });
    expect(report.hasStale).toBe(false);
    expect(report.staleCount).toBe(0);
  });

  it("respects custom thresholds", () => {
    const report = checkRuleFreshness({ rules, now: NOW, staleDays: 1, criticalDays: 3 });
    // With a 3-day critical threshold, even the 2-day-old jupiter is stale-or-critical territory.
    expect(report.staleCount).toBe(3);
    expect(report.criticalCount).toBe(2); // raydium + orca well past 3d
  });
});
