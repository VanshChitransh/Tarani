import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  createInitializeDefaultAccountStateInstruction,
  createInitializePermanentDelegateInstruction,
  createInitializeNonTransferableMintInstruction,
  ExtensionType,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
  AccountState,
} from "@solana/spl-token";
import type { MintProfile } from "@tarani/shared";

export interface TestMintSetup {
  mint: Keypair;
  payer: Keypair;
  connection: Connection;
}

function extensionTypeForKind(kind: string): ExtensionType | null {
  const map: Record<string, ExtensionType> = {
    transferFeeConfig: ExtensionType.TransferFeeConfig,
    defaultAccountState: ExtensionType.DefaultAccountState,
    permanentDelegate: ExtensionType.PermanentDelegate,
    nonTransferable: ExtensionType.NonTransferable,
    memoTransfer: ExtensionType.MemoTransfer,
    // transferHook and confidentialTransferMint skipped — hook program may not exist in test env
  };
  return map[kind] ?? null;
}

export async function buildExtensionInits(
  profile: MintProfile,
  mint: Keypair,
  payer: Keypair,
): Promise<Parameters<typeof Transaction.prototype.add>[0][]> {
  const ixs: Parameters<typeof Transaction.prototype.add>[0][] = [];

  for (const ext of profile.extensions) {
    switch (ext.kind) {
      case "transferFeeConfig": {
        const feeBasisPoints =
          (ext.parameters["transferFeeBasisPoints"] as number | undefined) ?? 0;
        const maxFee = BigInt((ext.parameters["maximumFee"] as string | undefined) ?? "0");
        ixs.push(
          createInitializeTransferFeeConfigInstruction(
            mint.publicKey,
            payer.publicKey,
            payer.publicKey,
            feeBasisPoints,
            maxFee,
            TOKEN_2022_PROGRAM_ID,
          ),
        );
        break;
      }
      case "defaultAccountState": {
        ixs.push(
          createInitializeDefaultAccountStateInstruction(
            mint.publicKey,
            AccountState.Frozen,
            TOKEN_2022_PROGRAM_ID,
          ),
        );
        break;
      }
      case "permanentDelegate": {
        ixs.push(
          createInitializePermanentDelegateInstruction(
            mint.publicKey,
            payer.publicKey,
            TOKEN_2022_PROGRAM_ID,
          ),
        );
        break;
      }
      case "nonTransferable": {
        ixs.push(
          createInitializeNonTransferableMintInstruction(mint.publicKey, TOKEN_2022_PROGRAM_ID),
        );
        break;
      }
      // transferHook, confidentialTransferMint, and others are gracefully skipped
    }
  }

  return ixs;
}

export async function createStructureEquivalentMint(
  rpcUrl: string,
  profile: MintProfile,
): Promise<TestMintSetup> {
  const connection = new Connection(rpcUrl, "confirmed");
  const payer = Keypair.generate();
  const mint = Keypair.generate();

  // Airdrop SOL to payer
  const sig = await connection.requestAirdrop(payer.publicKey, 2_000_000_000);
  await connection.confirmTransaction(sig);

  // Determine which extension types we need space for
  const extensionTypes = profile.extensions
    .map((e) => extensionTypeForKind(e.kind))
    .filter((et): et is ExtensionType => et !== null);

  const mintLen = getMintLen(extensionTypes);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  const extensionInits = await buildExtensionInits(profile, mint, payer);

  // A mint with DefaultAccountState=Frozen (or any active freeze authority) must
  // be created WITH a freeze authority, or InitializeMint fails with custom error
  // 0x10 ("This token mint cannot freeze accounts"). Use the payer as the local
  // stand-in so the structural clone is valid and freeze scenarios stay realistic.
  const needsFreezeAuthority =
    profile.authorities.freeze.address !== null ||
    profile.extensions.some((e) => e.kind === "defaultAccountState");
  const freezeAuthority = needsFreezeAuthority ? payer.publicKey : null;

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint.publicKey,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    ...extensionInits,
    createInitializeMintInstruction(
      mint.publicKey,
      profile.decimals,
      payer.publicKey,
      freezeAuthority,
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  await sendAndConfirmTransaction(connection, tx, [payer, mint]);

  return { mint, payer, connection };
}
