#!/usr/bin/env bun
import { readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkRuleFreshness, type FreshnessLevel } from "../src/rules/freshness";
import type { VenueRule } from "../src/rules/types";

const HERE = dirname(fileURLToPath(import.meta.url));
const RULES_DIR = resolve(HERE, "../rules/venues");

// Allow overrides from CI: CHECK_FRESHNESS_STALE_DAYS / _CRITICAL_DAYS.
const staleDays = Number(process.env.CHECK_FRESHNESS_STALE_DAYS ?? "60");
const criticalDays = Number(process.env.CHECK_FRESHNESS_CRITICAL_DAYS ?? "120");
// Treat stale (not just critical) as a failure unless explicitly told to warn-only.
const failOn: FreshnessLevel =
  process.env.CHECK_FRESHNESS_FAIL_ON === "critical" ? "critical" : "stale";

const files = readdirSync(RULES_DIR).filter((name) => name.endsWith(".json"));
if (files.length === 0) {
  console.error("No venue rule files found.");
  process.exit(1);
}

const rules: Record<string, VenueRule> = {};
for (const name of files) {
  const data = JSON.parse(readFileSync(join(RULES_DIR, name), "utf8")) as VenueRule;
  rules[data.venue] = data;
}

const report = checkRuleFreshness({ rules, staleDays, criticalDays });

const ICON: Record<FreshnessLevel, string> = {
  fresh: "ok  ",
  stale: "WARN",
  critical: "FAIL",
};

console.log(`Rule freshness (stale >= ${staleDays}d, critical >= ${criticalDays}d):\n`);
for (const v of report.venues) {
  const label = `${basename(v.venue)}.json`.padEnd(22);
  console.log(`${ICON[v.level]}  ${label} ${v.ageDays}d old (updated ${v.lastUpdated})`);
}
console.log(
  `\n${report.criticalCount} critical, ${report.staleCount - report.criticalCount} stale, ` +
    `${report.venues.length - report.staleCount} fresh.`,
);

const failing = failOn === "critical" ? report.criticalCount > 0 : report.hasStale;
if (failing) {
  console.error(
    `\nRule freshness check failed (fail-on: ${failOn}). Refresh the flagged venue rules.`,
  );
  process.exit(1);
}
console.log("\nAll venue rules are within freshness thresholds.");
process.exit(0);
