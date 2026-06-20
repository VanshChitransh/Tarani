"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Real mainnet mints, all verified on-chain. The first five are Token-2022
// (token-extensions) mints owned by TokenzQ…; USDC and USDT are legacy SPL
// tokens (Tokenkeg…) included for contrast.
const SAMPLE_MINTS = [
  {
    label: "PYUSD",
    address: "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
    note: "PayPal USD (Token-2022)",
  },
  {
    label: "USDG",
    address: "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH",
    note: "Global Dollar (Token-2022)",
  },
  {
    label: "USDu",
    address: "9ckR7pPPvyPadACDTzLwK2ZAEeUJ3qGSnzPs8bVaHrSy",
    note: "USDu stablecoin (Token-2022)",
  },
  {
    label: "GLDx",
    address: "Xsv9hRk1z5ystj9MhnA7Lq4vjSsLwzL2nxrwmwtD3re",
    note: "Gold xStock (Token-2022)",
  },
  {
    label: "PYPLx",
    address: "XshWQWYVp5ff8CrAEsGmLVKD47nBWi3Ygn5v8wXK27G",
    note: "PayPal xStock (Token-2022)",
  },
  {
    label: "USDC",
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    note: "USD Coin (legacy SPL)",
  },
  {
    label: "USDT",
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    note: "Tether USD (legacy SPL)",
  },
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
            placeholder="Paste a mint address…"
            className="flex-1 border border-neutral-200 rounded-lg px-3 py-2.5 text-sm font-mono placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-colors"
          />
          <button
            type="submit"
            disabled={mint.trim().length < 32}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            {isPending && (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            )}
            {isPending ? "Analyzing…" : "Analyze"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-400">Try:</span>
          {SAMPLE_MINTS.map(({ label, address, note }) => (
            <button
              key={address}
              type="button"
              onClick={() => tryMint(address)}
              title={note}
              className="text-xs text-neutral-500 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-400 rounded px-2 py-0.5 transition-colors font-mono"
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
