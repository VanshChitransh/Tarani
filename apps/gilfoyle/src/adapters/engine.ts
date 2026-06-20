import type { MintProfile, VenueCompatibilityResult } from "@tarani/shared";
import { VENUE_IDS } from "@tarani/shared";
import { loadAllVenueRules } from "../rules";
import { jupiterAdapter } from "./jupiter";
import { orcaAdapter } from "./orca";
import { phantomAdapter } from "./phantom";
import { raydiumAdapter } from "./raydium";
import { solanaExplorerAdapter } from "./solana-explorer";
import { solflareAdapter } from "./solflare";
import { solscanAdapter } from "./solscan";
import type { VenueAdapter } from "./types";
import { OVERRIDES, applyOverride } from "./overrides";

const ADAPTERS: Record<(typeof VENUE_IDS)[number], VenueAdapter> = {
  jupiter: jupiterAdapter,
  raydium: raydiumAdapter,
  orca: orcaAdapter,
  phantom: phantomAdapter,
  solflare: solflareAdapter,
  solscan: solscanAdapter,
  "solana-explorer": solanaExplorerAdapter,
};

export async function runCompatibilityEngine(
  profile: MintProfile,
): Promise<VenueCompatibilityResult[]> {
  const rules = loadAllVenueRules();
  return Promise.all(
    VENUE_IDS.map(async (venue) => {
      const base = await ADAPTERS[venue].evaluate({ profile, rule: rules[venue] });
      return applyOverride(base, profile, OVERRIDES);
    }),
  );
}
