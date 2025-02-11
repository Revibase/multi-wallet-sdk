import type { PublicKey } from "@solana/web3.js";
import { getTransactionBuffer, program } from "../utils/index.js";

export async function fetchTransactionBufferData(
  walletAddress: PublicKey,
  creator: PublicKey,
  index: number
) {
  const transactionBuffer = getTransactionBuffer(walletAddress, creator, index);
  return program().account.transactionBuffer.fetch(transactionBuffer);
}
