import type { CompatibilityDiff } from "@tarani/shared";
import type { FreshnessReport } from "@tarani/gilfoyle";
import { dispatchToWebhooks } from "@tarani/monitor-store";

export async function dispatchAlerts(mint: string, diffs: CompatibilityDiff[]): Promise<void> {
  await dispatchToWebhooks(JSON.stringify({ mint, diffs, detectedAt: new Date().toISOString() }));
}

export async function dispatchFreshnessAlert(report: FreshnessReport): Promise<void> {
  const stale = report.venues.filter((v) => v.level !== "fresh");
  await dispatchToWebhooks(
    JSON.stringify({
      kind: "rule_freshness",
      detectedAt: report.checkedAt,
      staleThresholdDays: report.staleThresholdDays,
      criticalThresholdDays: report.criticalThresholdDays,
      staleVenues: stale,
    }),
  );
}
