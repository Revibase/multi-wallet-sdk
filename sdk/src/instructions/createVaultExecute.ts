import { Connection, MessageV0, PublicKey } from "@solana/web3.js";
import { type TransactionMessage } from "../types/index.js";
import {
  accountsForTransactionExecute,
  getMultiSigFromAddress,
  getTransactionBuffer,
  getVaultFromAddress,
  program,
} from "../utils/index.js";

export async function createVaultExecute({
  connection,
  walletAddress,
  creator,
  signers,
  feePayer,
  bufferIndex,
  compiledMessage,
  transactionMessage,
}: {
  connection: Connection;
  walletAddress: PublicKey;
  creator: PublicKey;
  feePayer: PublicKey;
  signers: PublicKey[];
  bufferIndex: number;
  compiledMessage: MessageV0;
  transactionMessage: TransactionMessage;
}) {
  const multisigPda = getMultiSigFromAddress(walletAddress);
  const vaultPda = getVaultFromAddress(walletAddress);
  const transactionBuffer = getTransactionBuffer(
    walletAddress,
    creator,
    bufferIndex
  );

  const { accountMetas, lookupTableAccounts } =
    await accountsForTransactionExecute({
      connection,
      message: compiledMessage,
      transactionMessage,
      vaultPda,
      signers,
    });

  const vaultTransactionExecuteIx = await program.methods
    .vaultTransactionExecute(0)
    .accountsPartial({
      multiWallet: multisigPda,
      transactionBuffer,
      rentPayer: feePayer,
    })
    .remainingAccounts(accountMetas)
    .instruction();

  return {
    vaultTransactionExecuteIx,
    lookupTableAccounts,
  };
}
