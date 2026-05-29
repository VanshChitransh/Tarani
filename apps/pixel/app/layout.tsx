import type { ReactNode } from "react";
import "./globals.css";
import Nav from "../components/Nav";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-neutral-900 antialiased">
        <Nav />
        {children}
      </body>
    </html>
  );
}
