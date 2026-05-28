import type { RiskFinding } from "@tarani/shared";

const SEVERITY_STYLES: Record<RiskFinding["severity"], string> = {
  critical: "bg-red-100 text-red-800 border border-red-200",
  high: "bg-orange-100 text-orange-800 border border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  low: "bg-blue-100 text-blue-800 border border-blue-200",
  info: "bg-neutral-100 text-neutral-500 border border-neutral-200",
};

const SEVERITY_LABEL: Record<RiskFinding["severity"], string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

interface Props {
  risks: RiskFinding[];
}

export function RiskSection({ risks }: Props) {
  if (risks.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-4 py-3">
        <span className="font-medium">No risk findings detected.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {risks.map((risk) => (
        <div key={risk.id} className="border border-neutral-200 rounded-md px-4 py-3 space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLES[risk.severity]}`}
            >
              {SEVERITY_LABEL[risk.severity]}
            </span>
            <span className="text-sm font-medium text-neutral-800">{risk.title}</span>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">{risk.description}</p>
          {risk.affectedVenues && risk.affectedVenues.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {risk.affectedVenues.map((venue) => (
                <span
                  key={venue}
                  className="inline-block rounded px-1.5 py-0.5 text-xs bg-neutral-100 text-neutral-500 font-mono"
                >
                  {venue}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
