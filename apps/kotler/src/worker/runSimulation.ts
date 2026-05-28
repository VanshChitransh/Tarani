import type { SimulationReport, SimulationRequest } from "@tarani/shared";

// Implemented in S4 — stub satisfies server.ts import during S2/S3 build.
export async function runSimulation(_request: SimulationRequest): Promise<SimulationReport> {
  throw new Error("runSimulation not yet implemented");
}
