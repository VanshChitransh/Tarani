import type { VenueCompatibilityResult, VenueFeatureStatus } from "@tarani/shared";

const STATUS_STYLES: Record<VenueCompatibilityResult["status"], string> = {
  supported: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  conditional: "bg-orange-100 text-orange-700",
  blocked: "bg-red-100 text-red-700",
  unknown: "bg-neutral-100 text-neutral-500",
};

const STATUS_DOT: Record<VenueCompatibilityResult["status"], string> = {
  supported: "bg-green-500",
  partial: "bg-yellow-400",
  conditional: "bg-orange-400",
  blocked: "bg-red-500",
  unknown: "bg-neutral-300",
};

const STATUS_LABEL: Record<VenueCompatibilityResult["status"], string> = {
  supported: "Supported",
  partial: "Partial",
  conditional: "Conditional",
  blocked: "Blocked",
  unknown: "Unknown",
};

const CONFIDENCE_LABEL: Record<VenueCompatibilityResult["confidence"], string> = {
  high: "High",
  medium: "Med",
  low: "Low",
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

const SCOPE_LABEL: Record<string, string> = {
  swap: "Swap",
  limitOrders: "Limit Orders",
  dca: "DCA",
};

function StatusBadge({ status }: { status: VenueFeatureStatus["status"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

interface Props {
  results: VenueCompatibilityResult[];
}

export function CompatibilityMatrix({ results }: Props) {
  const counts = results.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const summaryOrder: Array<VenueCompatibilityResult["status"]> = [
    "supported",
    "partial",
    "conditional",
    "blocked",
    "unknown",
  ];

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="flex flex-wrap gap-2">
        {summaryOrder
          .filter((s) => counts[s])
          .map((s) => (
            <span
              key={s}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${STATUS_STYLES[s]} border-current/20`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[s]}`} />
              {counts[s]} {STATUS_LABEL[s]}
            </span>
          ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="text-left py-2.5 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wide">
                Venue
              </th>
              <th className="text-left py-2.5 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wide">
                Status
              </th>
              <th className="text-left py-2.5 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wide">
                Confidence
              </th>
              <th className="text-left py-2.5 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wide hidden sm:table-cell">
                Source
              </th>
              <th className="text-left py-2.5 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wide hidden md:table-cell">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr
                key={r.venue}
                className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${i === results.length - 1 ? "border-b-0" : ""}`}
              >
                <td className="py-3 px-4 font-medium text-neutral-800">
                  {VENUE_LABEL[r.venue] ?? r.venue}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1">
                    {r.features ? (
                      Object.entries(r.features).map(([scope, feat]) => (
                        <div key={scope} className="flex items-center gap-2">
                          <span className="text-xs text-neutral-400 w-20 shrink-0">
                            {SCOPE_LABEL[scope] ?? scope}
                          </span>
                          <StatusBadge status={feat.status} />
                        </div>
                      ))
                    ) : (
                      <StatusBadge status={r.status} />
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-neutral-500 text-xs">
                  {CONFIDENCE_LABEL[r.confidence]}
                </td>
                <td className="py-3 px-4 text-neutral-400 text-xs capitalize hidden sm:table-cell">
                  {r.source}
                </td>
                <td className="py-3 px-4 text-neutral-500 text-xs hidden md:table-cell">
                  {r.notes.length > 0 ? r.notes[0] : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
