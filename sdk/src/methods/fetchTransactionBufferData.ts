import type { Connection, PublicKey } from "@solana/web3.js";
import { getTransactionBuffer, program } from "../utils/index.js";

export async function fetchTransactionBufferData(
  connection: Connection,
  walletAddress: PublicKey,
  creator: PublicKey,
  index: number
) {
  const transactionBuffer = getTransactionBuffer(walletAddress, creator, index);
  const accountInfo = await connection.getAccountInfo(transactionBuffer);
  return accountInfo?.data
    ? program.coder.accounts.decode("transactionBuffer", accountInfo.data)
    : null;
}
