import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import SocialCard from "./components/SocialCard";

export const metadata: Metadata = {
  // metadataBase resolves relative OG/icon URLs; update to the production origin.
  metadataBase: new URL("https://tarani.io"),
  title: "Tarani",
  description: "Tarani — Solana token risk analysis.",
  // app/icon.svg is picked up automatically by Next.js as the favicon.
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-white text-neutral-900 antialiased">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-neutral-200 px-6 py-8">
          <SocialCard />
        </footer>
      </body>
    </html>
  );
}
