import Link from "next/link";

export default function Nav() {
  return (
    <nav className="flex items-center gap-6 px-4 py-3 border-b border-neutral-100 text-sm">
      <Link href="/" className="font-semibold text-neutral-900 hover:text-neutral-600">
        Tarani
      </Link>
      <Link href="/prelaunch" className="text-neutral-500 hover:text-neutral-900">
        Pre-Launch
      </Link>
      <Link href="/dashboard" className="text-neutral-500 hover:text-neutral-900">
        Dashboard
      </Link>
    </nav>
  );
}
