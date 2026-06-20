"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "./CopyButton";

interface Props {
  mint: string;
}

export function BadgeSection({ mint }: Props) {
  // Prefer the configured public base URL (inlined at build time, identical on
  // server and client). Fall back to the live origin when it isn't set.
  const [origin, setOrigin] = useState(process.env.NEXT_PUBLIC_BASE_URL ?? "");
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_BASE_URL) setOrigin(window.location.origin);
  }, []);

  const badgeUrl = `${origin}/api/badge/${mint}`;
  const reportUrl = `${origin}/report/${mint}`;
  const markdownSnippet = `[![Tarani compatibility badge](${badgeUrl})](${reportUrl})`;
  const htmlSnippet = `<a href="${reportUrl}"><img src="${badgeUrl}" alt="Tarani compatibility badge" /></a>`;

  return (
    <div className="space-y-4 min-w-0">
      <div>
        {/* The badge image itself stays relative so it renders before origin resolves. */}
        <img src={`/api/badge/${mint}`} alt="Tarani compatibility badge" />
      </div>

      <div className="space-y-2 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Markdown</p>
          <CopyButton text={markdownSnippet} />
        </div>
        <pre className="bg-neutral-50 border border-neutral-200 rounded px-3 py-2 text-xs font-mono text-neutral-700 overflow-x-auto">
          {markdownSnippet}
        </pre>
      </div>

      <div className="space-y-2 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">HTML</p>
          <CopyButton text={htmlSnippet} />
        </div>
        <pre className="bg-neutral-50 border border-neutral-200 rounded px-3 py-2 text-xs font-mono text-neutral-700 overflow-x-auto">
          {htmlSnippet}
        </pre>
      </div>
    </div>
  );
}
