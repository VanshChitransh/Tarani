import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Nav from "../components/Nav";
import { Providers } from "../components/Providers";
import SocialCard from "../components/SocialCard";

const TITLE = "Tarani";
const DESCRIPTION = "Token-2022 compatibility intelligence for Solana.";
// Canonical production origin — used to make og:image / icon URLs absolute.
const SITE_URL = "https://tarani.io";

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
