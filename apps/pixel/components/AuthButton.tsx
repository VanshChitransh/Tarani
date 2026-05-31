"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "../src/lib/authContext";

const BTN =
  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-50";

export function AuthButton() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { address, loading, signingIn, signIn, signOut } = useAuth();

  // Wallet state differs between server render and client; gate on mount so the
  // first client paint matches SSR and React doesn't throw a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || loading) {
    return <div className="h-7 w-28 rounded-md bg-neutral-100 animate-pulse" aria-hidden />;
  }

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-neutral-500" title={address}>
          {address.slice(0, 4)}…{address.slice(-4)}
        </span>
        <button
          onClick={signOut}
          className="px-2.5 py-1.5 rounded-md text-sm text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (connected && publicKey) {
    return (
      <button onClick={signIn} disabled={signingIn} className={BTN}>
        {signingIn ? "Signing…" : "Sign in"}
      </button>
    );
  }

  return (
    <button onClick={() => setVisible(true)} className={BTN}>
      Connect wallet
    </button>
  );
}
