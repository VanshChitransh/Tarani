"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={copy}
      className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors px-1.5 py-0.5 rounded hover:bg-neutral-100 border border-transparent hover:border-neutral-200"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
