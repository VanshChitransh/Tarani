import type { CompatibilityEvidence, VenueCompatibilityResult } from "@tarani/shared";
import type { VenueAdapter, AdapterInput } from "./types";
import { evaluateRule } from "./evaluator";
import { PRELAUNCH_MINT_SENTINEL } from "../prelaunch";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const JUPITER_QUOTE_API = "https://quote-api.jup.ag/v6/quote";

export async function probeJupiterRoute(
  mint: string,
): Promise<"route_available" | "no_route" | "unknown"> {
  try {
    const url = `${JUPITER_QUOTE_API}?inputMint=${mint}&outputMint=${USDC_MINT}&amount=1000000&slippageBps=50`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return "no_route";
    const data = (await res.json()) as { outAmount?: string };
    return data.outAmount ? "route_available" : "no_route";
  } catch {
    return "unknown";
  }
}

export const jupiterAdapter: VenueAdapter = {
  venue: "jupiter",
  async evaluate(input: AdapterInput): Promise<VenueCompatibilityResult> {
    return runJupiterCompatibility(input);
  },
};

export async function runJupiterCompatibility(
  input: AdapterInput,
  opts: { skipProbe?: boolean } = {},
): Promise<VenueCompatibilityResult> {
  const base = evaluateRule(input.profile, input.rule);

  if (opts.skipProbe || input.profile.mint === PRELAUNCH_MINT_SENTINEL) {
    return base;
  }

  const probeResult = await probeJupiterRoute(input.profile.mint);
  if (probeResult === "unknown") return base;

  const probeEvidence: CompatibilityEvidence = {
    kind: "probe",
    reference: "Jupiter Quote API v6",
    snippet:
      probeResult === "route_available"
        ? "Jupiter Quote API returned a valid swap route for this mint."
        : "Jupiter Quote API returned no route for this mint.",
    observedAt: new Date().toISOString(),
  };

  const evidence = [...base.evidence, probeEvidence];

  if (probeResult === "no_route" && base.status === "supported") {
    return { ...base, status: "partial", evidence };
  }

  return { ...base, evidence };
}
