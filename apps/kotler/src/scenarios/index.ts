import type { ScenarioKind, ScenarioResult } from "@tarani/shared";
import type { ScenarioEntry } from "./types";
import { transferScenario } from "./transfer";
import { transferHookScenario } from "./transferHook";
import { transferFeeScenario } from "./transferFee";
import { memoRequiredScenario } from "./memoRequired";
import { metadataCheckScenario } from "./metadataCheck";
import { swapScenario } from "./swap";
import { wrapSolScenario } from "./wrapSol";
import { associatedTokenCreateScenario } from "./associatedTokenCreate";
import { freezeCheckScenario } from "./freezeCheck";

export const SCENARIO_REGISTRY: Partial<Record<ScenarioKind, ScenarioEntry>> = {
  transfer: transferScenario,
  transfer_hook: transferHookScenario,
  transfer_fee: transferFeeScenario,
  memo_required: memoRequiredScenario,
  metadata_check: metadataCheckScenario,
  swap: swapScenario,
  wrap_sol: wrapSolScenario,
  associated_token_create: associatedTokenCreateScenario,
  freeze_check: freezeCheckScenario,
};

/**
 * Result returned when a requested scenario kind has no registered
 * implementation. Surfaces the gap explicitly instead of silently dropping the
 * scenario (which made a valid request quietly produce nothing).
 */
export function unimplementedScenario(kind: ScenarioKind): ScenarioResult {
  return {
    id: crypto.randomUUID(),
    kind,
    outcome: "error",
    summary: `Scenario "${kind}" is not implemented.`,
    durationMs: 0,
    failureCode: "NOT_IMPLEMENTED",
  };
}
