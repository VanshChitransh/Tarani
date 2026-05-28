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
};

const MODE_STYLES: Record<SimulationReport["validatorMode"], string> = {
  live: "bg-blue-100 text-blue-700 border border-blue-200",
  heuristic: "bg-neutral-100 text-neutral-600 border border-neutral-200",
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
                  <span className="ml-auto text-xs text-neutral-400">{result.durationMs}ms</span>
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
