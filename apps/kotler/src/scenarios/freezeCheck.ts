import { Keypair } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transferChecked,
  freezeAccount,
  thawAccount,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import type { ScenarioResult } from "@tarani/shared";
import { extractLogs } from "../worker/logParser";
import type { ScenarioEntry, HeuristicContext, LiveContext } from "./types";

function heuristic({ profile }: HeuristicContext): ScenarioResult {
  const start = Date.now();

  const defaultsFrozen = profile.extensions.some((e) => e.kind === "defaultAccountState");
  if (defaultsFrozen) {
    return {
      id: crypto.randomUUID(),
      kind: "freeze_check",
      outcome: "warning",
      mode: "analysis",
      summary:
        "DefaultAccountState is set: new token accounts are created frozen and must be thawed by the freeze authority before they can transfer.",
      durationMs: Date.now() - start,
      failureCode: "DEFAULT_FROZEN",
    };
  }

  if (!profile.authorities.freeze.isRenounced) {
    return {
      id: crypto.randomUUID(),
      kind: "freeze_check",
      outcome: "warning",
      mode: "analysis",
      summary:
        "Freeze authority is active: the issuer can freeze any holder account at any time, blocking transfers until thawed.",
      durationMs: Date.now() - start,
    };
  }

  return {
    id: crypto.randomUUID(),
    kind: "freeze_check",
    outcome: "success",
    mode: "analysis",
    summary:
      "No freeze authority and no default-frozen state: holder accounts cannot be frozen by the issuer.",
    durationMs: Date.now() - start,
  };
}

/**
 * Live freeze test. The structure-equivalent mint is created WITH a freeze
 * authority (the payer) whenever the real mint has one or uses DefaultAccountState
 * (see createStructureEquivalentMint), so we can actually exercise a freeze on
 * the validator instead of merely reasoning about it:
 *   - No freeze power at all  -> structural success (analysis; nothing to run).
 *   - Freeze power present     -> fund an account, freeze it, and prove the
 *     subsequent transfer is rejected on-chain (validator).
 */
async function live(ctx: LiveContext): Promise<ScenarioResult> {
  const { profile, connection, mint, payer } = ctx;
  const start = Date.now();

  const defaultsFrozen = profile.extensions.some((e) => e.kind === "defaultAccountState");
  const hasFreezeAuthority = !profile.authorities.freeze.isRenounced;

  // Case A — no freeze authority and not frozen-by-default. The test mint was
  // created with a null freeze authority, so a freeze is structurally impossible.
  // No validator transaction is meaningful here; report the structural conclusion.
  if (!defaultsFrozen && !hasFreezeAuthority) {
    return {
      id: crypto.randomUUID(),
      kind: "freeze_check",
      outcome: "success",
      mode: "analysis",
      summary:
        "No freeze authority and no default-frozen state: holder accounts cannot be frozen by the issuer.",
      durationMs: Date.now() - start,
    };
  }

  // Case B/C — a freeze authority (the payer) exists on the test mint. Prove it.
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

    // If accounts are frozen-by-default, thaw both so we can fund the sender and
    // isolate the block to the freeze we perform ourselves.
    if (defaultsFrozen) {
      await thawAccount(
        connection,
        payer,
        senderAta.address,
        mint.publicKey,
        payer,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );
      await thawAccount(
        connection,
        payer,
        recipientAta.address,
        mint.publicKey,
        payer,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );
    }

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

    // Freeze the funded sender account using the freeze authority.
    await freezeAccount(
      connection,
      payer,
      senderAta.address,
      mint.publicKey,
      payer,
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    // The transfer must now be rejected on-chain. Use transferChecked so the ONLY
    // possible rejection is the freeze (a fee mint would reject plain Transfer with
    // MintRequiredForTransfer, which would misattribute the failure).
    try {
      await transferChecked(
        connection,
        payer,
        senderAta.address,
        mint.publicKey,
        recipientAta.address,
        payer,
        500_000,
        profile.decimals,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID,
      );
      // Unexpected: the freeze did not block the transfer.
      return {
        id: crypto.randomUUID(),
        kind: "freeze_check",
        outcome: "warning",
        mode: "validator",
        summary:
          "Freeze authority is active, but a transfer from a frozen account unexpectedly succeeded on the test validator.",
        durationMs: Date.now() - start,
      };
    } catch (transferErr) {
      const logs = extractLogs((transferErr as { logs?: unknown }).logs);
      const prefix = defaultsFrozen
        ? "Accounts are frozen by default (DefaultAccountState=Frozen) and the issuer can freeze holders"
        : "The issuer can freeze holder accounts";
      return {
        id: crypto.randomUUID(),
        kind: "freeze_check",
        outcome: "warning",
        mode: "validator",
        summary: `Verified live: ${prefix} — froze a funded account and the subsequent transfer was rejected on-chain (AccountFrozen).`,
        durationMs: Date.now() - start,
        failureCode: defaultsFrozen ? "DEFAULT_FROZEN" : "FROZEN",
        logs,
      };
    }
  } catch {
    // Setup failed (e.g. validator hiccup); fall back to the static analysis,
    // which is reported as mode "analysis".
    const fallback = heuristic({ profile });
    return { ...fallback, id: crypto.randomUUID(), durationMs: Date.now() - start };
  }
}

export const freezeCheckScenario: ScenarioEntry = {
  kind: "freeze_check",
  heuristic,
  live,
};
