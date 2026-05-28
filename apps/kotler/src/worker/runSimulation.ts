import type { SimulationReport, SimulationRequest, ScenarioKind } from "@tarani/shared";
import { HeliusClient, parseMintProfile } from "@tarani/gilfoyle";
import { isValidatorBinaryAvailable, ValidatorBootTimeoutError } from "../validator/lifecycle";
import { runHeuristic } from "./heuristicRunner";
import { runLive } from "./liveRunner";

const DEFAULT_SCENARIOS: ScenarioKind[] = [
  "transfer",
  "transfer_hook",
  "transfer_fee",
  "memo_required",
  "metadata_check",
];

export async function runSimulation(request: SimulationRequest): Promise<SimulationReport> {
  const scenarios = request.scenarios ?? DEFAULT_SCENARIOS;

  const client = new HeliusClient();
  const asset = await client.fetchMintAsset(request.mint);
  const profile = parseMintProfile(asset);

  const forceHeuristic = process.env.KOTLER_FORCE_HEURISTIC === "true";
  const validatorAvailable = forceHeuristic ? false : await isValidatorBinaryAvailable();

  let results;
  let validatorMode: "live" | "heuristic";

  if (validatorAvailable) {
    try {
      results = await runLive(profile, scenarios);
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
