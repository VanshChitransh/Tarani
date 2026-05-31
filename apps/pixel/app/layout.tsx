import type { ReactNode } from "react";
import "./globals.css";
import Nav from "../components/Nav";
import { Providers } from "../components/Providers";

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
