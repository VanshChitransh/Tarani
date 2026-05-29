"use client";

interface Props {
  mint: string;
}

export function BadgeSection({ mint }: Props) {
  const badgeUrl = `/api/badge/${mint}`;
  const markdownSnippet = `[![Tarani compatibility badge](https://tarani.xyz${badgeUrl})](https://tarani.xyz/report/${mint})`;
  const htmlSnippet = `<a href="https://tarani.xyz/report/${mint}"><img src="https://tarani.xyz${badgeUrl}" alt="Tarani compatibility badge" /></a>`;

  return (
    <div className="space-y-4">
      <div>
        <img src={badgeUrl} alt="Tarani compatibility badge" />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Markdown</p>
        <pre className="bg-neutral-50 border border-neutral-200 rounded px-3 py-2 text-xs font-mono text-neutral-700 overflow-x-auto whitespace-pre-wrap break-all">
          {markdownSnippet}
        </pre>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">HTML</p>
        <pre className="bg-neutral-50 border border-neutral-200 rounded px-3 py-2 text-xs font-mono text-neutral-700 overflow-x-auto whitespace-pre-wrap break-all">
          {htmlSnippet}
        </pre>
      </div>
    </div>
  );
}
