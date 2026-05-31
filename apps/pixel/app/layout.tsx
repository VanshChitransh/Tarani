import type { ReactNode } from "react";
import "./globals.css";
import Nav from "../components/Nav";
import { Providers } from "../components/Providers";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-neutral-900 antialiased">
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
