import { Keypair } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import type { ScenarioResult } from "@tarani/shared";
import { extractLogs, extractErrorMessage, extractFailureCode } from "../worker/logParser";
import type { ScenarioEntry, HeuristicContext, LiveContext } from "./types";

function heuristic({ profile }: HeuristicContext): ScenarioResult {
  const start = Date.now();

  const isNonTransferable = profile.extensions.some((e) => e.kind === "nonTransferable");
  if (isNonTransferable) {
    return {
      id: crypto.randomUUID(),
      kind: "transfer",
      outcome: "blocked",
      summary: "Token is non-transferable. All transfer attempts will be rejected by the program.",
      durationMs: Date.now() - start,
      failureCode: "NON_TRANSFERABLE",
    };
  }

  const isPausable = profile.extensions.some((e) => e.kind === "pausable");
  if (isPausable) {
    return {
      id: crypto.randomUUID(),
      kind: "transfer",
      outcome: "warning",
      summary:
        "Token has the pausable extension. Transfers succeed only when the token is not paused.",
      durationMs: Date.now() - start,
    };
  }

  return {
    id: crypto.randomUUID(),
    kind: "transfer",
    outcome: "success",
    summary: "No restrictions detected. Token transfers are expected to succeed.",
    durationMs: Date.now() - start,
  };
}

async function live({ connection, mint, payer }: LiveContext): Promise<ScenarioResult> {
  const start = Date.now();
  const recipient = Keypair.generate();

  try {
    const senderAta = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint.publicKey,
      payer.publicKey,
      false,
      "confirmed",
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    const recipientAta = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint.publicKey,
      recipient.publicKey,
      false,
      "confirmed",
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    await mintTo(
      connection,
      payer,
      mint.publicKey,
      senderAta.address,
      payer,
      1_000_000,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    await transfer(
      connection,
      payer,
      senderAta.address,
      recipientAta.address,
      payer,
      500_000,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    return {
      id: crypto.randomUUID(),
      kind: "transfer",
      outcome: "success",
      summary: "Live transfer of 500,000 units succeeded on test validator.",
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
      kind: "transfer",
      outcome: "blocked",
      summary: `Live transfer failed: ${message}`,
      durationMs: Date.now() - start,
      failureCode,
      logs,
    };
  }
}

export const transferScenario: ScenarioEntry = {
  kind: "transfer",
  heuristic,
  live,
};
