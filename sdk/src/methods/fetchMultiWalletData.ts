import type { PublicKey } from "@solana/web3.js";
import { getMultiSigFromAddress, program } from "../utils/index.js";

export async function fetchMultiWalletData(walletAddress: PublicKey) {
  const multiWallet = getMultiSigFromAddress(walletAddress);
  return program().account.multiWallet.fetch(multiWallet);
}
