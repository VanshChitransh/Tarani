import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeliusClient, HeliusClientError } from "./index";

const FAKE_URL = "http://helius.invalid/rpc";

describe("HeliusClient", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("validation", () => {
    it("throws BAD_REQUEST for an invalid base58 mint", async () => {
      const client = new HeliusClient({ rpcUrl: FAKE_URL });
      await expect(client.fetchMintAsset("not-base58-!!!")).rejects.toBeInstanceOf(
        HeliusClientError,
      );
      try {
        await client.fetchMintAsset("not-base58-!!!");
      } catch (err) {
        expect((err as HeliusClientError).code).toBe("BAD_REQUEST");
      }
    });

    it("throws BAD_REQUEST for a too-short address", async () => {
      const client = new HeliusClient({ rpcUrl: FAKE_URL });
      await expect(client.fetchMintAsset("abc")).rejects.toMatchObject({
        name: "HeliusClientError",
        code: "BAD_REQUEST",
      });
    });
  });

  describe("timeout path", () => {
    it("throws UPSTREAM_TIMEOUT when fetch aborts", async () => {
      globalThis.fetch = vi.fn().mockImplementation(() => {
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        return Promise.reject(err);
      }) as typeof fetch;

      const client = new HeliusClient({
        rpcUrl: FAKE_URL,
        timeoutMs: 50,
        maxRetries: 0,
      });
      await expect(
        client.fetchMintAsset("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      ).rejects.toMatchObject({
        name: "HeliusClientError",
        code: "UPSTREAM_TIMEOUT",
      });
    });
  });

  describe("not-found path", () => {
    it("throws NOT_FOUND when Helius returns null result", async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ jsonrpc: "2.0", id: "tarani-gilfoyle", result: null }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        ) as typeof fetch;

      const client = new HeliusClient({ rpcUrl: FAKE_URL, maxRetries: 0 });
      await expect(
        client.fetchMintAsset("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      ).rejects.toMatchObject({
        name: "HeliusClientError",
        code: "NOT_FOUND",
      });
    });
  });

  describe("rate-limit path", () => {
    it("throws RATE_LIMITED on 429", async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(new Response("rate limit", { status: 429 })) as typeof fetch;

      const client = new HeliusClient({ rpcUrl: FAKE_URL, maxRetries: 0 });
      await expect(
        client.fetchMintAsset("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      ).rejects.toMatchObject({
        name: "HeliusClientError",
        code: "RATE_LIMITED",
      });
    });
  });

  describe("construction guard", () => {
    it("throws INTERNAL if no rpcUrl is configured", () => {
      const oldEnv = process.env.SOLANA_RPC_URL;
      delete process.env.SOLANA_RPC_URL;
      try {
        expect(() => new HeliusClient()).toThrow(/RPC URL not configured/);
      } finally {
        if (oldEnv !== undefined) process.env.SOLANA_RPC_URL = oldEnv;
      }
    });
  });

  beforeEach(() => {
    // intentionally empty; per-test setup happens inline above
  });
});
