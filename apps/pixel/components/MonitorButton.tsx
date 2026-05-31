"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "../src/lib/authContext";

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
  const { address, signIn, signingIn } = useAuth();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

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

  // Tracking is per-wallet, so require sign-in before showing the Track action.
  if (state.status === "idle" && !address) {
    if (!connected) {
      return (
        <button
          onClick={() => setVisible(true)}
          className="px-4 py-2 text-sm font-medium rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
        >
          Connect wallet to track
        </button>
      );
    }
    return (
      <button
        onClick={signIn}
        disabled={signingIn}
        className="px-4 py-2 text-sm font-medium rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
      >
        {signingIn ? "Signing…" : "Sign in to track"}
      </button>
    );
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
