import type { MintProfile, ScenarioKind, ScenarioResult } from "@tarani/shared";
import { SCENARIO_REGISTRY } from "../scenarios";

export function runHeuristic(profile: MintProfile, scenarios: ScenarioKind[]): ScenarioResult[] {
  return scenarios.flatMap((kind) => {
    const entry = SCENARIO_REGISTRY[kind];
    if (!entry) return [];
    return [entry.heuristic({ profile })];
  });
}
