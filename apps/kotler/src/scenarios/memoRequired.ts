import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import { Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import type { ScenarioResult } from "@tarani/shared";
import { extractLogs, extractErrorMessage, extractFailureCode } from "../worker/logParser";
import type { ScenarioEntry, HeuristicContext, LiveContext } from "./types";

// SPL Memo program address
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

function buildMemoInstruction(signer: PublicKey, text: string): TransactionInstruction {
  return new TransactionInstruction({
    keys: [{ pubkey: signer, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(text, "utf-8"),
  });
}

function heuristic({ profile }: HeuristicContext): ScenarioResult {
  const start = Date.now();

  const isNonTransferable = profile.extensions.some((e) => e.kind === "nonTransferable");
  if (isNonTransferable) {
    return {
      id: crypto.randomUUID(),
      kind: "memo_required",
      outcome: "blocked",
      summary: "Token is non-transferable. Memo requirement is irrelevant.",
      durationMs: Date.now() - start,
      failureCode: "NON_TRANSFERABLE",
    };
  }

  const hasMemoTransfer = profile.extensions.some((e) => e.kind === "memoTransfer");
  if (hasMemoTransfer) {
    return {
      id: crypto.randomUUID(),
      kind: "memo_required",
      outcome: "warning",
      summary:
        "MemoTransfer extension is present. Incoming transfers to accounts with this extension require an attached memo instruction, or they will be rejected.",
      durationMs: Date.now() - start,
    };
  }

  return {
    id: crypto.randomUUID(),
    kind: "memo_required",
    outcome: "success",
    summary: "No memo requirement detected. Transfers can be sent without a memo.",
    durationMs: Date.now() - start,
  };
}

async function live({ connection, mint, payer }: LiveContext): Promise<ScenarioResult> {
  const start = Date.now();
  const recipient = Keypair.generate();
  const AMOUNT = 1_000_000n;

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
      Number(AMOUNT) * 2,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    // Attempt 1: transfer WITHOUT memo (expected to fail if memoTransfer is enforced)
    let transferWithoutMemoFailed = false;
    try {
      const txNoMemo = new Transaction().add(
        createTransferCheckedInstruction(
          senderAta.address,
          mint.publicKey,
          recipientAta.address,
          payer.publicKey,
          AMOUNT,
          9,
          [],
          TOKEN_2022_PROGRAM_ID,
        ),
      );
      await sendAndConfirmTransaction(connection, txNoMemo, [payer]);
    } catch {
      transferWithoutMemoFailed = true;
    }

    // Attempt 2: transfer WITH memo
    const txWithMemo = new Transaction().add(
      buildMemoInstruction(payer.publicKey, "Tarani simulation"),
      createTransferCheckedInstruction(
        senderAta.address,
        mint.publicKey,
        recipientAta.address,
        payer.publicKey,
        AMOUNT,
        9,
        [],
        TOKEN_2022_PROGRAM_ID,
      ),
    );
    await sendAndConfirmTransaction(connection, txWithMemo, [payer]);

    if (transferWithoutMemoFailed) {
      return {
        id: crypto.randomUUID(),
        kind: "memo_required",
        outcome: "warning",
        summary:
          "Transfer without memo was rejected; transfer with memo succeeded. Memo is required for this token.",
        durationMs: Date.now() - start,
      };
    }

    return {
      id: crypto.randomUUID(),
      kind: "memo_required",
      outcome: "success",
      summary: "Both memo and non-memo transfers succeeded. Memo is not enforced on this token.",
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
      kind: "memo_required",
      outcome: "error",
      summary: `Live memo test failed: ${message}`,
      durationMs: Date.now() - start,
      failureCode,
      logs,
    };
  }
}

export const memoRequiredScenario: ScenarioEntry = {
  kind: "memo_required",
  heuristic,
  live,
};
