import { sha256 } from "@noble/hashes/sha256";
import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
} from "@solana/web3.js";
import { transactionMessageBeet } from "../types/index.js";
import {
  getMultiSigFromAddress,
  getTransactionBuffer,
  program,
  transactionMessageSerialize,
  transactionMessageToCompileMessage,
} from "../utils/index.js";

export async function createTransactionBuffer({
  feePayer,
  instructions,
  walletAddress,
  creator,
  lookUpTables,
}: {
  feePayer: PublicKey;
  instructions: TransactionInstruction[];
  walletAddress: PublicKey;
  creator: PublicKey;
  lookUpTables?: AddressLookupTableAccount[];
}) {
  const multisigPda = getMultiSigFromAddress(walletAddress);

  const transactionMessageTx = new TransactionMessage({
    payerKey: feePayer,
    recentBlockhash: PublicKey.default.toString(),
    instructions,
  });

  const compiledMessage = transactionMessageToCompileMessage({
    message: transactionMessageTx,
    addressLookupTableAccounts: lookUpTables,
  });

  const transactionMessageBytes = transactionMessageSerialize(compiledMessage);

  const hash = sha256(transactionMessageBytes);

  const bufferIndex = Math.round(Math.random() * 255);
  const transactionBuffer = getTransactionBuffer(
    walletAddress,
    creator,
    bufferIndex
  );

  let messageBytePart1 = transactionMessageBytes;
  let messageBytePart2: Buffer<ArrayBufferLike> | null = null;

  if (transactionMessageBytes.length > 900) {
    messageBytePart1 = transactionMessageBytes.slice(0, 900);
    messageBytePart2 = transactionMessageBytes.slice(900);
  }
  const transactionBufferIx = await program()
    .methods.transactionBufferCreate({
      bufferIndex,
      vaultIndex: 0,
      finalBufferHash: Array.from(hash),
      finalBufferSize: transactionMessageBytes.length,
      buffer: messageBytePart1,
    })
    .accountsPartial({
      multiWallet: multisigPda,
      rentPayer: feePayer,
      creator,
    })
    .instruction();

  let transactionBufferExtendIx: TransactionInstruction | null = null;
  if (messageBytePart2) {
    transactionBufferExtendIx = await program()
      .methods.transactionBufferExtend({ buffer: messageBytePart2 })
      .accountsPartial({
        transactionBuffer,
        creator,
      })
      .instruction();
  }

  return {
    transactionBufferIx,
    transactionBufferExtendIx,
    compiledMessage,
    transactionMessage: transactionMessageBeet.deserialize(
      transactionMessageBytes
    )[0],
    bufferIndex,
  };
}
