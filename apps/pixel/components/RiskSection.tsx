import type { RiskFinding } from "@tarani/shared";

const SEVERITY_LEFT: Record<RiskFinding["severity"], string> = {
  critical: "border-l-red-500",
  high: "border-l-orange-400",
  medium: "border-l-yellow-400",
  low: "border-l-blue-400",
  info: "border-l-neutral-300",
};

const SEVERITY_BADGE: Record<RiskFinding["severity"], string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-blue-100 text-blue-700",
  info: "bg-neutral-100 text-neutral-500",
};

const SEVERITY_LABEL: Record<RiskFinding["severity"], string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

const SEVERITY_ORDER: RiskFinding["severity"][] = ["critical", "high", "medium", "low", "info"];

interface Props {
  risks: RiskFinding[];
}

export function RiskSection({ risks }: Props) {
  if (risks.length === 0) {
    return (
      <div className="flex items-center gap-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3.5">
        <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
        <span className="font-medium">No risk findings — this mint looks clean.</span>
      </div>
    );
  }

  const sorted = [...risks].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );

  return (
    <div className="space-y-2.5">
      {sorted.map((risk) => (
        <div
          key={risk.id}
          className={`border border-neutral-200 border-l-4 ${SEVERITY_LEFT[risk.severity]} rounded-lg px-4 py-3 space-y-1.5`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${SEVERITY_BADGE[risk.severity]}`}
            >
              {SEVERITY_LABEL[risk.severity]}
            </span>
            <span className="text-sm font-medium text-neutral-800">{risk.title}</span>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">{risk.description}</p>
          {risk.affectedVenues && risk.affectedVenues.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
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
