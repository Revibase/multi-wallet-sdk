import { bignum, u32, u64, u8 } from "@metaplex-foundation/beet";
import {
  AccountMeta,
  AddressLookupTableAccount,
  Connection,
  MessageV0,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import invariant from "invariant";
import { compileToWrappedMessageV0 } from "./compileToWrappedMessageV0";
import { MultisigCompiledInstruction } from "./types/MultisigCompiledInstruction";
import { MultisigMessageAddressTableLookup } from "./types/MultisigMessageAddressTableLookup";
import {
  VaultTransactionMessage,
  vaultTransactionMessageBeet,
} from "./types/VaultTransactionMessage";

export function toUtfBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function toU8Bytes(num: number): Uint8Array {
  const bytes = Buffer.alloc(1);
  u8.write(bytes, 0, num);
  return bytes;
}

export function toU32Bytes(num: number): Uint8Array {
  const bytes = Buffer.alloc(4);
  u32.write(bytes, 0, num);
  return bytes;
}

export function toU64Bytes(num: bigint): Uint8Array {
  const bytes = Buffer.alloc(8);
  u64.write(bytes, 0, num);
  return bytes;
}

export function toBigInt(number: bignum): bigint {
  return BigInt(number.toString());
}

const MAX_TX_SIZE_BYTES = 1232;
const STRING_LEN_SIZE = 4;
export function getAvailableMemoSize(
  txWithoutMemo: VersionedTransaction
): number {
  const txSize = txWithoutMemo.serialize().length;
  return (
    MAX_TX_SIZE_BYTES -
    txSize -
    STRING_LEN_SIZE -
    // Sometimes long memo can trigger switching from 1 to 2 bytes length encoding in Compact-u16,
    // so we reserve 1 extra byte to make sure.
    1
  );
}

export function isStaticWritableIndex(
  message: VaultTransactionMessage,
  index: number
) {
  const numAccountKeys = message.numAccountKeys;
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

export function isSignerIndex(message: VaultTransactionMessage, index: number) {
  return index < message.numSigners;
}

export function transactionMessageToCompileMessage({
  message,
  addressLookupTableAccounts,
}: {
  message: TransactionMessage;
  addressLookupTableAccounts?: AddressLookupTableAccount[];
}) {
  const compiledMessage = compileToWrappedMessageV0({
    payerKey: message.payerKey,
    recentBlockhash: message.recentBlockhash,
    instructions: message.instructions,
    addressLookupTableAccounts,
  });

  return compiledMessage;
}

export function transactionMessageSerialize(compiledMessage: MessageV0) {
  const [transactionMessageBytes] = vaultTransactionMessageBeet.serialize({
    numSigners: compiledMessage.header.numRequiredSignatures,
    numWritableSigners:
      compiledMessage.header.numRequiredSignatures -
      compiledMessage.header.numReadonlySignedAccounts,
    numWritableNonSigners:
      compiledMessage.staticAccountKeys.length -
      compiledMessage.header.numRequiredSignatures -
      compiledMessage.header.numReadonlyUnsignedAccounts,
    numAccountKeys: compiledMessage.staticAccountKeys.length,
    instructions: compiledMessage.compiledInstructions.map((ix) => {
      return {
        programIdIndex: ix.programIdIndex,
        accountIndexes: new Uint8Array(ix.accountKeyIndexes),
        data: ix.data,
      } as MultisigCompiledInstruction;
    }),
    addressTableLookups: compiledMessage.addressTableLookups.map((atl) => {
      return {
        accountKey: atl.accountKey,
        writableIndexes: new Uint8Array(atl.writableIndexes),
        readonlyIndexes: new Uint8Array(atl.readonlyIndexes),
      } as MultisigMessageAddressTableLookup;
    }),
  });
  return transactionMessageBytes;
}

/** Populate remaining accounts required for execution of the transaction. */
export async function accountsForTransactionExecute({
  connection,
  vaultPda,
  vaultMessage,
  message,
  signers,
}: {
  connection: Connection;
  message: MessageV0;
  vaultMessage: VaultTransactionMessage;
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
      isWritable: isStaticWritableIndex(vaultMessage, accountIndex),
      // NOTE: vaultPda cannot be marked as signers,
      // because they are PDAs and hence won't have their signatures on the transaction.
      isSigner:
        isSignerIndex(vaultMessage, accountIndex) &&
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
