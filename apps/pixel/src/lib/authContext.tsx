"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";

interface AuthState {
  /** Verified wallet address of the signed-in user, or null. */
  address: string | null;
  /** True while the initial session check is in flight. */
  loading: boolean;
  signingIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, disconnect } = useWallet();
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore an existing session cookie on load.
  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (active) setAddress(d?.data?.address ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async () => {
    if (!publicKey || !signMessage) {
      setError("Connect a wallet that can sign messages first.");
      return;
    }
    setSigningIn(true);
    setError(null);
    try {
      const addr = publicKey.toBase58();
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      }).then((r) => r.json());
      if (!nonceRes?.ok) throw new Error(nonceRes?.error?.message ?? "Could not start sign-in.");

      const { message, nonce } = nonceRes.data as { message: string; nonce: string };
      const signature = await signMessage(new TextEncoder().encode(message));

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr, nonce, signature: bs58.encode(signature) }),
      }).then((r) => r.json());
      if (!verifyRes?.ok) throw new Error(verifyRes?.error?.message ?? "Sign-in failed.");

      setAddress(addr);
    } catch (e) {
      // User rejecting the signature in their wallet lands here too.
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setSigningIn(false);
    }
  }, [publicKey, signMessage]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setAddress(null);
    setError(null);
    try {
      await disconnect();
    } catch {
      // ignore — wallet may already be disconnected
    }
  }, [disconnect]);

  return (
    <AuthCtx.Provider value={{ address, loading, signingIn, error, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
