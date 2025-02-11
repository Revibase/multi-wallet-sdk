import {
  type AccountMeta,
  AddressLookupTableAccount,
  Connection,
  LAMPORTS_PER_SOL,
  MessageV0,
  PublicKey,
  TransactionMessage as SolanaTransactionMessage,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import BN from "bn.js";
import { Buffer } from "buffer";
import invariant from "invariant";
import {
  type TransactionMessage,
  transactionMessageBeet,
} from "../types/index.js";
import { compileToWrappedMessageV0, program } from "./index.js";

export function getMultiSigFromAddress(address: PublicKey) {
  const [multisigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("multi_wallet"), address.toBuffer()],
    program().programId
  );

  return multisigPda;
}

export function getEscrow(walletAddress: PublicKey, identifier: number) {
  const [escrow] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      walletAddress.toBuffer(),
      new BN(identifier).toArrayLike(Buffer, "le", 8),
    ],
    program().programId
  );
  return escrow;
}

export function getEscrowNativeVault(
  walletAddress: PublicKey,
  identifier: number
) {
  const [escrow] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      walletAddress.toBuffer(),
      new BN(identifier).toArrayLike(Buffer, "le", 8),
      Buffer.from("vault"),
    ],
    program().programId
  );
  return escrow;
}

export function getVaultFromAddress(address: PublicKey, vault_index = 0) {
  const multisigPda = getMultiSigFromAddress(address);
  const [multisigVaultPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("multi_wallet"),
      multisigPda.toBuffer(),
      Buffer.from("vault"),
      new BN(vault_index).toArrayLike(Buffer, "le", 2),
    ],
    program().programId
  );
  return multisigVaultPda;
}

export function getTransactionBuffer(
  walletAddress: PublicKey,
  creator: PublicKey,
  index: number
) {
  if (index > 255) {
    throw new Error("Index cannot be greater than 255.");
  }
  const multisigPda = getMultiSigFromAddress(walletAddress);
  const [transactionBuffer] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("multi_wallet"),
      multisigPda.toBuffer(),
      Buffer.from("transaction_buffer"),
      new PublicKey(creator).toBuffer(),
      new BN(index).toArrayLike(Buffer, "le", 1),
    ],
    program().programId
  );
  return transactionBuffer;
}

export function isStaticWritableIndex(
  message: TransactionMessage,
  index: number
) {
  const numAccountKeys = message.accountKeys.length;
  const { numSigners, numWritableSigners, numWritableNonSigners } = message;

  if (index >= numAccountKeys) {
    // `index` is not a part of static `accountKeys`.
    return false;
  }

  if (index < numWritableSigners) {
    // `index` is within the range of writable signer keys.
    return true;
  }

  if (index >= numSigners) {
    // `index` is within the range of non-signer keys.
    const indexIntoNonSigners = index - numSigners;
    // Whether `index` is within the range of writable non-signer keys.
    return indexIntoNonSigners < numWritableNonSigners;
  }

  return false;
}

export function isSignerIndex(message: TransactionMessage, index: number) {
  return index < message.numSigners;
}

export function transactionMessageToCompileMessage({
  message,
  addressLookupTableAccounts,
}: {
  message: SolanaTransactionMessage;
  addressLookupTableAccounts?: AddressLookupTableAccount[];
}) {
  const compiledMessage = compileToWrappedMessageV0({
    payerKey: message.payerKey.toString(),
    recentBlockhash: message.recentBlockhash,
    instructions: message.instructions,
    addressLookupTableAccounts,
  });

  return compiledMessage;
}

export function transactionMessageSerialize(compiledMessage: MessageV0) {
  const [transactionMessageBytes] = transactionMessageBeet.serialize({
    numSigners: compiledMessage.header.numRequiredSignatures,
    numWritableSigners:
      compiledMessage.header.numRequiredSignatures -
      compiledMessage.header.numReadonlySignedAccounts,
    numWritableNonSigners:
      compiledMessage.staticAccountKeys.length -
      compiledMessage.header.numRequiredSignatures -
      compiledMessage.header.numReadonlyUnsignedAccounts,
    accountKeys: compiledMessage.staticAccountKeys,
    instructions: compiledMessage.compiledInstructions.map((ix) => {
      return {
        programIdIndex: ix.programIdIndex,
        accountIndexes: ix.accountKeyIndexes,
        data: Array.from(ix.data),
      };
    }),
    addressTableLookups: compiledMessage.addressTableLookups,
  });
  return transactionMessageBytes;
}

/** Populate remaining accounts required for execution of the transaction. */
export async function accountsForTransactionExecute({
  connection,
  vaultPda,
  transactionMessage,
  message,
  signers,
}: {
  connection: Connection;
  message: MessageV0;
  transactionMessage: TransactionMessage;
  vaultPda: PublicKey;
  signers: PublicKey[];
}): Promise<{
  /** Account metas used in the `message`. */
  accountMetas: AccountMeta[];
  /** Address lookup table accounts used in the `message`. */
  lookupTableAccounts: AddressLookupTableAccount[];
}> {
  const addressLookupTableKeys = message.addressTableLookups.map(
    ({ accountKey }) => accountKey
  );
  const addressLookupTableAccounts: Map<string, AddressLookupTableAccount> =
    new Map(
      await Promise.all(
        addressLookupTableKeys.map(async (key) => {
          const { value } = await connection.getAddressLookupTable(key);
          if (!value) {
            throw new Error(
              `Address lookup table account ${key.toBase58()} not found`
            );
          }
          return [key.toBase58(), value] as const;
        })
      )
    );

  // Populate account metas required for execution of the transaction.
  const accountMetas: AccountMeta[] = [];
  // First add the lookup table accounts used by the transaction. They are needed for on-chain validation.
  accountMetas.push(
    ...addressLookupTableKeys.map((key) => {
      return { pubkey: key, isSigner: false, isWritable: false };
    })
  );
  // Then add static account keys included into the message.
  for (const [
    accountIndex,
    accountKey,
  ] of message.staticAccountKeys.entries()) {
    accountMetas.push({
      pubkey: accountKey,
      isWritable: isStaticWritableIndex(transactionMessage, accountIndex),
      // NOTE: vaultPda cannot be marked as signers,
      // because they are PDAs and hence won't have their signatures on the transaction.
      isSigner:
        isSignerIndex(transactionMessage, accountIndex) &&
        !accountKey.equals(vaultPda),
    });
  }
  // Then add accounts that will be loaded with address lookup tables.
  for (const lookup of message.addressTableLookups) {
    const lookupTableAccount = addressLookupTableAccounts.get(
      lookup.accountKey.toBase58()
    );
    invariant(
      lookupTableAccount,
      `Address lookup table account ${lookup.accountKey.toBase58()} not found`
    );

    for (const accountIndex of lookup.writableIndexes) {
      const pubkey: PublicKey =
        lookupTableAccount.state.addresses[accountIndex];
      invariant(
        pubkey,
        `Address lookup table account ${lookup.accountKey.toBase58()} does not contain address at index ${accountIndex}`
      );
      accountMetas.push({
        pubkey,
        isWritable: true,
        // Accounts in address lookup tables can not be signers.
        isSigner: false,
      });
    }
    for (const accountIndex of lookup.readonlyIndexes) {
      const pubkey: PublicKey =
        lookupTableAccount.state.addresses[accountIndex];
      invariant(
        pubkey,
        `Address lookup table account ${lookup.accountKey.toBase58()} does not contain address at index ${accountIndex}`
      );
      accountMetas.push({
        pubkey,
        isWritable: false,
        // Accounts in address lookup tables can not be signers.
        isSigner: false,
      });
    }
  }

  // check if the required signers are included in the account metas.
  for (const signer of signers) {
    const metaIndex = accountMetas.findIndex((meta) =>
      meta.pubkey.equals(signer)
    );

    if (metaIndex !== -1) {
      // If the signer is already in accountMetas, ensure it's marked as a signer.
      accountMetas[metaIndex].isSigner = true;
    } else {
      // If the signer is not in accountMetas, add it as a non-writable signer.
      accountMetas.push({
        pubkey: signer,
        isWritable: false,
        isSigner: true,
      });
    }
  }
  return {
    accountMetas,
    lookupTableAccounts: [...addressLookupTableAccounts.values()],
  };
}

export const estimateJitoTips = async (
  level = "ema_landed_tips_50th_percentile"
) => {
  const response = await fetch(
    "https://bundles.jito.wtf/api/v1/bundles/tip_floor"
  );
  const result = await response.json();
  const tipAmount = Math.round(result[0][level] * LAMPORTS_PER_SOL) as number;

  return tipAmount;
};

export async function simulateTransaction(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  lookupTables: AddressLookupTableAccount[] = [],
  replaceRecentBlockhash = true,
  sigVerify = false,
  innerInstructions = true
) {
  const testVersionedTxn = new VersionedTransaction(
    new SolanaTransactionMessage({
      instructions,
      payerKey: payer,
      recentBlockhash: PublicKey.default.toString(),
    }).compileToV0Message(lookupTables)
  );
  const simulation = await connection.simulateTransaction(testVersionedTxn, {
    replaceRecentBlockhash,
    sigVerify,
    innerInstructions,
  });
  return simulation;
}
