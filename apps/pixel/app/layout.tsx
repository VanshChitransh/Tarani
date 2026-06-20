import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Nav from "../components/Nav";
import { Providers } from "../components/Providers";
import SocialCard from "../components/SocialCard";

export const metadata: Metadata = {
  // metadataBase resolves relative OG/icon URLs; update to the production origin.
  metadataBase: new URL("https://tarani.io"),
  title: "Tarani",
  description: "Tarani — Solana token risk analysis.",
  // app/icon.svg is picked up automatically by Next.js as the favicon.
};

// Runs before first paint to apply the saved theme, avoiding a flash of the
// wrong theme. Defaults to light when nothing is saved (ignores OS preference).
// Kept as a raw string so it ships inline in <head>.
const themeInit = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark";document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="bg-white text-neutral-900 antialiased">
        <Providers>
          {/* Flex column so the footer sticks to the bottom on short pages. */}
          <div className="flex min-h-screen flex-col">
            <Nav />
            <div className="flex-1">{children}</div>
            <footer className="border-t border-neutral-200 px-6 py-8">
              <SocialCard />
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
