import type { ScenarioResult } from "@tarani/shared";
import type { ScenarioEntry, HeuristicContext, LiveContext } from "./types";

function heuristic({ profile }: HeuristicContext): ScenarioResult {
  const start = Date.now();

  const defaultsFrozen = profile.extensions.some((e) => e.kind === "defaultAccountState");
  if (defaultsFrozen) {
    return {
      id: crypto.randomUUID(),
      kind: "freeze_check",
      outcome: "warning",
      summary:
        "DefaultAccountState is set: new token accounts are created frozen and must be thawed by the freeze authority before they can transfer.",
      durationMs: Date.now() - start,
      failureCode: "DEFAULT_FROZEN",
    };
  }

  if (!profile.authorities.freeze.isRenounced) {
    return {
      id: crypto.randomUUID(),
      kind: "freeze_check",
      outcome: "warning",
      summary:
        "Freeze authority is active: the issuer can freeze any holder account at any time, blocking transfers until thawed.",
      durationMs: Date.now() - start,
    };
  }

  return {
    id: crypto.randomUUID(),
    kind: "freeze_check",
    outcome: "success",
    summary:
      "No freeze authority and no default-frozen state: holder accounts cannot be frozen by the issuer.",
    durationMs: Date.now() - start,
  };
}

// Freeze behavior is fully determined by mint configuration (freeze authority +
// DefaultAccountState), which the structure-equivalent validator mint does not
// faithfully replicate — it is created with a null freeze authority. So the live
// path reports the same analysis as the heuristic, rather than fabricating a
// freeze it cannot actually perform. This mirrors metadata_check's live path.
async function live(ctx: LiveContext): Promise<ScenarioResult> {
  return heuristic({ profile: ctx.profile });
}

export const freezeCheckScenario: ScenarioEntry = {
  kind: "freeze_check",
  heuristic,
  live,
};
