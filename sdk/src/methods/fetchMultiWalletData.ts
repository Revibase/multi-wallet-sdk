import type { Connection, PublicKey } from "@solana/web3.js";
import { getMultiSigFromAddress, program } from "../utils/index.js";

export async function fetchMultiWalletData(
  connection: Connection,
  walletAddress: PublicKey
) {
  const multiWallet = getMultiSigFromAddress(walletAddress);
  const accountInfo = await connection.getAccountInfo(multiWallet);
  return accountInfo?.data
    ? program.coder.accounts.decode("multiWallet", accountInfo.data)
    : null;
}
