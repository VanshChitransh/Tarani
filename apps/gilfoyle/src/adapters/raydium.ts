import type { CompatibilityEvidence, VenueCompatibilityResult } from "@tarani/shared";
import type { VenueAdapter, AdapterInput } from "./types";
import { evaluateRule } from "./evaluator";
import { PRELAUNCH_MINT_SENTINEL } from "../prelaunch";

const RAYDIUM_PAIRS_API = "https://api.raydium.io/v2/main/pairs";

export async function probeRaydiumPool(
  mint: string,
): Promise<"pool_exists" | "no_pool" | "unknown"> {
  try {
    const res = await fetch(RAYDIUM_PAIRS_API, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return "unknown";
    const pairs = (await res.json()) as { baseMint: string; quoteMint: string }[];
    const found = pairs.some((p) => p.baseMint === mint || p.quoteMint === mint);
    return found ? "pool_exists" : "no_pool";
  } catch {
    return "unknown";
  }
}

export const raydiumAdapter: VenueAdapter = {
  venue: "raydium",
  async evaluate(input: AdapterInput): Promise<VenueCompatibilityResult> {
    return evaluateRule(input.profile, input.rule);
  },
};

export async function runRaydiumCompatibility(
  input: AdapterInput,
  opts: { skipProbe?: boolean } = {},
): Promise<VenueCompatibilityResult> {
  const base = evaluateRule(input.profile, input.rule);

  if (opts.skipProbe || input.profile.mint === PRELAUNCH_MINT_SENTINEL) {
    return base;
  }

  const probeResult = await probeRaydiumPool(input.profile.mint);
  if (probeResult === "unknown") return base;

  const probeEvidence: CompatibilityEvidence = {
    kind: "probe",
    reference: "Raydium Pairs API v2",
    snippet:
      probeResult === "pool_exists"
        ? "A Raydium liquidity pool exists for this mint."
        : "No Raydium liquidity pool found for this mint.",
    observedAt: new Date().toISOString(),
  };

  return { ...base, evidence: [...base.evidence, probeEvidence] };
}
