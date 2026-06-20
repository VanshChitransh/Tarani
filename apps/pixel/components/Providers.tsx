"use client";

import { useMemo, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { AuthProvider } from "../src/lib/authContext";

/**
 * Client-side provider stack. Wallets register themselves via the Wallet
 * Standard (Phantom, Solflare, Backpack, …), so the explicit adapter list is
 * empty — they're auto-detected. The RPC endpoint is only needed to satisfy
 * ConnectionProvider; Tarani's sign-in never sends a transaction.
 */
export function Providers({ children }: { children: ReactNode }) {
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.mainnet-beta.solana.com",
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <AuthProvider>{children}</AuthProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
