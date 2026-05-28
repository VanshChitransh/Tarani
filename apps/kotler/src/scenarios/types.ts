import type { Connection, Keypair } from "@solana/web3.js";
import type { MintProfile, ScenarioKind, ScenarioResult } from "@tarani/shared";

export interface HeuristicContext {
  profile: MintProfile;
}

export interface LiveContext {
  profile: MintProfile;
  connection: Connection;
  mint: Keypair;
  payer: Keypair;
  rpcUrl: string;
}

export type HeuristicScenarioFn = (ctx: HeuristicContext) => ScenarioResult;
export type LiveScenarioFn = (ctx: LiveContext) => Promise<ScenarioResult>;

export interface ScenarioEntry {
  kind: ScenarioKind;
  heuristic: HeuristicScenarioFn;
  live: LiveScenarioFn;
}
