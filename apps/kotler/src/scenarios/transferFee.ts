import { Keypair } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transferChecked,
  getAccount,
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
      kind: "transfer_fee",
      outcome: "blocked",
      summary: "Token is non-transferable. Fee configuration is irrelevant.",
      durationMs: Date.now() - start,
      failureCode: "NON_TRANSFERABLE",
    };
  }

  const feeExt = profile.extensions.find((e) => e.kind === "transferFeeConfig");
  if (!feeExt) {
    return {
      id: crypto.randomUUID(),
      kind: "transfer_fee",
      outcome: "success",
      summary: "No transfer fee configured. Recipients receive the full transfer amount.",
      durationMs: Date.now() - start,
    };
  }

  const bps = (feeExt.parameters["transferFeeBasisPoints"] as number | undefined) ?? 0;
  const maxFee = (feeExt.parameters["maximumFee"] as string | undefined) ?? "0";
  const pct = (bps / 100).toFixed(2);

  return {
    id: crypto.randomUUID(),
    kind: "transfer_fee",
    outcome: "warning",
    summary: `Transfer fee: ${pct}% (${bps} bps), max fee: ${maxFee} base units. Fee is withheld in the recipient account and must be harvested.`,
    durationMs: Date.now() - start,
  };
}

async function live({ connection, mint, payer }: LiveContext): Promise<ScenarioResult> {
  const start = Date.now();
  const recipient = Keypair.generate();
  const TRANSFER_AMOUNT = 1_000_000n;

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
      Number(TRANSFER_AMOUNT) * 2,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    // transferChecked is required for Token-2022 fee tokens
    await transferChecked(
      connection,
      payer,
      senderAta.address,
      mint.publicKey,
      recipientAta.address,
      payer,
      TRANSFER_AMOUNT,
      9, // decimals placeholder; real decimals used at runtime via profile
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    const recipientAccount = await getAccount(
      connection,
      recipientAta.address,
      "confirmed",
      TOKEN_2022_PROGRAM_ID,
    );

    const received = recipientAccount.amount;
    const withheld = TRANSFER_AMOUNT - received;

    return {
      id: crypto.randomUUID(),
      kind: "transfer_fee",
      outcome: "success",
      summary: `Transferred ${TRANSFER_AMOUNT} units. Recipient received ${received}, fee withheld: ${withheld}.`,
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
      kind: "transfer_fee",
      outcome: "error",
      summary: `Live transfer fee test failed: ${message}`,
      durationMs: Date.now() - start,
      failureCode,
      logs,
    };
  }
}

export const transferFeeScenario: ScenarioEntry = {
  kind: "transfer_fee",
  heuristic,
  live,
};
