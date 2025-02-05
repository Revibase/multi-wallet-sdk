import type { Connection, PublicKey } from "@solana/web3.js";
import { getEscrow, program } from "../utils/index.js";

export async function fetchEscrowData(
  connection: Connection,
  walletAddress: PublicKey,
  identifier: number
) {
  const escrow = getEscrow(walletAddress, identifier);
  const accountInfo = await connection.getAccountInfo(escrow);
  return accountInfo?.data
    ? program.coder.accounts.decode("escrow", accountInfo.data)
    : null;
}
