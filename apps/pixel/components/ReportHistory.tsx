import type { VenueCompatibilityResult } from "@tarani/shared";

const STATUS_LABEL: Record<VenueCompatibilityResult["status"], string> = {
  supported: "Supported",
  partial: "Partial",
  conditional: "Conditional",
  blocked: "Blocked",
  unknown: "Unknown",
};

const VENUE_LABEL: Record<string, string> = {
  jupiter: "Jupiter",
  raydium: "Raydium",
  orca: "Orca",
  phantom: "Phantom",
  solflare: "Solflare",
  solscan: "Solscan",
  "solana-explorer": "Solana Explorer",
};

export interface VenueChange {
  venue: string;
  from: VenueCompatibilityResult["status"];
  to: VenueCompatibilityResult["status"];
}

interface Props {
  /** Venue verdict changes vs the most recent differing snapshot. */
  changes: VenueChange[];
  /** ISO timestamp of the snapshot we diffed against, or null if none exists yet. */
  comparedAt: string | null;
  /** ISO timestamps of stored snapshots, newest first. */
  timeline: string[];
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function ReportHistory({ changes, comparedAt, timeline }: Props) {
  // No persisted history (e.g. first-ever analysis, or DB unavailable) — render nothing.
  if (timeline.length === 0) return null;

  return (
    <div className="space-y-4">
      {comparedAt === null ? (
        <p className="text-xs text-neutral-400">
          First snapshot recorded {fmt(timeline[0])}. Changes will appear here as this mint&apos;s
          verdict evolves over time.
        </p>
      ) : changes.length === 0 ? (
        <p className="text-xs text-neutral-400">No verdict changes since {fmt(comparedAt)}.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-neutral-400">Changed since {fmt(comparedAt)}:</p>
          <ul className="space-y-1.5">
            {changes.map((c) => (
              <li key={c.venue} className="flex items-center gap-2 text-sm text-neutral-700">
                <span className="font-medium text-neutral-800 w-32 shrink-0">
                  {VENUE_LABEL[c.venue] ?? c.venue}
                </span>
                <span className="text-neutral-400 line-through">{STATUS_LABEL[c.from]}</span>
                <span className="text-neutral-400">→</span>
                <span className="font-medium text-neutral-900">{STATUS_LABEL[c.to]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {timeline.length > 1 && (
        <details className="text-xs text-neutral-400">
          <summary className="cursor-pointer hover:text-neutral-600 transition-colors">
            {timeline.length} snapshots on record
          </summary>
          <ul className="mt-2 space-y-1 pl-4">
            {timeline.map((ts, i) => (
              <li key={`${ts}-${i}`} className="font-mono">
                {fmt(ts)}
                {i === 0 && <span className="ml-2 text-neutral-300">(latest)</span>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
