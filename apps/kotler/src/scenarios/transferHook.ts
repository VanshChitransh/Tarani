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
      kind: "transfer_hook",
      outcome: "blocked",
      summary: "Token is non-transferable. Hook execution is irrelevant — transfers are rejected.",
      durationMs: Date.now() - start,
      failureCode: "NON_TRANSFERABLE",
    };
  }

  const hookExt = profile.extensions.find((e) => e.kind === "transferHook");
  if (!hookExt) {
    return {
      id: crypto.randomUUID(),
      kind: "transfer_hook",
      outcome: "success",
      summary: "No transfer hook configured. Transfers proceed without hook invocation.",
      durationMs: Date.now() - start,
    };
  }

  const hookProgramId = hookExt.parameters["programId"] as string | undefined;
  const hasProgram = typeof hookProgramId === "string" && hookProgramId.length > 0;

  return {
    id: crypto.randomUUID(),
    kind: "transfer_hook",
    outcome: "warning",
    summary: hasProgram
      ? `Transfer hook is active (program: ${hookProgramId}). Every transfer invokes this on-chain program.`
      : "Transfer hook extension present but no hook program is set. Transfers succeed until a program is assigned.",
    durationMs: Date.now() - start,
  };
}

async function live(ctx: LiveContext): Promise<ScenarioResult> {
  const { profile, connection, mint, payer } = ctx;
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
      kind: "transfer_hook",
      outcome: "success",
      summary:
        "Live transfer with hook extension succeeded. Hook program was not invoked (not cloned into test validator).",
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const rawLogs = (err as { logs?: unknown }).logs;
    const logs = extractLogs(rawLogs);
    const failureCode = extractFailureCode(logs);
    const message =
      extractErrorMessage(logs) ?? (err instanceof Error ? err.message : "Unknown error");

    // Hook program missing in test validator → fall back to heuristic result
    const isHookMissing =
      message.toLowerCase().includes("invalid program") ||
      message.toLowerCase().includes("program not found");

    if (isHookMissing) {
      const heuristicResult = heuristic({ profile });
      return {
        ...heuristicResult,
        id: crypto.randomUUID(),
        summary: `[heuristic fallback] Hook program not available in test validator. ${heuristicResult.summary}`,
        durationMs: Date.now() - start,
      };
    }

    return {
      id: crypto.randomUUID(),
      kind: "transfer_hook",
      outcome: "error",
      summary: `Live transfer hook test failed: ${message}`,
      durationMs: Date.now() - start,
      failureCode,
      logs,
    };
  }
}

export const transferHookScenario: ScenarioEntry = {
  kind: "transfer_hook",
  heuristic,
  live,
};
