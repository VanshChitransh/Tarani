import type { CompatibilityDiff } from "@tarani/shared";
import { listWebhooks } from "@tarani/monitor-store";

export async function dispatchAlerts(mint: string, diffs: CompatibilityDiff[]): Promise<void> {
  const webhooks = await listWebhooks();
  if (webhooks.length === 0) return;

  const payload = { mint, diffs, detectedAt: new Date().toISOString() };
  const body = JSON.stringify(payload);

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
