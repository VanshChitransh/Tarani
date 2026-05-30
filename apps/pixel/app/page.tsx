"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SAMPLE_MINTS = [
  { label: "PYUSD", address: "CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM" },
  { label: "USDC", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
];

export default function HomePage() {
  const router = useRouter();
  const [mint, setMint] = useState("");
  const [isPending, startTransition] = useTransition();

  function navigate(address: string) {
    startTransition(() => {
      router.push(`/report/${address}`);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = mint.trim();
    if (trimmed.length < 32) return;
    navigate(trimmed);
  }

  function tryMint(address: string) {
    navigate(address);
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-20 space-y-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Tarani</h1>
        <p className="text-neutral-500 leading-relaxed">
          Token-2022 compatibility scanner — check any Solana mint against Jupiter, Raydium, Orca,
          Phantom, and more before you trade or deploy.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            disabled={isPending}
            placeholder="Paste a mint address…"
            className="flex-1 border border-neutral-200 rounded-lg px-3 py-2.5 text-sm font-mono placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-colors disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={mint.trim().length < 32 || isPending}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            {isPending && (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            )}
            {isPending ? "Analyzing…" : "Analyze"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Try:</span>
          {SAMPLE_MINTS.map(({ label, address }) => (
            <button
              key={address}
              type="button"
              onClick={() => tryMint(address)}
              disabled={isPending}
              className="text-xs text-neutral-500 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-400 rounded px-2 py-0.5 transition-colors font-mono disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {label}
            </button>
          ))}
        </div>
      </form>

      <div className="border-t border-neutral-100 pt-8 flex gap-6 text-sm">
        <Link
          href="/prelaunch"
          className="text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          Pre-Launch Analyzer →
        </Link>
        <Link
          href="/dashboard"
          className="text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          Monitor Dashboard →
        </Link>
      </div>
    </main>
  );
}
