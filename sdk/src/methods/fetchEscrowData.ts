import type { PublicKey } from "@solana/web3.js";
import { getEscrow, program } from "../utils/index.js";

export async function fetchEscrowData(
  walletAddress: PublicKey,
  identifier: number
) {
  const escrow = getEscrow(walletAddress, identifier);
  return program().account.escrow.fetch(escrow);
}
