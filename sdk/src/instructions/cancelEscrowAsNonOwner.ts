import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { getEscrow, getEscrowNativeVault, program } from "../utils/index.js";

export async function cancelEscrowAsNonOwner({
  proposer,
  identifier,
  walletAddress,
  mint = null,
  tokenProgram = null,
}: {
  proposer: PublicKey;
  identifier: number;
  walletAddress: PublicKey;
  mint?: PublicKey | null;
  tokenProgram?: PublicKey | null;
}) {
  const escrow = getEscrow(walletAddress, identifier);
  const escrowVault = getEscrowNativeVault(walletAddress, identifier);
  let escrowTokenVault = null;
  let proposerTokenAccount = null;
  if (mint && tokenProgram) {
    escrowTokenVault = getAssociatedTokenAddressSync(
      mint,
      escrowVault,
      true,
      tokenProgram
    );
    proposerTokenAccount = getAssociatedTokenAddressSync(
      mint,
      proposer,
      false,
      tokenProgram
    );
  }
  return await program.methods
    .cancelEscrowAsNonOwner()
    .accountsPartial({
      escrow,
      proposer,
      escrowVault,
      escrowTokenVault,
      proposerTokenAccount,
      mint,
      tokenProgram,
    })
    .instruction();
}
