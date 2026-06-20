import type { ScenarioResult } from "@tarani/shared";
import { probeRaydiumPool, PRELAUNCH_MINT_SENTINEL } from "@tarani/gilfoyle";
import type { ScenarioEntry, HeuristicContext, LiveContext } from "./types";

function heuristic({ profile }: HeuristicContext): ScenarioResult {
  const start = Date.now();
  const kinds = profile.extensions.map((e) => e.kind);

  if (kinds.includes("nonTransferable")) {
    return {
      id: crypto.randomUUID(),
      kind: "wrap_sol",
      outcome: "blocked",
      mode: "analysis",
      summary: "Token is non-transferable. It cannot be deposited into any liquidity pool.",
      durationMs: Date.now() - start,
      failureCode: "NON_TRANSFERABLE",
    };
  }
  if (kinds.includes("transferHook")) {
    return {
      id: crypto.randomUUID(),
      kind: "wrap_sol",
      outcome: "warning",
      mode: "analysis",
      summary:
        "Token has a transfer hook. The hook executes on pool deposits and withdrawals and may reject them.",
      durationMs: Date.now() - start,
    };
  }

  return {
    id: crypto.randomUUID(),
    kind: "wrap_sol",
    outcome: "success",
    mode: "analysis",
    summary: "No pool-blocking extensions detected.",
    durationMs: Date.now() - start,
  };
}

// NOT a validator transaction — Tarani does not deploy an AMM + pool on the
// throwaway validator. It checks the live Raydium Pools API for a real
// SOL-paired pool, so the result is reported with mode "api". On an inconclusive
// probe it degrades to the static heuristic (mode "analysis").
async function live({ profile }: LiveContext): Promise<ScenarioResult> {
  const start = Date.now();

  if (profile.mint === PRELAUNCH_MINT_SENTINEL) {
    return heuristic({ profile });
  }

  const result = await probeRaydiumPool(profile.mint);

  if (result === "pool_exists") {
    return {
      id: crypto.randomUUID(),
      kind: "wrap_sol",
      outcome: "success",
      mode: "api",
      summary: "A Raydium SOL-paired pool exists for this mint.",
      durationMs: Date.now() - start,
    };
  }
  if (result === "no_pool") {
    return {
      id: crypto.randomUUID(),
      kind: "wrap_sol",
      outcome: "warning",
      mode: "api",
      summary: "No Raydium pool found for this mint yet. Pool creation is not blocked.",
      durationMs: Date.now() - start,
    };
  }

  return heuristic({ profile });
}

export const wrapSolScenario: ScenarioEntry = {
  kind: "wrap_sol",
  heuristic,
  live,
};
