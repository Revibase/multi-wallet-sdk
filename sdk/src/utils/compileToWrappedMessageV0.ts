import {
  type AccountKeysFromLookups,
  AddressLookupTableAccount,
  MessageAccountKeys,
  type MessageAddressTableLookup,
  MessageV0,
  TransactionInstruction,
} from "@solana/web3.js";
import { CompiledKeys } from "./index.js";

export function compileToWrappedMessageV0({
  payerKey,
  recentBlockhash,
  instructions,
  addressLookupTableAccounts,
}: {
  payerKey: string;
  recentBlockhash: string;
  instructions: TransactionInstruction[];
  addressLookupTableAccounts?: AddressLookupTableAccount[];
}) {
  const compiledKeys = CompiledKeys.compile(instructions, payerKey);

  const addressTableLookups = new Array<MessageAddressTableLookup>();
  const accountKeysFromLookups: AccountKeysFromLookups = {
    writable: [],
    readonly: [],
  };
  const lookupTableAccounts = addressLookupTableAccounts || [];
  for (const lookupTable of lookupTableAccounts) {
    const extractResult = compiledKeys.extractTableLookup(lookupTable);
    if (extractResult !== undefined) {
      const [addressTableLookup, { writable, readonly }] = extractResult;
      addressTableLookups.push(addressTableLookup);
      accountKeysFromLookups.writable.push(...writable);
      accountKeysFromLookups.readonly.push(...readonly);
    }
  }

  const [header, staticAccountKeys] = compiledKeys.getMessageComponents();
  const accountKeys = new MessageAccountKeys(
    staticAccountKeys,
    accountKeysFromLookups
  );
  const compiledInstructions = accountKeys.compileInstructions(instructions);
  return new MessageV0({
    header,
    staticAccountKeys,
    recentBlockhash,
    compiledInstructions,
    addressTableLookups,
  });
}
