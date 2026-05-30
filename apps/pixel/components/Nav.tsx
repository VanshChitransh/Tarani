"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/prelaunch", label: "Pre-Launch" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 px-4 py-2.5 border-b border-neutral-100 bg-white sticky top-0 z-10">
      <Link
        href="/"
        className="font-semibold text-neutral-900 mr-4 text-sm hover:text-neutral-600 transition-colors"
      >
        Tarani
      </Link>
      {links.slice(1).map(({ href, label }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              active
                ? "bg-neutral-100 text-neutral-900 font-medium"
                : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
