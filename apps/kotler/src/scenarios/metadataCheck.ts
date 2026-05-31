import type { ScenarioResult } from "@tarani/shared";
import type { ScenarioEntry, HeuristicContext, LiveContext } from "./types";

function heuristic({ profile }: HeuristicContext): ScenarioResult {
  const start = Date.now();
  const { metadata } = profile;

  if (metadata.quality === "missing") {
    return {
      id: crypto.randomUUID(),
      kind: "metadata_check",
      outcome: "blocked",
      mode: "analysis",
      summary:
        "Token has no metadata. Name, symbol, and URI are all missing. Wallets and explorers will display this token as unknown.",
      durationMs: Date.now() - start,
      failureCode: "NO_METADATA",
    };
  }

  const missing: string[] = [];
  if (!metadata.name) missing.push("name");
  if (!metadata.symbol) missing.push("symbol");
  if (!metadata.uri) missing.push("uri");

  if (missing.length > 0) {
    return {
      id: crypto.randomUUID(),
      kind: "metadata_check",
      outcome: "warning",
      mode: "analysis",
      summary: `Metadata is incomplete. Missing fields: ${missing.join(", ")}. Some venues may display this token incorrectly or reject it.`,
      durationMs: Date.now() - start,
      failureCode: "INCOMPLETE_METADATA",
    };
  }

  if (metadata.quality === "partial") {
    return {
      id: crypto.randomUUID(),
      kind: "metadata_check",
      outcome: "warning",
      mode: "analysis",
      summary:
        "Metadata fields are present but quality is partial (e.g., placeholder values or non-resolving URI). Verify name, symbol, and URI resolve correctly.",
      durationMs: Date.now() - start,
    };
  }

  return {
    id: crypto.randomUUID(),
    kind: "metadata_check",
    outcome: "success",
    mode: "analysis",
    summary: `Metadata is complete. Name: "${metadata.name}", Symbol: "${metadata.symbol}". Token should render correctly across wallets and explorers.`,
    durationMs: Date.now() - start,
  };
}

// Metadata is fully determined by the parsed profile — there is no validator
// state to exercise, so the live path returns the same static analysis. It is
// reported with mode "analysis" so the UI never implies a validator tx ran.
async function live(ctx: LiveContext): Promise<ScenarioResult> {
  return heuristic({ profile: ctx.profile });
}

export const metadataCheckScenario: ScenarioEntry = {
  kind: "metadata_check",
  heuristic,
  live,
};
