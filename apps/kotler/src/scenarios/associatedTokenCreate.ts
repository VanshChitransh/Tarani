import {
  getOrCreateAssociatedTokenAccount,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import type { ScenarioResult } from "@tarani/shared";
import { extractLogs, extractErrorMessage, extractFailureCode } from "../worker/logParser";
import type { ScenarioEntry, HeuristicContext, LiveContext } from "./types";

function heuristic({ profile }: HeuristicContext): ScenarioResult {
  const start = Date.now();

  const defaultsFrozen = profile.extensions.some((e) => e.kind === "defaultAccountState");
  if (defaultsFrozen) {
    return {
      id: crypto.randomUUID(),
      kind: "associated_token_create",
      outcome: "warning",
      mode: "analysis",
      summary:
        "An associated token account can be created, but the DefaultAccountState extension may create it frozen, requiring the freeze authority to thaw it before use.",
      durationMs: Date.now() - start,
    };
  }

  return {
    id: crypto.randomUUID(),
    kind: "associated_token_create",
    outcome: "success",
    mode: "analysis",
    summary: "A standard associated token account can be created for this mint.",
    durationMs: Date.now() - start,
  };
}

async function live({ connection, mint, payer }: LiveContext): Promise<ScenarioResult> {
  const start = Date.now();
  try {
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint.publicKey,
      payer.publicKey,
      false,
      "confirmed",
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    const account = await getAccount(connection, ata.address, "confirmed", TOKEN_2022_PROGRAM_ID);
    if (account.isFrozen) {
      return {
        id: crypto.randomUUID(),
        kind: "associated_token_create",
        outcome: "warning",
        mode: "validator",
        summary:
          "Associated token account created, but it is frozen on creation (DefaultAccountState=Frozen). Holders must be thawed before transacting.",
        durationMs: Date.now() - start,
      };
    }

    return {
      id: crypto.randomUUID(),
      kind: "associated_token_create",
      outcome: "success",
      mode: "validator",
      summary: "Associated token account created successfully on the test validator.",
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const rawLogs = (err as { logs?: unknown }).logs;
    const logs = extractLogs(rawLogs);
    const failureCode = extractFailureCode(logs);
    const message =
      extractErrorMessage(logs) ?? (err instanceof Error ? err.message : "Unknown error");

    return {
      id: crypto.randomUUID(),
      kind: "associated_token_create",
      outcome: "error",
      mode: "validator",
      summary: `Live ATA creation failed: ${message}`,
      durationMs: Date.now() - start,
      failureCode,
      logs,
    };
  }
}

export const associatedTokenCreateScenario: ScenarioEntry = {
  kind: "associated_token_create",
  heuristic,
  live,
};
