import type { CompatibilityDiff } from "@tarani/shared";
import type { FreshnessReport } from "@tarani/gilfoyle";
import { listWebhooks } from "@tarani/monitor-store";

async function postToWebhooks(body: string): Promise<void> {
  const webhooks = await listWebhooks();
  if (webhooks.length === 0) return;

  await Promise.allSettled(
    webhooks.map(async (webhook) => {
      try {
        await fetch(webhook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: AbortSignal.timeout(5_000),
        });
        console.log(`[sentinel] Alert sent to ${webhook.url}`);
      } catch (err) {
        console.error(`[sentinel] Failed to dispatch to ${webhook.url}:`, err);
      }
    }),
  );
}

export async function dispatchAlerts(mint: string, diffs: CompatibilityDiff[]): Promise<void> {
  await postToWebhooks(JSON.stringify({ mint, diffs, detectedAt: new Date().toISOString() }));
}

export async function dispatchFreshnessAlert(report: FreshnessReport): Promise<void> {
  const stale = report.venues.filter((v) => v.level !== "fresh");
  await postToWebhooks(
    JSON.stringify({
      kind: "rule_freshness",
      detectedAt: report.checkedAt,
      staleThresholdDays: report.staleThresholdDays,
      criticalThresholdDays: report.criticalThresholdDays,
      staleVenues: stale,
    }),
  );
}
