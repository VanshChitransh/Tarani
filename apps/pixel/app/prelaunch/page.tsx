"use client";

import { useState } from "react";
import { CompatibilityMatrix } from "../../components/CompatibilityMatrix";
import { RiskSection } from "../../components/RiskSection";
import { RecommendationList } from "../../components/RecommendationList";
import type { AnalyzeReport, PrelaunchConfig } from "@tarani/shared";

const EXTENSION_OPTIONS = [
  { kind: "transferFeeConfig", label: "Transfer Fee" },
  { kind: "transferHook", label: "Transfer Hook" },
  { kind: "nonTransferable", label: "Non-Transferable" },
  { kind: "pausable", label: "Pausable" },
  { kind: "memoTransfer", label: "Memo Required" },
  { kind: "metadataPointer", label: "Metadata Pointer" },
  { kind: "interestBearing", label: "Interest Bearing" },
] as const;

const DEFAULT_CONFIG: PrelaunchConfig = {
  extensions: [],
  decimals: 6,
  authorities: { mintRenounced: true, freezeRenounced: true, updateRenounced: true },
};

export default function PrelaunchPage() {
  const [config, setConfig] = useState<PrelaunchConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<AnalyzeReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleExtension(kind: string, checked: boolean) {
    setConfig((prev) => ({
      ...prev,
      extensions: checked
        ? [...prev.extensions, { kind: kind as PrelaunchConfig["extensions"][number]["kind"] }]
        : prev.extensions.filter((e) => e.kind !== kind),
    }));
  }

  function toggleAuthority(key: keyof PrelaunchConfig["authorities"], checked: boolean) {
    setConfig((prev) => ({
      ...prev,
      authorities: { ...prev.authorities, [key]: checked },
    }));
  }

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "prelaunch", config }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error.message);
      setResult(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Pre-Launch Analyzer</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Configure your token and see compatibility before you deploy.
        </p>
      </div>

      <section className="space-y-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-3">
            Extensions
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {EXTENSION_OPTIONS.map(({ kind, label }) => (
              <label key={kind} className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={config.extensions.some((e) => e.kind === kind)}
                  onChange={(e) => toggleExtension(kind, e.target.checked)}
                  className="rounded border-neutral-300"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-3">
            Decimals
          </h2>
          <select
            value={config.decimals}
            onChange={(e) => setConfig((prev) => ({ ...prev, decimals: Number(e.target.value) }))}
            className="border border-neutral-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
          >
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-3">
            Authorities
          </h2>
          <div className="space-y-2">
            {(
              [
                { key: "mintRenounced", label: "Mint authority renounced" },
                { key: "freezeRenounced", label: "Freeze authority renounced" },
                { key: "updateRenounced", label: "Update authority renounced" },
              ] as const
            ).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={config.authorities[key]}
                  onChange={(e) => toggleAuthority(key, e.target.checked)}
                  className="rounded border-neutral-300"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-3">
            Metadata (optional)
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Name"
              value={config.name ?? ""}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, name: e.target.value || undefined }))
              }
              className="border border-neutral-200 rounded px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
            <input
              type="text"
              placeholder="Symbol"
              value={config.symbol ?? ""}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, symbol: e.target.value || undefined }))
              }
              className="border border-neutral-200 rounded px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="px-5 py-2 text-sm font-medium rounded bg-neutral-900 text-white disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Analyze Configuration"}
        </button>
      </section>

      {error && (
        <section>
          <p className="text-sm text-red-600">{error}</p>
        </section>
      )}

      {result && (
        <section className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-3">
              Venue Compatibility
            </h2>
            <CompatibilityMatrix results={result.compatibility} />
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-3">
              Risk Findings
            </h2>
            <RiskSection risks={result.risks} />
          </div>

          {result.recommendations.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-3">
                Recommendations
              </h2>
              <RecommendationList recommendations={result.recommendations} />
            </div>
          )}
        </section>
      )}
    </main>
  );
}
