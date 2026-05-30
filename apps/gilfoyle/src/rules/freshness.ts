import type { VenueId } from "@tarani/shared";
import type { VenueRule } from "./types";
import { loadAllVenueRules } from "./loadRules";

// Gap 6: venue rules are hand-maintained JSON. Without staleness detection they silently
// drift away from the venues' real behavior. These thresholds turn "drift" into a signal.
export const DEFAULT_STALE_DAYS = 60;
export const DEFAULT_CRITICAL_DAYS = 120;

const MS_PER_DAY = 86_400_000;

export type FreshnessLevel = "fresh" | "stale" | "critical";

export interface VenueFreshness {
  venue: VenueId;
  lastUpdated: string;
  ageDays: number;
  level: FreshnessLevel;
}

export interface FreshnessReport {
  checkedAt: string;
  staleThresholdDays: number;
  criticalThresholdDays: number;
  venues: VenueFreshness[];
  /** Count of venues that are stale OR critical. */
  staleCount: number;
  criticalCount: number;
  hasStale: boolean;
}

export interface FreshnessOptions {
  /** Reference "now". Injectable for deterministic tests. */
  now?: Date;
  staleDays?: number;
  criticalDays?: number;
  /** Override the rule set (defaults to all loaded venue rules). */
  rules?: Record<string, VenueRule>;
}

/** Whole days between an ISO date (YYYY-MM-DD) and now. Unparseable dates are treated as maximally stale. */
export function ageInDays(lastUpdated: string, now: Date): number {
  const then = new Date(`${lastUpdated}T00:00:00Z`).getTime();
  if (Number.isNaN(then)) return Number.MAX_SAFE_INTEGER;
  return Math.floor((now.getTime() - then) / MS_PER_DAY);
}

export function classifyAge(
  ageDays: number,
  staleDays: number,
  criticalDays: number,
): FreshnessLevel {
  if (ageDays >= criticalDays) return "critical";
  if (ageDays >= staleDays) return "stale";
  return "fresh";
}

export function checkRuleFreshness(opts: FreshnessOptions = {}): FreshnessReport {
  const now = opts.now ?? new Date();
  const staleDays = opts.staleDays ?? DEFAULT_STALE_DAYS;
  const criticalDays = opts.criticalDays ?? DEFAULT_CRITICAL_DAYS;
  const rules = opts.rules ?? loadAllVenueRules();

  const venues: VenueFreshness[] = Object.values(rules)
    .map((rule) => {
      const ageDays = ageInDays(rule.last_updated, now);
      return {
        venue: rule.venue,
        lastUpdated: rule.last_updated,
        ageDays,
        level: classifyAge(ageDays, staleDays, criticalDays),
      };
    })
    .sort((a, b) => b.ageDays - a.ageDays);

  const criticalCount = venues.filter((v) => v.level === "critical").length;
  const staleCount = venues.filter((v) => v.level !== "fresh").length;

  return {
    checkedAt: now.toISOString(),
    staleThresholdDays: staleDays,
    criticalThresholdDays: criticalDays,
    venues,
    staleCount,
    criticalCount,
    hasStale: staleCount > 0,
  };
}
