import type { Recommendation } from "@tarani/shared";

interface Props {
  recommendations: Recommendation[];
}

export function RecommendationList({ recommendations }: Props) {
  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {recommendations.map((rec, i) => (
        <div
          key={rec.id}
          className="border border-neutral-200 rounded-lg px-4 py-3 space-y-1.5 hover:border-neutral-300 transition-colors"
        >
          <div className="flex items-start gap-3">
            <span className="shrink-0 h-5 w-5 rounded-full bg-neutral-100 text-neutral-500 text-xs font-semibold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800">{rec.title}</p>
              <p className="text-xs text-neutral-500 leading-relaxed">{rec.description}</p>
              {rec.links && rec.links.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-1">
                  {rec.links.map((link) => (
                    <a
                      key={link}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <span>↗</span>
                      <span className="break-all">{link}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
