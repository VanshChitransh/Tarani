import type { CompatibilityEvidence, VenueCompatibilityResult } from "@tarani/shared";
import type { VenueAdapter, AdapterInput } from "./types";
import { evaluateRule } from "./evaluator";
import { PRELAUNCH_MINT_SENTINEL } from "../prelaunch";

const ORCA_WHIRLPOOL_LIST_API = "https://api.mainnet.orca.so/v1/whirlpool/list";

// Staleness bound for the process-wide whirlpool cache. A pool result may be up
// to this many ms out of date — acceptable by design, since pool existence
// changes slowly and re-downloading the ~18MB list per evaluation is far worse.
// Operators can shorten the window (e.g. during a launch) via env.
const ORCA_CACHE_TTL_MS =
  parseInt(process.env.ORCA_WHIRLPOOL_CACHE_TTL_MS ?? "", 10) || 5 * 60 * 1000;

interface OrcaWhirlpool {
  tokenA?: { mint?: string };
  tokenB?: { mint?: string };
}

// The whirlpool list (~18MB) is global and changes slowly. Cache it process-wide with a
// short TTL so repeated reports reuse one fetch instead of re-downloading per evaluation.
// A single in-flight promise also collapses concurrent requests into one network call.
let orcaCache: { pools: OrcaWhirlpool[]; fetchedAt: number } | null = null;
let orcaInFlight: Promise<OrcaWhirlpool[] | null> | null = null;

async function fetchOrcaWhirlpools(now: number): Promise<OrcaWhirlpool[] | null> {
  if (orcaCache && now - orcaCache.fetchedAt < ORCA_CACHE_TTL_MS) {
    return orcaCache.pools;
  }
  if (orcaInFlight) return orcaInFlight;

  orcaInFlight = (async () => {
    try {
      const res = await fetch(ORCA_WHIRLPOOL_LIST_API, { signal: AbortSignal.timeout(8_000) });
      if (!res.ok) return null;
      const data = (await res.json()) as { whirlpools?: OrcaWhirlpool[] };
      const pools = data.whirlpools ?? [];
      orcaCache = { pools, fetchedAt: now };
      return pools;
    } catch {
      return null;
    } finally {
      orcaInFlight = null;
    }
  })();

  return orcaInFlight;
}

// Test-only: reset the module cache so stubbed fetches aren't shadowed by a prior run.
export function __resetOrcaCache(): void {
  orcaCache = null;
  orcaInFlight = null;
}

export async function probeOrcaPool(mint: string): Promise<"pool_exists" | "no_pool" | "unknown"> {
  const pools = await fetchOrcaWhirlpools(Date.now());
  if (pools === null) return "unknown";
  const found = pools.some((p) => p.tokenA?.mint === mint || p.tokenB?.mint === mint);
  return found ? "pool_exists" : "no_pool";
}

export const orcaAdapter: VenueAdapter = {
  venue: "orca",
  async evaluate(input: AdapterInput): Promise<VenueCompatibilityResult> {
    return runOrcaCompatibility(input);
  },
};

export async function runOrcaCompatibility(
  input: AdapterInput,
  opts: { skipProbe?: boolean } = {},
): Promise<VenueCompatibilityResult> {
  const base = evaluateRule(input.profile, input.rule);

  if (opts.skipProbe || input.profile.mint === PRELAUNCH_MINT_SENTINEL) {
    return base;
  }

  const probeResult = await probeOrcaPool(input.profile.mint);
  if (probeResult === "unknown") return base;

  const probeEvidence: CompatibilityEvidence = {
    kind: "probe",
    reference: "Orca Whirlpool List API v1",
    snippet:
      probeResult === "pool_exists"
        ? "A live Orca Whirlpool exists for this mint."
        : "No Orca Whirlpool found for this mint.",
    observedAt: new Date().toISOString(),
  };

  const evidence = [...base.evidence, probeEvidence];

  // A live pool proves the conditional setup has actually been done: upgrade to supported.
  if (probeResult === "pool_exists" && base.status === "conditional") {
    return { ...base, source: "probe", status: "supported", evidence };
  }

  return { ...base, source: "probe", evidence };
}
