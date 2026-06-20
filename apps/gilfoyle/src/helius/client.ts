import { HeliusClientError, isRetriable } from "./errors";
import type { HeliusAsset, HeliusRpcResponse } from "./types";

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export interface HeliusClientOptions {
  rpcUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export class HeliusClient {
  private static cache = new Map<string, { data: HeliusAsset; expiresAt: number }>();
  private static readonly TTL_MS = 5 * 60 * 1_000;

  private readonly rpcUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(opts: HeliusClientOptions = {}) {
    const rpcUrl = opts.rpcUrl ?? process.env.SOLANA_RPC_URL ?? "";
    if (!rpcUrl) {
      throw new HeliusClientError(
        "INTERNAL",
        "Helius RPC URL not configured (SOLANA_RPC_URL or rpcUrl option required)",
      );
    }
    this.rpcUrl = rpcUrl;
    this.timeoutMs = opts.timeoutMs ?? 5000;
    this.maxRetries = opts.maxRetries ?? 1;
  }

  async fetchMintAsset(mint: string): Promise<HeliusAsset> {
    if (!BASE58_RE.test(mint)) {
      throw new HeliusClientError("BAD_REQUEST", `Invalid mint address format: ${mint}`);
    }

    const cached = HeliusClient.cache.get(mint);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: "tarani-gilfoyle",
      method: "getAsset",
      params: { id: mint },
    });

    let lastError: HeliusClientError | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return this.cacheResult(mint, await this.attempt(body, mint));
      } catch (err) {
        const clientErr =
          err instanceof HeliusClientError
            ? err
            : new HeliusClientError("INTERNAL", err instanceof Error ? err.message : String(err));
        lastError = clientErr;
        if (!isRetriable(clientErr.code) || attempt === this.maxRetries) {
          throw clientErr;
        }
        await sleep(200 * Math.pow(4, attempt));
      }
    }
    throw lastError ?? new HeliusClientError("INTERNAL", "fetchMintAsset exhausted retries");
  }

  private cacheResult(mint: string, data: HeliusAsset): HeliusAsset {
    HeliusClient.cache.set(mint, { data, expiresAt: Date.now() + HeliusClient.TTL_MS });
    return data;
  }

  private async attempt(body: string, mint: string): Promise<HeliusAsset> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let res: Response;
    try {
      res = await fetch(this.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new HeliusClientError(
          "UPSTREAM_TIMEOUT",
          `Helius request timed out after ${this.timeoutMs}ms`,
        );
      }
      throw new HeliusClientError(
        "UPSTREAM_ERROR",
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 429) {
      throw new HeliusClientError("RATE_LIMITED", "Helius rate limited", { status: 429 });
    }
    if (res.status >= 500) {
      throw new HeliusClientError("UPSTREAM_ERROR", `Helius upstream error ${res.status}`, {
        status: res.status,
      });
    }
    if (!res.ok) {
      throw new HeliusClientError("UPSTREAM_ERROR", `Helius non-OK ${res.status}`, {
        status: res.status,
      });
    }

    const json = (await res.json()) as HeliusRpcResponse<HeliusAsset | null>;
    if ("error" in json) {
      throw new HeliusClientError("UPSTREAM_ERROR", json.error.message, {
        rpcCode: json.error.code,
      });
    }
    if (!json.result) {
      throw new HeliusClientError("NOT_FOUND", `Mint not found: ${mint}`);
    }
    return json.result;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
