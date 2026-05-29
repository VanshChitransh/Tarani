import type { AnalyzeReport } from "@tarani/shared";
import { CompatibilityMatrix } from "../../../components/CompatibilityMatrix";
import { RiskSection } from "../../../components/RiskSection";
import { RecommendationList } from "../../../components/RecommendationList";
import { SimulationSection } from "../../../components/SimulationSection";
import { MonitorButton } from "../../../components/MonitorButton";
import { BadgeSection } from "../../../components/BadgeSection";

interface Props {
  params: Promise<{ mint: string }>;
}

async function fetchReport(mint: string): Promise<AnalyzeReport | { error: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mint }),
    cache: "no-store",
  });
  const json = (await res.json()) as
    | { ok: true; data: AnalyzeReport }
    | { ok: false; error: { message: string } };
  if (!json.ok) return { error: json.error.message };
  return json.data;
}

export default async function ReportPage({ params }: Props) {
  const { mint } = await params;
  const result = await fetchReport(mint);

  if ("error" in result) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-red-600 font-medium">Error: {result.error}</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Compatibility Report</h1>
        <p className="text-sm text-neutral-500 font-mono break-all">{result.profile.mint}</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-3">
          Venue Compatibility
        </h2>
        <CompatibilityMatrix results={result.compatibility} />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-3">
          Risk Findings
        </h2>
        <RiskSection risks={result.risks} />
      </section>

      {result.recommendations.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-3">
            Recommendations
          </h2>
          <RecommendationList recommendations={result.recommendations} />
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-3">
          Simulation
        </h2>
        <SimulationSection mint={mint} />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-3">
          Track This Mint
        </h2>
        <MonitorButton mint={mint} />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-3">
          Embed Badge
        </h2>
        <BadgeSection mint={mint} />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-3">
          Token Info
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="text-neutral-500">Program</dt>
            <dd className="font-mono text-xs text-neutral-700 break-all">
              {result.profile.programId}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Decimals</dt>
            <dd>{result.profile.decimals}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Extensions</dt>
            <dd>
              {result.profile.extensions.length === 0
                ? "None"
                : result.profile.extensions.map((e) => e.kind).join(", ")}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Metadata quality</dt>
            <dd className="capitalize">{result.profile.metadata.quality}</dd>
          </div>
        </dl>
      </section>

      <p className="text-xs text-neutral-400">
        Generated at {new Date(result.generatedAt).toLocaleString()}
      </p>
    </main>
  );
}
