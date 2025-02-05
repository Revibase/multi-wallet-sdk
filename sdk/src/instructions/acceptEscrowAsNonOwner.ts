import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { Member } from "../types/index.js";
import { getEscrow, program } from "../utils/index.js";

export async function acceptEscrowAsNonOwner({
  recipient,
  feePayer,
  identifier,
  walletAddress,
  threshold,
  newMembers,
  mint = null,
  tokenProgram = null,
}: {
  recipient: PublicKey;
  feePayer: PublicKey;
  identifier: number;
  walletAddress: PublicKey;
  threshold: number;
  newMembers: Member[];
  mint?: PublicKey | null;
  tokenProgram?: PublicKey | null;
}) {
  const escrow = getEscrow(walletAddress, identifier);
  let payerTokenAccount = null;
  let recipientTokenAccount = null;
  if (mint && tokenProgram) {
    payerTokenAccount = getAssociatedTokenAddressSync(
      mint,
      feePayer,
      false,
      tokenProgram
    );
    recipientTokenAccount = getAssociatedTokenAddressSync(
      mint,
      recipient,
      false,
      tokenProgram
    );
  }
  return await program.methods
    .executeEscrowAsNonOwner(newMembers, threshold)
    .accountsPartial({
      escrow,
      payer: feePayer,
      recipient,
      recipientTokenAccount,
      payerTokenAccount,
      mint,
      tokenProgram,
    })
    .instruction();
}
