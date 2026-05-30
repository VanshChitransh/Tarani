import type { AnalyzeReport } from "@tarani/shared";
import { CompatibilityMatrix } from "../../../components/CompatibilityMatrix";
import { RiskSection } from "../../../components/RiskSection";
import { RecommendationList } from "../../../components/RecommendationList";
import { SimulationSection } from "../../../components/SimulationSection";
import { MonitorButton } from "../../../components/MonitorButton";
import { BadgeSection } from "../../../components/BadgeSection";
import { CopyButton } from "../../../components/CopyButton";

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

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">
      {children}
    </h2>
  );
}

export default async function ReportPage({ params }: Props) {
  const { mint } = await params;
  const result = await fetchReport(mint);

  if ("error" in result) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="border border-red-200 bg-red-50 rounded-lg px-5 py-4">
          <p className="text-sm font-medium text-red-700">Failed to load report</p>
          <p className="text-xs text-red-500 mt-1">{result.error}</p>
        </div>
      </main>
    );
  }

  const { name, symbol } = result.profile.metadata;

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      {/* Header */}
      <div className="pb-8 border-b border-neutral-100">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            {name ? (
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{name}</h1>
                {symbol && (
                  <span className="text-sm font-mono font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                    {symbol}
                  </span>
                )}
              </div>
            ) : (
              <h1 className="text-xl font-semibold text-neutral-900 mb-1">Compatibility Report</h1>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-400 font-mono break-all">{mint}</span>
              <CopyButton text={mint} />
            </div>
          </div>
        </div>

        {result.profile.extensions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {result.profile.extensions.map((e) => (
              <span
                key={e.kind}
                className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100"
              >
                {e.kind}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Venue Compatibility */}
      <section>
        <SectionHeader>Venue Compatibility</SectionHeader>
        <CompatibilityMatrix results={result.compatibility} />
      </section>

      {/* Risk Findings */}
      <section>
        <SectionHeader>Risk Findings</SectionHeader>
        <RiskSection risks={result.risks} />
      </section>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <section>
          <SectionHeader>Recommendations</SectionHeader>
          <RecommendationList recommendations={result.recommendations} />
        </section>
      )}

      {/* Simulation */}
      <section>
        <SectionHeader>Simulation</SectionHeader>
        <p className="text-xs text-neutral-400 mb-3">
          Run test transactions against a validator seeded with this mint&apos;s state.
        </p>
        <SimulationSection mint={mint} />
      </section>

      {/* Track + Badge — side by side on wide screens */}
      <div className="grid sm:grid-cols-2 gap-8 pt-2 border-t border-neutral-100">
        <section>
          <SectionHeader>Track This Mint</SectionHeader>
          <p className="text-xs text-neutral-400 mb-3">Get alerted when compatibility changes.</p>
          <MonitorButton mint={mint} />
        </section>

        <section>
          <SectionHeader>Embed Badge</SectionHeader>
          <BadgeSection mint={mint} />
        </section>
      </div>

      {/* Token Info */}
      <section className="border-t border-neutral-100 pt-8">
        <SectionHeader>Token Info</SectionHeader>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="bg-neutral-50 rounded-lg px-3 py-2.5">
            <dt className="text-xs text-neutral-400 mb-0.5">Decimals</dt>
            <dd className="font-medium text-neutral-800">{result.profile.decimals}</dd>
          </div>
          <div className="bg-neutral-50 rounded-lg px-3 py-2.5">
            <dt className="text-xs text-neutral-400 mb-0.5">Metadata</dt>
            <dd className="font-medium text-neutral-800 capitalize">
              {result.profile.metadata.quality}
            </dd>
          </div>
          <div className="bg-neutral-50 rounded-lg px-3 py-2.5">
            <dt className="text-xs text-neutral-400 mb-0.5">Extensions</dt>
            <dd className="font-medium text-neutral-800">
              {result.profile.extensions.length === 0 ? "None" : result.profile.extensions.length}
            </dd>
          </div>
          <div className="bg-neutral-50 rounded-lg px-3 py-2.5 col-span-2 sm:col-span-1">
            <dt className="text-xs text-neutral-400 mb-0.5">Program</dt>
            <dd className="font-mono text-xs text-neutral-600 break-all">
              {result.profile.programId.slice(0, 16)}…
            </dd>
          </div>
        </dl>
      </section>

      <p className="text-xs text-neutral-300">
        Generated {new Date(result.generatedAt).toLocaleString()}
      </p>
    </main>
  );
}
