import type { VenueCompatibilityResult, VenueFeatureStatus } from "@tarani/shared";

const STATUS_STYLES: Record<VenueCompatibilityResult["status"], string> = {
  supported: "bg-green-100 text-green-800",
  partial: "bg-yellow-100 text-yellow-800",
  conditional: "bg-orange-100 text-orange-800",
  blocked: "bg-red-100 text-red-800",
  unknown: "bg-neutral-100 text-neutral-500",
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
      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

interface Props {
  results: VenueCompatibilityResult[];
}

export function CompatibilityMatrix({ results }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-left py-2 px-3 font-medium text-neutral-500">Venue</th>
            <th className="text-left py-2 px-3 font-medium text-neutral-500">Status</th>
            <th className="text-left py-2 px-3 font-medium text-neutral-500">Confidence</th>
            <th className="text-left py-2 px-3 font-medium text-neutral-500">Source</th>
            <th className="text-left py-2 px-3 font-medium text-neutral-500">Notes</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.venue} className="border-b border-neutral-100 hover:bg-neutral-50">
              <td className="py-2 px-3 font-medium">{VENUE_LABEL[r.venue] ?? r.venue}</td>
              <td className="py-2 px-3">
                <div className="flex flex-col gap-1">
                  {r.features ? (
                    Object.entries(r.features).map(([scope, feat]) => (
                      <div key={scope} className="flex items-center gap-1.5">
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
              <td className="py-2 px-3 text-neutral-500 text-xs">
                {CONFIDENCE_LABEL[r.confidence]}
              </td>
              <td className="py-2 px-3 text-neutral-400 text-xs capitalize">{r.source}</td>
              <td className="py-2 px-3 text-neutral-500 text-xs">
                {r.notes.length > 0 ? r.notes[0] : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
