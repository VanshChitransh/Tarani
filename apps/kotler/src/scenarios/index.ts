import type { ScenarioKind } from "@tarani/shared";
import type { ScenarioEntry } from "./types";
import { transferScenario } from "./transfer";
import { transferHookScenario } from "./transferHook";
import { transferFeeScenario } from "./transferFee";
import { memoRequiredScenario } from "./memoRequired";
import { metadataCheckScenario } from "./metadataCheck";
import { swapScenario } from "./swap";
import { wrapSolScenario } from "./wrapSol";

export const SCENARIO_REGISTRY: Partial<Record<ScenarioKind, ScenarioEntry>> = {
  transfer: transferScenario,
  transfer_hook: transferHookScenario,
  transfer_fee: transferFeeScenario,
  memo_required: memoRequiredScenario,
  metadata_check: metadataCheckScenario,
  swap: swapScenario,
  wrap_sol: wrapSolScenario,
};
