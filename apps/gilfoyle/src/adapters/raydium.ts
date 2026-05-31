import type { CompatibilityEvidence, VenueCompatibilityResult } from "@tarani/shared";
import type { VenueAdapter, AdapterInput } from "./types";
import { evaluateRule } from "./evaluator";
import { reconcileProbe } from "./probeReconcile";
import { PRELAUNCH_MINT_SENTINEL } from "../prelaunch";

// Mint-scoped v3 endpoint: returns only pools containing this mint (~few KB, sub-second).
// The legacy /v2/main/pairs firehose is ~238MB and times out — never use it for a probe.
const RAYDIUM_MINT_POOLS_API = "https://api-v3.raydium.io/pools/info/mint";

export async function probeRaydiumPool(
  mint: string,
): Promise<"pool_exists" | "no_pool" | "unknown"> {
  try {
    const url =
      `${RAYDIUM_MINT_POOLS_API}?mint1=${mint}` +
      `&poolType=all&poolSortField=default&sortType=desc&pageSize=1&page=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return "unknown";
    const body = (await res.json()) as {
      success?: boolean;
      data?: { count?: number; data?: unknown[] };
    };
    if (!body.success || !body.data) return "unknown";
    const count = body.data.count ?? body.data.data?.length ?? 0;
    return count > 0 ? "pool_exists" : "no_pool";
  } catch {
    return "unknown";
  }
}

export const raydiumAdapter: VenueAdapter = {
  venue: "raydium",
  async evaluate(input: AdapterInput): Promise<VenueCompatibilityResult> {
    return runRaydiumCompatibility(input);
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
    reference: "Raydium Pools API v3",
    snippet:
      probeResult === "pool_exists"
        ? "A live Raydium liquidity pool exists for this mint."
        : "No Raydium liquidity pool found for this mint.",
    observedAt: new Date().toISOString(),
  };

  const presence = probeResult === "pool_exists" ? "exists" : "absent";
  return reconcileProbe(base, presence, probeEvidence);
}
