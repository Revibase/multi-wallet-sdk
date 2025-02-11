import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  addJitoTip,
  createTransactionBuffer,
  createVaultExecute,
} from "../instructions/index.js";
import {
  ADDRESS_LOOK_UP_TABLE,
  estimateJitoTips,
  program,
  simulateTransaction,
} from "../utils/index.js";

export async function createTransactionBundle({
  feePayer,
  instructions,
  walletAddress,
  creator,
  signers,
  lookUpTables,
  tipAmount,
}: {
  signers: PublicKey[];
  feePayer: PublicKey;
  instructions: TransactionInstruction[];
  walletAddress: PublicKey;
  creator: PublicKey;
  tipAmount?: number;
  lookUpTables?: AddressLookupTableAccount[];
}) {
  const connection = program().provider.connection;
  const simulation = await simulateTransaction(
    connection,
    instructions,
    feePayer,
    lookUpTables,
    true,
    false,
    true
  );

  if (simulation.value.err)
    throw new Error(`${JSON.stringify(simulation.value)}`);

  const {
    bufferIndex,
    transactionMessage,
    compiledMessage,
    transactionBufferExtendIx,
    transactionBufferIx,
  } = await createTransactionBuffer({
    feePayer,
    instructions,
    walletAddress,
    creator,
    lookUpTables,
  });
  const { vaultTransactionExecuteIx, lookupTableAccounts } =
    await createVaultExecute({
      walletAddress,
      feePayer,
      signers,
      creator,
      bufferIndex,
      transactionMessage,
      compiledMessage,
    });
  tipAmount = tipAmount || (await estimateJitoTips());
  const tipIx = await addJitoTip({ feePayer, tipAmount });
  const addressLookUpTable = (
    await connection.getAddressLookupTable(ADDRESS_LOOK_UP_TABLE)
  ).value;
  const result: {
    id: string;
    signers: PublicKey[];
    feePayer: PublicKey;
    ixs: TransactionInstruction[];
    lookupTableAccounts?: AddressLookupTableAccount[];
  }[] = [];
  result.push({
    id: "Create Transaction Buffer",
    signers: [creator],
    feePayer,
    ixs: [transactionBufferIx],
  });

  if (transactionBufferExtendIx) {
    result.push({
      id: "Extend Transaction Buffer",
      signers: [creator],
      feePayer,
      ixs: [transactionBufferExtendIx],
    });
  }
  result.push({
    id: "Execute Transaction",
    signers,
    feePayer,
    ixs: [vaultTransactionExecuteIx, tipIx],
    lookupTableAccounts: lookupTableAccounts.concat(addressLookUpTable ?? []),
  });

  return { result, tipAmount };
}
