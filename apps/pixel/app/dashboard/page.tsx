"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { MonitorDetail } from "@tarani/shared";

function truncateMint(mint: string): string {
  return `${mint.slice(0, 8)}…${mint.slice(-8)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [mints, setMints] = useState<MonitorDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/monitor");
        const json = await res.json();
        if (!json.ok) throw new Error(json.error.message);

        const details: MonitorDetail[] = await Promise.all(
          json.data.map(async (r: { mint: string }) => {
            const dr = await fetch(`/api/monitor/${r.mint}`);
            const dj = await dr.json();
            return dj.ok ? dj.data : { ...r, latestSnapshot: null, latestDiff: null };
          }),
        );
        setMints(details);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed.length < 32) return;

    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch("/api/monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mint: trimmed }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error.message);

      const dr = await fetch(`/api/monitor/${trimmed}`);
      const dj = await dr.json();
      const detail: MonitorDetail = dj.ok
        ? dj.data
        : { ...json.data, latestSnapshot: null, latestDiff: null };

      setMints((prev) => {
        const exists = prev.some((m) => m.mint === trimmed);
        return exists ? prev : [...prev, detail];
      });
      setInput("");
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Failed to add mint");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(mint: string) {
    await fetch(`/api/monitor/${mint}`, { method: "DELETE" });
    setMints((prev) => prev.filter((m) => m.mint !== mint));
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Monitor Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Track token mints for compatibility changes.
        </p>
      </div>

      <section>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste a mint address…"
            className="flex-1 border border-neutral-200 rounded px-3 py-2 text-sm font-mono placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
          />
          <button
            type="submit"
            disabled={adding}
            className="px-4 py-2 text-sm font-medium rounded bg-neutral-900 text-white disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add Mint"}
          </button>
        </form>
        {addError && <p className="mt-2 text-xs text-red-600">{addError}</p>}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="pb-2 font-medium">Mint</th>
                <th className="pb-2 font-medium">Added</th>
                <th className="pb-2 font-medium">Last Checked</th>
                <th className="pb-2 font-medium">Changes</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="py-3 pr-4">
                        <div className="bg-neutral-100 animate-pulse rounded h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : mints.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400">
                    No mints tracked yet. Add a mint above to start monitoring.
                  </td>
                </tr>
              ) : (
                mints.map((m) => (
                  <tr key={m.mint} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 pr-4 font-mono text-xs">
                      <Link href={`/report/${m.mint}`} className="text-neutral-700 hover:underline">
                        {truncateMint(m.mint)}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-neutral-600">{formatDate(m.addedAt)}</td>
                    <td className="py-3 pr-4 text-neutral-600">{formatDate(m.lastCheckedAt)}</td>
                    <td className="py-3 pr-4 text-neutral-600">
                      {m.latestDiff === null
                        ? "Not yet checked"
                        : `${m.latestDiff.length} change${m.latestDiff.length === 1 ? "" : "s"}`}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleRemove(m.mint)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
