"use client";

import { useState } from "react";
import type { SimulationReport, SimulationResponse } from "@tarani/shared";
import { SimulationTimeline } from "./SimulationTimeline";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; report: SimulationReport }
  | { status: "error"; message: string };

interface Props {
  mint: string;
}

export function SimulationSection({ mint }: Props) {
  const [state, setState] = useState<State>({ status: "idle" });

  async function runSimulation() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mint }),
        signal: AbortSignal.timeout(65_000),
      });

      const json = (await res.json()) as SimulationResponse;

      if (!json.ok) {
        setState({ status: "error", message: json.error.message });
        return;
      }

      setState({ status: "done", report: json.data });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === "TimeoutError"
            ? "Simulation timed out. Try again."
            : err.message
          : "Unexpected error";
      setState({ status: "error", message });
    }
  }

  if (state.status === "idle") {
    return (
      <button
        onClick={runSimulation}
        className="text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-md px-4 py-2 transition-colors"
      >
        Run Simulation
      </button>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <span className="inline-block h-4 w-4 rounded-full border-2 border-neutral-300 border-t-blue-500 animate-spin" />
        Running scenarios…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex items-center justify-between gap-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
        <span>{state.message}</span>
        <button
          onClick={runSimulation}
          className="shrink-0 text-xs font-medium underline underline-offset-2 hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return <SimulationTimeline report={state.report} />;
}
