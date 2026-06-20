import type { AlertWebhook } from "@tarani/shared";
import { listWebhooks } from "./store";

export interface WebhookDeliveryResult {
  id: string;
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
}

const WEBHOOK_TIMEOUT_MS = 5_000;

/**
 * POST `body` to each given webhook, capturing every per-webhook outcome.
 *
 * This never throws and never swallows silently: a failed delivery (network
 * error or non-2xx) is logged with the webhook id + url, and a structured
 * result is returned so callers can surface or persist the outcome. One bad
 * webhook never sinks the others.
 *
 * Retries / dead-letter replay are intentionally NOT handled here yet: a naive
 * retry without an idempotency key would double-deliver. That is tracked as a
 * separate enhancement.
 */
export async function postToWebhooks(
  webhooks: AlertWebhook[],
  body: string,
): Promise<WebhookDeliveryResult[]> {
  // The per-webhook handler catches everything, so none of these reject.
  return Promise.all(
    webhooks.map(async (webhook): Promise<WebhookDeliveryResult> => {
      // Alert payloads carry mint + compatibility data; refuse to leak them over
      // plaintext HTTP even if a non-HTTPS URL slipped past registration.
      if (!webhook.url.toLowerCase().startsWith("https://")) {
        console.error(
          `[webhooks] Refusing to deliver to non-HTTPS webhook ${webhook.url} (${webhook.id})`,
        );
        return { id: webhook.id, url: webhook.url, ok: false, error: "insecure-url (non-HTTPS)" };
      }
      try {
        const res = await fetch(webhook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
        });
        if (!res.ok) {
          console.error(
            `[webhooks] Delivery to ${webhook.url} (${webhook.id}) returned HTTP ${res.status}`,
          );
          return { id: webhook.id, url: webhook.url, ok: false, status: res.status };
        }
        return { id: webhook.id, url: webhook.url, ok: true, status: res.status };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[webhooks] Failed to dispatch to ${webhook.url} (${webhook.id}): ${message}`,
        );
        return { id: webhook.id, url: webhook.url, ok: false, error: message };
      }
    }),
  );
}

/**
 * Convenience wrapper: load all active webhooks and deliver `body` to each.
 * Returns an empty array when no webhooks are registered.
 */
export async function dispatchToWebhooks(body: string): Promise<WebhookDeliveryResult[]> {
  const webhooks = await listWebhooks();
  if (webhooks.length === 0) return [];
  return postToWebhooks(webhooks, body);
}
