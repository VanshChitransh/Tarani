import type { MintProfile, ScenarioKind, ScenarioResult } from "@tarani/shared";
import { SCENARIO_REGISTRY, unimplementedScenario } from "../scenarios";

export function runHeuristic(profile: MintProfile, scenarios: ScenarioKind[]): ScenarioResult[] {
  return scenarios.map((kind) => {
    const entry = SCENARIO_REGISTRY[kind];
    if (!entry) return unimplementedScenario(kind);
    return entry.heuristic({ profile });
  });
}
