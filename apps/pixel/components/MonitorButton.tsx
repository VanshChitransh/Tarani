"use client";

import { useState } from "react";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; subscriptionId: string }
  | { status: "error"; message: string };

interface Props {
  mint: string;
}

export function MonitorButton({ mint }: Props) {
  const [state, setState] = useState<State>({ status: "idle" });

  async function track() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mint }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error.message);
      setState({ status: "done", subscriptionId: json.data.subscriptionId });
    } catch (e) {
      setState({ status: "error", message: e instanceof Error ? e.message : "Failed to track" });
    }
  }

  if (state.status === "idle") {
    return (
      <button
        onClick={track}
        className="px-4 py-2 text-sm font-medium rounded bg-neutral-900 text-white"
      >
        Track This Mint
      </button>
    );
  }

  if (state.status === "loading") {
    return (
      <button
        disabled
        className="px-4 py-2 text-sm font-medium rounded bg-neutral-900 text-white opacity-50"
      >
        Tracking…
      </button>
    );
  }

  if (state.status === "done") {
    const id = state.subscriptionId;
    const truncated = `${id.slice(0, 8)}…${id.slice(-8)}`;
    return (
      <p className="text-sm text-green-700 font-medium">
        Tracking ✓ <span className="font-mono text-xs text-neutral-500">{truncated}</span>
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-red-600">{state.message}</p>
      <button
        onClick={() => setState({ status: "idle" })}
        className="px-3 py-1.5 text-xs font-medium rounded border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
      >
        Retry
      </button>
    </div>
  );
}
