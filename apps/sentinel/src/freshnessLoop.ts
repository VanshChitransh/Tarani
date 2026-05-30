import { checkRuleFreshness, type FreshnessReport } from "@tarani/gilfoyle";
import { dispatchFreshnessAlert } from "./alertDispatcher";

// Gap 6: continuously track venue-rule staleness so drift surfaces as an alert instead of
// silently rotting. Rules change on documentation timescales, so a daily cadence is plenty.
const DEFAULT_FRESHNESS_INTERVAL_MS = 24 * 60 * 60 * 1000;

// Remember which venues we last alerted on so a persistently-stale rule doesn't re-alert
// every cycle — we only fire when the set of stale venues actually changes.
let lastAlertedKey: string | null = null;

function staleKey(report: FreshnessReport): string {
  return report.venues
    .filter((v) => v.level !== "fresh")
    .map((v) => `${v.venue}:${v.level}`)
    .sort()
    .join(",");
}

export async function freshnessTick(): Promise<FreshnessReport> {
  const report = checkRuleFreshness();

  for (const v of report.venues) {
    if (v.level !== "fresh") {
      console.warn(
        `[sentinel] rule ${v.venue} is ${v.level}: ${v.ageDays}d old (updated ${v.lastUpdated})`,
      );
    }
  }

  const key = staleKey(report);
  if (report.hasStale && key !== lastAlertedKey) {
    await dispatchFreshnessAlert(report);
    lastAlertedKey = key;
    console.log(`[sentinel] freshness alert dispatched (${report.staleCount} stale venue(s))`);
  } else if (!report.hasStale) {
    lastAlertedKey = null;
    console.log("[sentinel] all venue rules fresh");
  }

  return report;
}

export function runFreshnessLoop(intervalMs: number = DEFAULT_FRESHNESS_INTERVAL_MS): void {
  console.log(`[sentinel] Rule-freshness loop started (interval: ${intervalMs}ms)`);
  void freshnessTick();
  setInterval(() => void freshnessTick(), intervalMs);
}
