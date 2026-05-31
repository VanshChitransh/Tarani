import { Keypair } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transferChecked,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import type { ScenarioResult } from "@tarani/shared";
import { readTransferFeeConfig } from "@tarani/gilfoyle";
import { extractLogs, extractErrorMessage, extractFailureCode } from "../worker/logParser";
import { thawIfFrozen } from "../validator/accounts";
import type { ScenarioEntry, HeuristicContext, LiveContext } from "./types";

function heuristic({ profile }: HeuristicContext): ScenarioResult {
  const start = Date.now();

  const isNonTransferable = profile.extensions.some((e) => e.kind === "nonTransferable");
  if (isNonTransferable) {
    return {
      id: crypto.randomUUID(),
      kind: "transfer_fee",
      outcome: "blocked",
      mode: "analysis",
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
      mode: "analysis",
      summary: "No transfer fee configured. Recipients receive the full transfer amount.",
      durationMs: Date.now() - start,
    };
  }

  // Read the ACTUAL current rate via the shared reader (Helius nests it under
  // newer_transfer_fee; the old code read the wrong key and always saw 0).
  const { basisPoints, maximumFee } = readTransferFeeConfig(feeExt);
  const bps = basisPoints ?? 0;
  const maxFee = maximumFee ?? 0n;
  const pct = (bps / 100).toFixed(2);

  // A 0 bps fee withholds nothing today — call it out instead of warning about a
  // fee that is not actually charged (the authority can still raise it later).
  if (bps === 0) {
    return {
      id: crypto.randomUUID(),
      kind: "transfer_fee",
      outcome: "success",
      mode: "analysis",
      summary: `Transfer-fee extension present but the current rate is 0% (0 bps), so no fee is withheld. The fee authority can raise it later (max fee: ${maxFee} base units).`,
      durationMs: Date.now() - start,
    };
  }

  return {
    id: crypto.randomUUID(),
    kind: "transfer_fee",
    outcome: "warning",
    mode: "analysis",
    summary: `Transfer fee: ${pct}% (${bps} bps), max fee: ${maxFee} base units. Fee is withheld in the recipient account and must be harvested.`,
    durationMs: Date.now() - start,
  };
}

async function live({ profile, connection, mint, payer }: LiveContext): Promise<ScenarioResult> {
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

    // Thaw if frozen-by-default so the fee can actually be measured.
    await thawIfFrozen(connection, payer, senderAta, mint.publicKey);
    await thawIfFrozen(connection, payer, recipientAta, mint.publicKey);

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
      profile.decimals, // must match the mint's actual decimals or transferChecked rejects
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
      mode: "validator",
      summary: `Live transfer of ${TRANSFER_AMOUNT} units on the test validator: recipient received ${received}, fee withheld: ${withheld}.`,
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
      mode: "validator",
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
