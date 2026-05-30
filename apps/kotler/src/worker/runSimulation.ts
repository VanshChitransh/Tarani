import type {
  SimulationReport,
  SimulationRequest,
  ScenarioKind,
  MintProfile,
} from "@tarani/shared";
import { HeliusClient, parseMintProfile } from "@tarani/gilfoyle";
import { findValidatorBinary, ValidatorBootTimeoutError } from "../validator/lifecycle";
import { runHeuristic } from "./heuristicRunner";
import { runLive } from "./liveRunner";

// Baseline scenarios that apply to every mint regardless of extensions.
const BASELINE_SCENARIOS: ScenarioKind[] = [
  "transfer",
  "associated_token_create",
  "metadata_check",
  "freeze_check",
  "swap",
  "wrap_sol",
];

/**
 * Choose which scenarios to run for a given mint. Always runs the baseline, then
 * adds extension-specific scenarios only when the relevant extension is present
 * — so a plain mint no longer wastes a transfer-hook run, and a fee token always
 * gets its fee scenario.
 */
export function selectScenarios(profile: MintProfile): ScenarioKind[] {
  const kinds = new Set(profile.extensions.map((e) => e.kind));
  const selected = [...BASELINE_SCENARIOS];
  if (kinds.has("transferFeeConfig")) selected.push("transfer_fee");
  if (kinds.has("transferHook")) selected.push("transfer_hook");
  if (kinds.has("memoTransfer")) selected.push("memo_required");
  return selected;
}

export async function runSimulation(request: SimulationRequest): Promise<SimulationReport> {
  const client = new HeliusClient();
  const asset = await client.fetchMintAsset(request.mint);
  const profile = parseMintProfile(asset);

  // Honor an explicit scenario list from the caller; otherwise auto-select by
  // the mint's detected extensions.
  const scenarios = request.scenarios ?? selectScenarios(profile);

  const forceHeuristic = process.env.KOTLER_FORCE_HEURISTIC === "true";
  const validatorBinary = forceHeuristic ? null : findValidatorBinary();

  if (validatorBinary) {
    console.log(`[kotler] Using validator binary: ${validatorBinary}`);
  } else {
    console.log("[kotler] solana-test-validator not found — using heuristic mode");
  }

  let results;
  let validatorMode: "live" | "heuristic";

  if (validatorBinary) {
    try {
      results = await runLive(profile, scenarios, validatorBinary);
      validatorMode = "live";
    } catch (err) {
      if (err instanceof ValidatorBootTimeoutError) {
        console.warn("[kotler] Validator boot timed out — falling back to heuristic mode");
        results = runHeuristic(profile, scenarios);
        validatorMode = "heuristic";
      } else {
        throw err;
      }
    }
  } else {
    results = runHeuristic(profile, scenarios);
    validatorMode = "heuristic";
  }

  return {
    mint: request.mint,
    results,
    validatorMode,
    generatedAt: new Date().toISOString(),
  };
}
