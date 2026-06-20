import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Nav from "../components/Nav";
import { Providers } from "../components/Providers";

const TITLE = "Tarani";
const DESCRIPTION = "Token-2022 compatibility intelligence for Solana.";
// Canonical production origin — MUST match the domain the site is actually
// served from (www), because the apex tarani.io 307-redirects to www and
// social crawlers (WhatsApp/Facebook) do NOT follow redirects on og:image.
const SITE_URL = "https://www.tarani.io";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  // app/icon.svg is the favicon; app/opengraph-image + app/twitter-image
  // supply the link-preview poster automatically — no `images` needed here.
  openGraph: {
    type: "website",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
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
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
