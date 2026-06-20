import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AlertWebhook } from "@tarani/shared";
import { postToWebhooks } from "./dispatch";

function wh(id: string, url: string): AlertWebhook {
  return { id, url, addedAt: "2026-01-01T00:00:00.000Z", active: true };
}

beforeEach(() => {
  // Silence the structured failure logs so test output stays clean; we assert
  // on the returned results instead.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("postToWebhooks", () => {
  it("reports success for a 2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 200 })),
    );
    const results = await postToWebhooks([wh("a", "https://example.com/hook")], "{}");
    expect(results).toEqual([{ id: "a", url: "https://example.com/hook", ok: true, status: 200 }]);
  });

  it("captures a non-2xx response as failed without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 500 })),
    );
    const results = await postToWebhooks([wh("b", "https://example.com/hook")], "{}");
    expect(results[0]).toMatchObject({ id: "b", ok: false, status: 500 });
    expect(console.error).toHaveBeenCalledOnce();
  });

  it("captures a network error as failed without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    const results = await postToWebhooks([wh("c", "https://example.com/hook")], "{}");
    expect(results[0].ok).toBe(false);
    expect(results[0].error).toContain("ECONNREFUSED");
  });

  it("isolates failures: one bad webhook does not sink the others", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockRejectedValueOnce(new Error("boom"));
    vi.stubGlobal("fetch", fetchMock);
    const results = await postToWebhooks(
      [wh("ok", "https://a.example/hook"), wh("bad", "https://b.example/hook")],
      "{}",
    );
    expect(results.find((r) => r.id === "ok")?.ok).toBe(true);
    expect(results.find((r) => r.id === "bad")?.ok).toBe(false);
  });

  it("refuses a non-HTTPS webhook without calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const results = await postToWebhooks([wh("http", "http://insecure.example/hook")], "{}");
    expect(results[0]).toMatchObject({ id: "http", ok: false });
    expect(results[0].error).toContain("non-HTTPS");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledOnce();
  });

  it("returns an empty array for no webhooks (no fetch calls)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const results = await postToWebhooks([], "{}");
    expect(results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
