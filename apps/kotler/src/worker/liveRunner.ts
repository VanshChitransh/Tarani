import type { MintProfile, ScenarioKind, ScenarioResult } from "@tarani/shared";
import { SCENARIO_REGISTRY, unimplementedScenario } from "../scenarios";
import {
  findFreePort,
  startValidator,
  waitForValidator,
  stopValidator,
} from "../validator/lifecycle";
import { createStructureEquivalentMint } from "../validator/mintSetup";

function extractHookProgramAddress(profile: MintProfile): string | undefined {
  const hookExt = profile.extensions.find((e) => e.kind === "transferHook");
  if (!hookExt) return undefined;
  const addr = hookExt.parameters["programId"];
  return typeof addr === "string" && addr.length > 0 ? addr : undefined;
}

export async function runLive(
  profile: MintProfile,
  scenarios: ScenarioKind[],
  binary = "solana-test-validator",
): Promise<ScenarioResult[]> {
  const port = await findFreePort(8899);
  const rpcUrl = `http://127.0.0.1:${port}`;

  const hookProgram = extractHookProgramAddress(profile);
  const cloneAddresses = hookProgram ? [hookProgram] : [];

  const proc = await startValidator(port, cloneAddresses, binary);

  try {
    await waitForValidator(port);

    const { mint, payer, connection } = await createStructureEquivalentMint(rpcUrl, profile);

    const ctx = { profile, connection, mint, payer, rpcUrl };

    const results: ScenarioResult[] = [];
    for (const kind of scenarios) {
      const entry = SCENARIO_REGISTRY[kind];
      if (!entry) {
        results.push(unimplementedScenario(kind));
        continue;
      }
      const result = await entry.live(ctx);
      results.push(result);
    }

    return results;
  } finally {
    stopValidator(proc);
  }
}
