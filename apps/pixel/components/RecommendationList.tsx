import type { Recommendation } from "@tarani/shared";

interface Props {
  recommendations: Recommendation[];
}

export function RecommendationList({ recommendations }: Props) {
  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => (
        <div key={rec.id} className="border border-neutral-200 rounded-md px-4 py-3 space-y-1.5">
          <p className="text-sm font-medium text-neutral-800">{rec.title}</p>
          <p className="text-xs text-neutral-500 leading-relaxed">{rec.description}</p>
          {rec.links && rec.links.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {rec.links.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline break-all"
                >
                  {link}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
