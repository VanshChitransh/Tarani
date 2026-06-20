import type { ScenarioResult } from "@tarani/shared";
import { probeJupiterRoute, PRELAUNCH_MINT_SENTINEL } from "@tarani/gilfoyle";
import type { ScenarioEntry, HeuristicContext, LiveContext } from "./types";

function heuristic({ profile }: HeuristicContext): ScenarioResult {
  const start = Date.now();
  const kinds = profile.extensions.map((e) => e.kind);

  if (kinds.includes("nonTransferable")) {
    return {
      id: crypto.randomUUID(),
      kind: "swap",
      outcome: "blocked",
      mode: "analysis",
      summary: "Token is non-transferable. Swaps require token transfers and will always fail.",
      durationMs: Date.now() - start,
      failureCode: "NON_TRANSFERABLE",
    };
  }
  if (kinds.includes("transferFeeConfig")) {
    return {
      id: crypto.randomUUID(),
      kind: "swap",
      outcome: "warning",
      mode: "analysis",
      summary:
        "Token has a transfer fee. DEX quotes may not account for fees withheld on each swap leg.",
      durationMs: Date.now() - start,
    };
  }
  if (kinds.includes("transferHook")) {
    return {
      id: crypto.randomUUID(),
      kind: "swap",
      outcome: "warning",
      mode: "analysis",
      summary:
        "Token has a transfer hook. The hook executes on every swap transaction and may reject it.",
      durationMs: Date.now() - start,
    };
  }
  if (kinds.includes("pausable")) {
    return {
      id: crypto.randomUUID(),
      kind: "swap",
      outcome: "warning",
      mode: "analysis",
      summary: "Token has the pausable extension. Swaps can be blocked by the issuer at any time.",
      durationMs: Date.now() - start,
    };
  }

  return {
    id: crypto.randomUUID(),
    kind: "swap",
    outcome: "success",
    mode: "analysis",
    summary: "No swap-blocking extensions detected.",
    durationMs: Date.now() - start,
  };
}

// This is NOT a validator transaction — Tarani does not stand up a DEX program +
// pool on the throwaway validator. It queries the live Jupiter Quote API for a
// real route, so the result is reported with mode "api" (the UI labels it as an
// API probe, not a simulated swap). On an inconclusive probe it degrades to the
// static heuristic (mode "analysis").
async function live({ profile }: LiveContext): Promise<ScenarioResult> {
  const start = Date.now();

  if (profile.mint === PRELAUNCH_MINT_SENTINEL) {
    return heuristic({ profile });
  }

  const result = await probeJupiterRoute(profile.mint);

  if (result === "route_available") {
    return {
      id: crypto.randomUUID(),
      kind: "swap",
      outcome: "success",
      mode: "api",
      summary: "Jupiter Quote API confirmed a live swap route exists for this mint.",
      durationMs: Date.now() - start,
    };
  }
  if (result === "no_route") {
    return {
      id: crypto.randomUUID(),
      kind: "swap",
      outcome: "blocked",
      mode: "api",
      summary: "Jupiter Quote API returned no route for this mint.",
      durationMs: Date.now() - start,
      failureCode: "NO_SWAP_ROUTE",
    };
  }

  return heuristic({ profile });
}

export const swapScenario: ScenarioEntry = {
  kind: "swap",
  heuristic,
  live,
};
