import type { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { type Account, thawAccount, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

/**
 * Thaw a test token account if it was created frozen (DefaultAccountState=Frozen).
 * The structure-equivalent mint is built with the payer as its freeze authority,
 * so the worker can thaw its own accounts. This lets transfer-fee / transfer-hook
 * / memo scenarios exercise the real transfer mechanic on default-frozen mints
 * instead of erroring "Account is frozen" — the frozen-by-default behavior itself
 * is already reported by the freeze_check and associated_token_create scenarios.
 */
export async function thawIfFrozen(
  connection: Connection,
  payer: Keypair,
  account: Account,
  mint: PublicKey,
): Promise<void> {
  if (!account.isFrozen) return;
  await thawAccount(
    connection,
    payer,
    account.address,
    mint,
    payer,
    [],
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );
}
