"use client";

import type { ScenarioResult, SimulationReport } from "@tarani/shared";

const OUTCOME_STYLES: Record<ScenarioResult["outcome"], string> = {
  success: "bg-green-100 text-green-800 border border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  blocked: "bg-red-100 text-red-800 border border-red-200",
  error: "bg-orange-100 text-orange-800 border border-orange-200",
};

const OUTCOME_DOT: Record<ScenarioResult["outcome"], string> = {
  success: "bg-green-500",
  warning: "bg-yellow-400",
  blocked: "bg-red-500",
  error: "bg-orange-500",
};

const OUTCOME_LABEL: Record<ScenarioResult["outcome"], string> = {
  success: "Pass",
  warning: "Warning",
  blocked: "Blocked",
  error: "Error",
};

const KIND_LABEL: Record<string, string> = {
  transfer: "Basic Transfer",
  transfer_hook: "Transfer Hook",
  transfer_fee: "Transfer Fee",
  memo_required: "Memo Required",
  metadata_check: "Metadata",
  swap: "Swap Route",
  wrap_sol: "Liquidity Pool",
  associated_token_create: "Token Account",
  freeze_check: "Freeze",
};

const MODE_STYLES: Record<SimulationReport["validatorMode"], string> = {
  live: "bg-blue-100 text-blue-700 border border-blue-200",
  heuristic: "bg-neutral-100 text-neutral-600 border border-neutral-200",
};

// Per-scenario execution mode, so a row never implies a live validator tx when it
// was actually an external API probe or static analysis.
const SCENARIO_MODE_LABEL: Record<string, string> = {
  validator: "live tx",
  api: "API probe",
  analysis: "static",
};

const SCENARIO_MODE_STYLES: Record<string, string> = {
  validator: "bg-blue-50 text-blue-700 border border-blue-200",
  api: "bg-violet-50 text-violet-700 border border-violet-200",
  analysis: "bg-neutral-100 text-neutral-500 border border-neutral-200",
};

const SCENARIO_MODE_TITLE: Record<string, string> = {
  validator: "Executed as a real transaction on the local test validator",
  api: "Verdict from a live external API probe (Jupiter/Raydium) — not a validator transaction",
  analysis: "Static analysis of the mint's configuration — no transaction was executed",
};

interface Props {
  report: SimulationReport;
}

export function SimulationTimeline({ report }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${MODE_STYLES[report.validatorMode]}`}
        >
          {report.validatorMode === "live" ? "Live validator" : "Heuristic mode"}
        </span>
        <span className="text-xs text-neutral-400">
          {report.results.length} scenario{report.results.length !== 1 ? "s" : ""}
        </span>
      </div>

      {report.validatorMode === "heuristic" && (
        <p className="text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2">
          The local validator was unavailable, so these results are static analysis of the
          mint&apos;s configuration — not live transactions.
        </p>
      )}

      <div className="relative">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-neutral-200" aria-hidden />
        <div className="space-y-3 pl-8">
          {report.results.map((result) => (
            <div key={result.id} className="relative">
              <span
                className={`absolute -left-6 top-1.5 h-2.5 w-2.5 rounded-full ${OUTCOME_DOT[result.outcome]}`}
                aria-hidden
              />
              <div className="border border-neutral-200 rounded-md px-4 py-3 space-y-1.5 bg-white">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-neutral-800">
                    {KIND_LABEL[result.kind] ?? result.kind}
                  </span>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${OUTCOME_STYLES[result.outcome]}`}
                  >
                    {OUTCOME_LABEL[result.outcome]}
                  </span>
                  <span
                    title={SCENARIO_MODE_TITLE[result.mode]}
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${SCENARIO_MODE_STYLES[result.mode] ?? ""}`}
                  >
                    {SCENARIO_MODE_LABEL[result.mode] ?? result.mode}
                  </span>
                  {/* Only a real validator tx has a meaningful wall-clock; for API/static
                      rows a "0ms"/probe latency reads as broken, so hide it. */}
                  {result.mode === "validator" && (
                    <span className="ml-auto text-xs text-neutral-400">{result.durationMs}ms</span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">{result.summary}</p>
                {result.failureCode && (
                  <p className="text-xs font-mono text-neutral-400">code: {result.failureCode}</p>
                )}
                {result.logs && result.logs.length > 0 && (
                  <details className="text-xs text-neutral-400">
                    <summary className="cursor-pointer hover:text-neutral-600">
                      {result.logs.length} log line{result.logs.length !== 1 ? "s" : ""}
                    </summary>
                    <pre className="mt-1 bg-neutral-50 border border-neutral-200 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                      {result.logs.join("\n")}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
