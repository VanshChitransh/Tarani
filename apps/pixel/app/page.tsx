"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [mint, setMint] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = mint.trim();
    if (trimmed.length < 32) return;
    router.push(`/report/${trimmed}`);
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-24 space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Tarani</h1>
        <p className="text-neutral-500">
          Token-22 compatibility scanner — check any Solana mint against major venues before you
          trade or deploy.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={mint}
          onChange={(e) => setMint(e.target.value)}
          placeholder="Paste a mint address…"
          className="flex-1 border border-neutral-200 rounded px-3 py-2 text-sm font-mono placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
        />
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium rounded bg-neutral-900 text-white"
        >
          Analyze
        </button>
      </form>

      <nav className="flex gap-4 text-sm">
        <Link href="/prelaunch" className="text-neutral-600 hover:text-neutral-900 underline">
          Pre-Launch Analyzer
        </Link>
        <Link href="/dashboard" className="text-neutral-600 hover:text-neutral-900 underline">
          Monitor Dashboard
        </Link>
      </nav>
    </main>
  );
}
